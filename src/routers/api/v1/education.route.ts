/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express, { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseRestore } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate, fnBulkCreate } from '@/candidate_profile/education/education.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/education:
 *   get:
 *     tags: [Education]
 *     summary: List all education entries for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of education entries. `data` is always an array; `meta` holds page/limit/total/totalPages (one page with everything when `limit` is omitted).
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
 *                         $ref: '#/components/schemas/Education'
 */
router.get(
  '/',
  (req: Request, _res: Response, next: NextFunction) => {
    req.body.collection = Collections.EDUCATION;
    next();
  },
  asyncHandler(baseGetAll),
);

/**
 * @swagger
 * /api/v1/education/create:
 *   post:
 *     tags: [Education]
 *     summary: Create a new education entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Education'
 *     responses:
 *       201:
 *         description: Education entry created
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
 * /api/v1/education/bulk:
 *   post:
 *     tags: [Education]
 *     summary: Create multiple education entries in one request (best-effort per item)
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
 *                   $ref: '#/components/schemas/Education'
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
 * /api/v1/education/update:
 *   put:
 *     tags: [Education]
 *     summary: Update an existing education entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Education'
 *     responses:
 *       200:
 *         description: Education entry updated
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
 * /api/v1/education/delete/{id}:
 *   delete:
 *     tags: [Education]
 *     summary: Delete an education entry by ID
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
 *         description: Education entry deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    req.params['collection'] = Collections.EDUCATION;
    next();
  },
  asyncHandler(baseDelete),
);

/**
 * @swagger
 * /api/v1/education/restore/{id}:
 *   post:
 *     tags: [Education]
 *     summary: Restore a soft-deleted education entry by ID
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
 *         description: Education entry restored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/restore/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    req.params['collection'] = Collections.EDUCATION;
    next();
  },
  asyncHandler(baseRestore),
);

export default router;
