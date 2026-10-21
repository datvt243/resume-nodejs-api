/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { fnGet, fnCreate, fnUpdate, fnUpdateFields } from '@/candidate_profile/general_information/generalInformation.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/general-information:
 *   get:
 *     tags: [GeneralInformation]
 *     summary: Get general information for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: General information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GeneralInformation'
 */
router.get('/', asyncHandler(fnGet));

/**
 * @swagger
 * /api/v1/general-information/create:
 *   post:
 *     tags: [GeneralInformation]
 *     summary: Create general information (one per candidate)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralInformation'
 *     responses:
 *       201:
 *         description: General information created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error, or candidate already has general information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create', asyncHandler(fnCreate));

/**
 * @swagger
 * /api/v1/general-information/update:
 *   put:
 *     tags: [GeneralInformation]
 *     summary: Fully replace general information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralInformation'
 *     responses:
 *       200:
 *         description: General information updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/update', asyncHandler(fnUpdate));

/**
 * @swagger
 * /api/v1/general-information/update:
 *   patch:
 *     tags: [GeneralInformation]
 *     summary: Partially update general information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralInformation'
 *     responses:
 *       200:
 *         description: General information updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/update', asyncHandler(fnUpdateFields));

export default router;
