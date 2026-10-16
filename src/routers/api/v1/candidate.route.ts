/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express from 'express';
const router = express.Router();

import {
  fnGetInformationByEmail,
  fnUpdate,
  fnUpdateFields,
  fnDelete,
  fnUploadCV,
  fnDownloadCV,
  fnGetVisits,
  fnGetVisitStats,
  fnParseLinkedInExport,
  fnParseCvPdf,
} from '@/candidate/candidate.controller';
import { uploadCVMiddleware } from '@/middlewares/uploadCV.middleware';
import { uploadLinkedInExportMiddleware } from '@/middlewares/uploadLinkedInExport.middleware';
import { uploadCvPdfParseMiddleware } from '@/middlewares/uploadCvPdfParse.middleware';

/**
 * @swagger
 * /api/v1/candidate/upload-cv:
 *   post:
 *     tags: [Candidate]
 *     summary: Upload a CV file (PDF, max 5MB) for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cv:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: CV uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing file, wrong type (non-PDF), or too large (> 5MB)
 */
router.post('/upload-cv', uploadCVMiddleware, fnUploadCV);

/**
 * @swagger
 * /api/v1/candidate/parse-linkedin-export:
 *   post:
 *     tags: [Candidate]
 *     summary: Parse a LinkedIn "Data export" ZIP (Education.csv/Positions.csv) into Education/Experience entries for the frontend to review before saving
 *     description: Stateless parse-and-return endpoint -- nothing is persisted. Best-effort only (dates and free-text fields depend on LinkedIn's export format); the frontend is expected to map the result into its existing create forms for the user to review/edit before saving, never auto-save.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The LinkedIn export ZIP (max 20MB)
 *     responses:
 *       200:
 *         description: Parsed Education/Experience entries (never persisted)
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
 *                         educations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               school: { type: string }
 *                               major: { type: string }
 *                               startDate: { type: number, nullable: true }
 *                               endDate: { type: number, nullable: true }
 *                               isCurrent: { type: boolean }
 *                               description: { type: string }
 *                         experiences:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               company: { type: string }
 *                               position: { type: string }
 *                               startDate: { type: number, nullable: true }
 *                               endDate: { type: number, nullable: true }
 *                               isCurrent: { type: boolean }
 *                               description: { type: string }
 *       400:
 *         description: Missing file, wrong type (non-ZIP), too large (> 20MB), or the ZIP itself is corrupt/unreadable
 */
router.post('/parse-linkedin-export', uploadLinkedInExportMiddleware, fnParseLinkedInExport);

/**
 * @swagger
 * /api/v1/candidate/parse-cv-pdf:
 *   post:
 *     tags: [Candidate]
 *     summary: Parse an existing PDF CV into Education/Experience entries for the frontend to review before saving
 *     description: Stateless parse-and-return endpoint -- the PDF is read in memory and never stored, nothing is persisted. Best-effort heuristic over the PDF's text layer (vi + en section headings, date ranges such as MM/YYYY - MM/YYYY or YYYY - Present/Hiện tại); single-column CVs parse best, multi-column/designed CVs poorly, scanned/image-only PDFs yield no text (no OCR). Same data shape as parse-linkedin-export plus extractedText, so the frontend can reuse its review-before-save flow and show the raw text when little is recognized.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The CV as a PDF (max 5MB)
 *     responses:
 *       200:
 *         description: Parsed Education/Experience entries (never persisted); empty arrays when the PDF is readable but no sections are recognized
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
 *                         educations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               school: { type: string }
 *                               major: { type: string }
 *                               startDate: { type: number, nullable: true }
 *                               endDate: { type: number, nullable: true }
 *                               isCurrent: { type: boolean }
 *                               description: { type: string }
 *                         experiences:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               company: { type: string }
 *                               position: { type: string }
 *                               startDate: { type: number, nullable: true }
 *                               endDate: { type: number, nullable: true }
 *                               isCurrent: { type: boolean }
 *                               description: { type: string }
 *                         extractedText:
 *                           type: string
 *                           description: The raw text extracted from the PDF
 *       400:
 *         description: Missing file, wrong type (non-PDF), too large (> 5MB), or the PDF itself is corrupt/unreadable
 */
