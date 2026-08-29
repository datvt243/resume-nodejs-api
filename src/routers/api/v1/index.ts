/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import path, { dirname } from 'path';
import express from 'express';
import { verifyToken, verifyTokenByQuery } from '@/middlewares/verifyToken.middleware';

const router = express.Router();

import routeAuth from './auth.route';
import routeCandidate from './candidate.route';
import routeEducation from './education.route';
import routeExperience from './experience.route';
import routeReference from './reference.route';
import routeGeneralInformation from './generalInformation.route';
import routeProject from './project.route';
import routeCertificate from './certificate.route';
import routeAward from './award.route';
import { fnExportPDF } from '@/candidate_me/index';

router.use('/auth', routeAuth);
router.use('/candidate', verifyToken, routeCandidate);
router.use('/education', verifyToken, routeEducation);
router.use('/award', verifyToken, routeAward);
router.use('/experience', verifyToken, routeExperience);
router.use('/reference', verifyToken, routeReference);
router.use('/general-information', verifyToken, routeGeneralInformation);
router.use('/project', verifyToken, routeProject);
router.use('/certificate', verifyToken, routeCertificate);

/**
 * @swagger
 * /api/v1/download-pdf:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Export the authenticated candidate's CV as a PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Access token (token is read from the query string for this endpoint)
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [vi, en]
 *           default: vi
 *         description: Language to render localized free-text fields into. Falls back to whichever language has content if the requested one is empty.
 *       - in: query
 *         name: format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pdf, json]
 *           default: pdf
 *         description: Response format. `json` returns the same aggregated candidate data used to render the PDF, as JSON, instead of a PDF file.
 *     responses:
 *       200:
 *         description: PDF file stream, or the candidate's aggregated data as JSON when `format=json`
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/download-pdf', verifyTokenByQuery, fnExportPDF);

router.get('/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    errors: null,
    data: null,
  });
});

export default router;
