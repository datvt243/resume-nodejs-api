/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response } from 'express';

const router = express.Router();

import { fnGetAboutMe, fnRecordVisit } from '@/candidate_me';
import routerAPI from './api/v1/index';
import routerAPIV2 from './api/v2/index';
/**
 * API V1
 */
router.use('/api/v1', routerAPI);

/**
 * API V2
 */
router.use('/api/v2', routerAPIV2);

/**
 * get ME
 */

/**
 * @swagger
 * /api/me/{email}:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Get a candidate's full public profile (CV) by email, no auth required
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [vi, en]
 *           default: vi
 *         description: Language to resolve localized free-text fields (introduction, section descriptions, career/careerGoal) into. Falls back to whichever language has content if the requested one is empty.
 *     responses:
 *       200:
 *         description: Aggregated public profile (candidate + general information + all CV sections)
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
 * 404
 */
router.get('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    errors: null,
    data: null,
  });
});

/**
 * get page home
 */
/* router.get('/', (req: Request, res: Response) => {
    res.render('render', { data: null });
}); */
router.get('/*', (req: Request, res: Response) => {
  res.send(
    `<div style="text-align: center; padding: 50px">
            <h1 style="font-size: 8vw; text-transform: uppercase; letter-spacing: .1em;">Hello World!</h1> 
            <br/>
            <p>Go to <a href="https://datvt243.github.io/vue-resume-web/">Resume Web Page</a></p>
        </div>`,
  );
});

export default router;
