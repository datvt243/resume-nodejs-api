/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseUploadImages } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/certificates/certificate.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/certificate:
 *   get:
 *     tags: [Certificate]
 *     summary: List all certificates for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of certificates. Passing `limit` switches `data` to `{ items, pagination }` instead of a bare array.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Certificate'
 */
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.CERTIFICATE;
    next();
  },
  baseGetAll,
);

/**
 * @swagger
 * /api/v1/certificate/create:
 *   post:
 *     tags: [Certificate]
 *     summary: Create a new certificate entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Certificate'
 *     responses:
 *       201:
 *         description: Certificate created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.post('/create', fnCreate);

/**
 * @swagger
 * /api/v1/certificate/update:
 *   put:
 *     tags: [Certificate]
 *     summary: Update an existing certificate entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Certificate'
 *     responses:
 *       200:
 *         description: Certificate updated
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
 * /api/v1/certificate/delete/{id}:
 *   delete:
 *     tags: [Certificate]
 *     summary: Delete a certificate entry by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.CERTIFICATE;
    next();
  },
  baseDelete,
);

/**
 * @swagger
 * /api/v1/certificate/{id}/images:
 *   post:
 *     tags: [Certificate]
 *     summary: Upload one or more images (max 5, 5MB each) and append them to this certificate's images[]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded, returns the certificate's updated images[]
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: No file, wrong type (non-image), or too large (> 5MB)
 *       403:
 *         description: Certificate does not belong to the authenticated candidate
 *       404:
 *         description: Certificate not found
 */
router.post(
  '/:id/images',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.CERTIFICATE;
    next();
  },
  baseUploadImages,
);

export default router;