router.post('/parse-cv-pdf', uploadCvPdfParseMiddleware, fnParseCvPdf);

/**
 * @swagger
 * /api/v1/candidate/cv-file:
 *   get:
 *     tags: [Candidate]
 *     summary: Download the authenticated candidate's previously uploaded CV file
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The uploaded PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No CV has been uploaded yet
 */
router.get('/cv-file', fnDownloadCV);

/**
 * @swagger
 * /api/v1/candidate/visits:
 *   get:
 *     tags: [Candidate]
 *     summary: Get the authenticated candidate's own profile visit count + list (recorded via POST /api/me/{email}/visit)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visit count + list
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
 *                         count: { type: number }
 *                         visits:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Visit'
 */
router.get('/visits', fnGetVisits);

/**
 * @swagger
 * /api/v1/candidate/visits/stats:
 *   get:
 *     tags: [Candidate]
 *     summary: Aggregated stats for the authenticated candidate's own profile visits — zero-filled time series + country, referrer-source and CV-profile breakdowns
 *     description: Buckets follow the given IANA time zone (default Asia/Ho_Chi_Minh); from/to are inclusive local dates and default to the last 30 days. Week buckets are ISO weeks (YYYY-Www, Monday start). Country is taken from the recorded geo location; visits without one are grouped under country null. Source is the referrer hostname recorded with the visit; visits without one (direct/unknown, or recorded before referrer tracking) are grouped under source null. Profile is the CV profile the visitor was shown; visits via the default link (or recorded before profile tracking) are grouped under profileId null, and a profile deleted since keeps its own row with deleted true. At most 400 buckets per request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema: { type: string, enum: [day, week, month], default: day }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, example: '2026-09-11' }
 *         description: Inclusive start date (YYYY-MM-DD, local to tz). Default — 29 days before `to`.
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, example: '2026-10-10' }
 *         description: Inclusive end date (YYYY-MM-DD, local to tz). Default — today in tz.
 *       - in: query
 *         name: tz
 *         schema: { type: string, default: Asia/Ho_Chi_Minh }
 *         description: IANA time zone used for bucket boundaries
 *     responses:
 *       200:
 *         description: Visit stats
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
 *                         interval: { type: string, enum: [day, week, month] }
 *                         tz: { type: string }
 *                         from: { type: string, format: date }
 *                         to: { type: string, format: date }
 *                         total: { type: number }
 *                         series:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               bucket: { type: string, example: '2026-10-10' }
 *                               count: { type: number }
 *                         countries:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               country: { type: string, nullable: true, example: VN }
 *                               count: { type: number }
 *                         sources:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               source: { type: string, nullable: true, example: linkedin.com }
 *                               count: { type: number }
 *                         profiles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               profileId: { type: string, nullable: true }
 *                               name: { type: string, nullable: true, example: Frontend }
 *                               deleted: { type: boolean }
 *                               count: { type: number }
 *       400:
 *         description: Invalid interval, date, time zone, from after to, or more than 400 buckets
 */
router.get('/visits/stats', fnGetVisitStats);

/**
 * @swagger
 * /api/v1/candidate/{email}:
 *   get:
 *     tags: [Candidate]
 *     summary: Get candidate profile by email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Candidate profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Candidate'
 */
router.get('/:email', fnGetInformationByEmail);

/**
 * @swagger
 * /api/v1/candidate/update:
 *   put:
 *     tags: [Candidate]
 *     summary: Fully update the authenticated candidate's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Candidate updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.put('/update', fnUpdate);

/**
 * @swagger
 * /api/v1/candidate/update:
 *   patch:
 *     tags: [Candidate]
 *     summary: Partially update the authenticated candidate's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Candidate updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.patch('/update', fnUpdateFields);

/**
 * @swagger
 * /api/v1/candidate:
 *   delete:
 *     tags: [Candidate]
 *     summary: Delete the authenticated candidate's own account (and all their CV section data)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete('/', fnDelete);

export default router;
