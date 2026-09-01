/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
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
} from '@/candidate/candidate.controller';
import { uploadCVMiddleware } from '@/middlewares/uploadCV.middleware';

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
