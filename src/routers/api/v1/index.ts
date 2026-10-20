/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
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
import routeApplication from './application.route';
import routeProfile from './profile.route';
import routeCv from './cv.route';
import { fnExportPDF } from '@/candidate_me/index';

router.use('/auth', routeAuth);
router.use('/candidate', asyncHandler(verifyToken), routeCandidate);
router.use('/education', asyncHandler(verifyToken), routeEducation);
router.use('/award', asyncHandler(verifyToken), routeAward);
router.use('/experience', asyncHandler(verifyToken), routeExperience);
router.use('/reference', asyncHandler(verifyToken), routeReference);
router.use('/general-information', asyncHandler(verifyToken), routeGeneralInformation);
router.use('/project', asyncHandler(verifyToken), routeProject);
router.use('/certificate', asyncHandler(verifyToken), routeCertificate);
router.use('/application', asyncHandler(verifyToken), routeApplication);
router.use('/profile', asyncHandler(verifyToken), routeProfile);
router.use('/cv', asyncHandler(verifyToken), routeCv);

/**
 * @swagger
 * /api/v1/download-pdf:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Export the authenticated candidate's CV as a PDF
 *     description: >
 *       Authenticates via EITHER an `Authorization: Bearer` header (same as
 *       every other endpoint) OR the `token` query parameter below — listed
 *       as alternatives because this route is commonly opened as a direct
 *       link/download (`<a href>`, new tab, `<iframe>`), where a browser
 *       navigation can't attach a custom header. Both paths go through the
 *       exact same `verifyToken` middleware: same JWT signature check, same
 *       blacklist check, same "logout of all devices" session-revocation
 *       check. A `?token=` value is simply the same access token issued by
 *       `POST /auth/login`, placed in the URL instead of a header — not a
 *       separate/weaker credential. Trade-off: unlike a header, a token in
 *       the URL is exposed in server access logs and browser history, which
 *       is why this is the only endpoint in the API that accepts it this
 *       way.
 *     security:
 *       - bearerAuth: []
 *       - queryTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: false
 *         schema:
 *           type: string
 *         description: >
 *           The access token, when not sent via the `Authorization: Bearer`
 *           header. Required if no `Authorization` header is present (one
 *           of the two is mandatory). See the endpoint description above
 *           for why this endpoint uniquely accepts a query-string token.
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
 *           enum: [pdf, json, docx]
 *           default: pdf
 *         description: Response format. `json` returns the same aggregated candidate data used to render the PDF, as JSON. `docx` returns the same data as an editable Word document, instead of a PDF file.
 *       - in: query
 *         name: template
 *         required: false
 *         schema:
 *           type: string
 *           enum: [classic, modern, ats]
 *           default: classic
 *         description: >
 *           Export template/theme. `classic` is the pre-existing visual
 *           template (unchanged). `modern` is an additional visual
 *           theme — same content, accent-colored styling. `ats` is a
 *           single-column, no-letter-spacing template optimized for ATS
 *           text extraction (see doctrine/standards/pdf-export-standard.md).
 *           `classic`/`modern` both apply to `format=docx` too; `ats` is
 *           PDF-only. Ignored when `format=json`.
 *     responses:
 *       200:
 *         description: PDF file stream, the candidate's aggregated data as JSON when `format=json`, or a .docx file when `format=docx`
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/download-pdf', asyncHandler(verifyTokenByQuery), asyncHandler(fnExportPDF));

export default router;
