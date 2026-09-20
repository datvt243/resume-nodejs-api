/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseRestore } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/application/application.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/application:
 *   get:
 *     tags: [Application]
 *     summary: List all job applications for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of job applications. Passing `limit` switches `data` to `{ items, pagination }` instead of a bare array.
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
 *                         $ref: '#/components/schemas/Application'
 */
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.APPLICATION;
    next();
  },
  baseGetAll,
);

/**
 * @swagger
 * /api/v1/application/create:
 *   post:
 *     tags: [Application]
 *     summary: Create a new job application entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *     responses:
 *       201:
 *         description: Job application created
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
 * /api/v1/application/update:
 *   put:
 *     tags: [Application]
 *     summary: Update an existing job application entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *     responses:
 *       200:
 *         description: Job application updated
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
 * /api/v1/application/delete/{id}:
 *   delete:
 *     tags: [Application]
 *     summary: Delete a job application entry by ID
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
 *         description: Job application deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.APPLICATION;
    next();
  },
  baseDelete,
);

/**
 * @swagger
 * /api/v1/application/restore/{id}:
 *   post:
 *     tags: [Application]
 *     summary: Restore a soft-deleted job application entry by ID
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
 *         description: Job application restored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/restore/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.APPLICATION;
    next();
  },
  baseRestore,
);

export default router;
