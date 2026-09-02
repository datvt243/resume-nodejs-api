/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseUploadImages } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/awards/award.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/award:
 *   get:
 *     tags: [Award]
 *     summary: List all awards for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of awards. Passing `limit` switches `data` to `{ items, pagination }` instead of a bare array.
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
 *                         $ref: '#/components/schemas/Award'
 */
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.AWARD;
    next();
  },
  baseGetAll,
);

/**
 * @swagger
 * /api/v1/award/create:
 *   post:
 *     tags: [Award]
 *     summary: Create a new award entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Award'
 *     responses:
 *       201:
 *         description: Award created
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
 * /api/v1/award/update:
 *   put:
 *     tags: [Award]
 *     summary: Update an existing award entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Award'
 *     responses:
 *       200:
 *         description: Award updated
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
 * /api/v1/award/delete/{id}:
 *   delete:
 *     tags: [Award]
 *     summary: Delete an award entry by ID
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
 *         description: Award deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.AWARD;
    next();
  },
  baseDelete,
);

/**
 * @swagger
 * /api/v1/award/{id}/images:
 *   post:
 *     tags: [Award]
 *     summary: Upload one or more images (max 5, 5MB each) and append them to this award's images[]
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
 *         description: Images uploaded, returns the award's updated images[]
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: No file, wrong type (non-image), or too large (> 5MB)
 *       403:
 *         description: Award does not belong to the authenticated candidate
 *       404:
 *         description: Award not found
 */
router.post(
  '/:id/images',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.AWARD;
    next();
  },
  baseUploadImages,
);

export default router;
