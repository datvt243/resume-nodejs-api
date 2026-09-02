/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/experience/experience.controller';

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
 *         description: List of experience entries. Passing `limit` switches `data` to `{ items, pagination }` instead of a bare array.
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
  (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.EXPERIENCE;
    next();
  },
  baseGetAll,
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
 */
router.post('/create', fnCreate);

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
 */
router.put('/update', fnUpdate);

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
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.EXPERIENCE;
    next();
  },
  baseDelete,
);

export default router;
