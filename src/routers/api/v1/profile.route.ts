/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseRestore } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/profile/profile.controller';
import { ensureDefaultProfile } from '@/candidate_profile/profile/profile.service';
import { handleError } from '@/utils';

const router = express.Router();

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     tags: [Profile]
 *     summary: List all CV profiles for the authenticated candidate
 *     description: A default "Tổng hợp" (All) profile containing every existing CV-section item is synthesized on first read if the candidate has none yet.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: List of CV profiles. Passing `limit` switches `data` to `{ items, pagination }` instead of a bare array.
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
 *                         $ref: '#/components/schemas/Profile'
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.PROFILE;
    try {
      await ensureDefaultProfile(req.body.candidateId);
      next();
    } catch (err) {
      handleError(err, next, (req as any).lang);
    }
  },
  baseGetAll,
);

/**
 * @swagger
 * /api/v1/profile/create:
 *   post:
 *     tags: [Profile]
 *     summary: Create a new CV profile (named subset of Education/Experience/Project/Certificate/Award/Reference entries)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       201:
 *         description: CV profile created
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
 * /api/v1/profile/update:
 *   put:
 *     tags: [Profile]
 *     summary: Update an existing CV profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: CV profile updated
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
 * /api/v1/profile/delete/{id}:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete a CV profile by ID
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
 *         description: CV profile deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.PROFILE;
    next();
  },
  baseDelete,
);

/**
 * @swagger
 * /api/v1/profile/restore/{id}:
 *   post:
 *     tags: [Profile]
 *     summary: Restore a soft-deleted CV profile by ID
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
 *         description: CV profile restored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  '/restore/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.PROFILE;
    next();
  },
  baseRestore,
);

export default router;
