/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express, { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseRestore } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/reference_information/reference.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/reference:
 *   get:
 *     tags: [Reference]
 *     summary: List all references for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of references. `data` is always an array; `meta` holds page/limit/total/totalPages (one page with everything when `limit` is omitted).
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
 *                         $ref: '#/components/schemas/Reference'
 */
router.get(
  '/',
  (req: Request, _res: Response, next: NextFunction) => {
    req.body.collection = Collections.REFERENCE;
    next();
  },
  asyncHandler(baseGetAll),
);

/**
 * @swagger
 * /api/v1/reference/create:
 *   post:
 *     tags: [Reference]
 *     summary: Create a new reference entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reference'
 *     responses:
 *       201:
 *         description: Reference created
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
 * /api/v1/reference/update:
 *   put:
 *     tags: [Reference]
 *     summary: Update an existing reference entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reference'
 *     responses:
 *       200:
 *         description: Reference updated
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
 * /api/v1/reference/delete/{id}:
 *   delete:
 *     tags: [Reference]
 *     summary: Delete a reference entry by ID
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
 *         description: Reference deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    req.params['collection'] = Collections.REFERENCE;
    next();
  },
  asyncHandler(baseDelete),
);

/**
 * @swagger
 * /api/v1/reference/restore/{id}:
 *   post:
 *     tags: [Reference]
 *     summary: Restore a soft-deleted reference entry by ID
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
 *         description: Reference restored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/restore/:id',
  (req: Request, _res: Response, next: NextFunction) => {
    req.params['collection'] = Collections.REFERENCE;
    next();
  },
  asyncHandler(baseRestore),
);

export default router;
