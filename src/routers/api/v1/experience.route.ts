/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express, { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseRestore } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate, fnBulkCreate } from '@/candidate_profile/experience/experience.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/experience:
 *   get:
 *     tags: [Experience]
 *     summary: List all work experience entries for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of experience entries. `data` is always an array; `meta` holds page/limit/total/totalPages (one page with everything when `limit` is omitted).
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
 *                         $ref: '#/components/schemas/Experience'
 */
router.get(
  '/',
  (req: Request, _res: Response, next: NextFunction) => {
    req.body.collection = Collections.EXPERIENCE;
    next();
  },
  asyncHandler(baseGetAll),
);

/**
 * @swagger
 * /api/v1/experience/create:
 *   post:
 *     tags: [Experience]
 *     summary: Create a new work experience entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Experience'
 *     responses:
 *       201:
 *         description: Experience entry created
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
router.post('/create', asyncHandler(fnCreate));

/**
 * @swagger
 * /api/v1/experience/bulk:
 *   post:
 *     tags: [Experience]
 *     summary: Create multiple work experience entries in one request (best-effort per item)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   $ref: '#/components/schemas/Experience'
 *     responses:
 *       201:
 *         description: Per-item results, each with its own success/message/data or errors, plus a summary
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
 *                         results:
 *                           type: array
 *                           items:
 *                             type: object
 *                         summary:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                             succeeded: { type: integer }
 *                             failed: { type: integer }
 *       400:
 *         description: No items provided, or more than 100 items in one request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/bulk', asyncHandler(fnBulkCreate));

/**
 * @swagger
 * /api/v1/experience/update:
 *   put:
 *     tags: [Experience]
 *     summary: Update an existing work experience entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Experience'
 *     responses:
 *       200:
 *         description: Experience entry updated
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
 * /api/v1/experience/delete/{id}:
 *   delete:
 *     tags: [Experience]
 *     summary: Delete a work experience entry by ID
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
 *         description: Experience entry deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    req.params['collection'] = Collections.EXPERIENCE;
    next();
  },
  asyncHandler(baseDelete),
);

/**
 * @swagger
 * /api/v1/experience/restore/{id}:
 *   post:
 *     tags: [Experience]
 *     summary: Restore a soft-deleted work experience entry by ID
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
 *         description: Experience entry restored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/restore/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    req.params['collection'] = Collections.EXPERIENCE;
    next();
  },
  asyncHandler(baseRestore),
);

export default router;
