/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express, { Request, Response } from 'express';

const router = express.Router();

import { fnGetAboutMe, fnRecordVisit } from '@/candidate_me';
import { fnSearchPublicProfiles } from '@/candidate_me/search';
import { fnDownloadPublicPdf } from '@/candidate_me/public-pdf';
import routerAPI from './api/v1/index';
import routerAPIV2 from './api/v2/index';

router.use('/api/v1', routerAPI);
router.use('/api/v2', routerAPIV2);

/**
 * @swagger
 * /api/me/search:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Search public candidate profiles by keyword (skill, position, company, school, major), no auth required
 *     description: Case-insensitive substring match over GeneralInformation positionDesired/professionalSkills, Experience company/position/skills and Education school/major. Only candidates whose profile is public and who have a vanity slug are returned; each result carries only public fields and links to /api/me/{slug}. Must stay registered before /api/me/{email} — a slug literally "search" is shadowed by this route.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching public profiles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               slug: { type: string }
 *                               firstName: { type: string }
 *                               lastName: { type: string }
 *                               positionDesired: { type: string }
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page: { type: integer }
 *                             limit: { type: integer }
 *                             total: { type: integer }
 *                             totalPages: { type: integer }
 *       400:
 *         description: Missing, too short (< 2) or too long (> 100) query
 */
router.get('/api/me/search', fnSearchPublicProfiles);

/**
 * @swagger
 * /api/me/{email}:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Get a candidate's full public profile (CV) by vanity slug or email (slug checked first, email as fallback for existing shared links), no auth required
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Vanity slug (e.g. `jane-doe-ab12`) or registration email
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [vi, en]
 *           default: vi
 *         description: Language to resolve localized free-text fields (introduction, section descriptions, career/careerGoal) into. Falls back to whichever language has content if the requested one is empty.
 *       - in: query
 *         name: profile
 *         required: false
 *         schema:
 *           type: string
 *         description: CV profile id (see /api/v1/profile) — when given, filters each CV section down to the ids listed on that profile. Omitted, or an id that doesn't resolve to a profile owned by this candidate, returns every section unfiltered (existing share-links unaffected).
 *     responses:
 *       200:
 *         description: Aggregated public profile (candidate + general information + all CV sections, optionally filtered by ?profile=)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Email not found
 */
router.get('/api/me/:email', fnGetAboutMe);

/**
 * @swagger
 * /api/me/{email}/visit:
 *   post:
 *     tags: [CandidateMe]
 *     summary: Record a visit to a candidate's public profile (count, timestamp, IP, geo-location), no auth required
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referrer:
 *                 type: string
 *                 description: The visitor's document.referrer; only its hostname is stored (www./m. stripped), invalid values are stored as null
 *                 example: https://www.linkedin.com/feed/
 *               profile:
 *                 type: string
 *                 description: The CV profile id the visitor was shown (the `?profile=` of the profile URL); stored only if it is a non-deleted profile of this candidate, otherwise null
 *                 example: 64b7f0c2a1b2c3d4e5f60799
 *     responses:
 *       200:
 *         description: Visit recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Email not found
 */
router.post('/api/me/:email/visit', fnRecordVisit);

/**
 * @swagger
 * /api/me/{identifier}/download-pdf:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Download a public profile's ATS-optimized CV as PDF, no auth required
 *     description: >
 *       Same data as GET /api/me/{identifier} and the same renderer (incl.
 *       PDF metadata) as the owner's GET /api/v1/download-pdf?template=ats.
 *       A private profile gets the same response as an unknown identifier.
 *       Rendered PDFs are cached in memory per exact CV content + lang, so
 *       a repeat request doesn't re-render until the CV changes (or after
 *       1 hour). Rate-limited like other public routes.
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         description: Vanity slug (checked first) or email
 *         schema:
 *           type: string
 *       - in: query
 *         name: template
 *         required: false
 *         description: Only `ats` is available publicly
 *         schema:
 *           type: string
 *           enum: [ats]
 *           default: ats
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [vi, en]
 *           default: vi
 *       - in: query
 *         name: profile
 *         required: false
 *         description: CV profile id; filters sections like GET /api/me/{identifier}?profile=
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file (Content-Disposition attachment)
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Unknown identifier or private profile (same response), or a template other than ats
 *       429:
 *         description: Too many requests
 */
router.get('/api/me/:identifier/download-pdf', fnDownloadPublicPdf);

router.get('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    errors: null,
    data: null,
  });
});

router.get('/*', (_req: Request, res: Response) => {
  res.send(
    `<div style="text-align: center; padding: 50px">
            <h1 style="font-size: 8vw; text-transform: uppercase; letter-spacing: .1em;">Hello World!</h1> 
            <br/>
            <p>Go to <a href="https://datvt243.github.io/vue-resume-web/">Resume Web Page</a></p>
        </div>`,
  );
});

export default router;
