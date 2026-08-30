/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll, baseUploadImages } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/project/project.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/project:
 *   get:
 *     tags: [Project]
 *     summary: List all projects for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
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
 *                         $ref: '#/components/schemas/Project'
 */
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.PROJECT;
    next();
  },
  baseGetAll,
);

/**
 * @swagger
 * /api/v1/project/create:
 *   post:
 *     tags: [Project]
 *     summary: Create a new project entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Project created
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
 * /api/v1/project/update:
 *   put:
 *     tags: [Project]
 *     summary: Update an existing project entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated
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
 * /api/v1/project/delete/{id}:
 *   delete:
 *     tags: [Project]
 *     summary: Delete a project entry by ID
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
 *         description: Project deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.PROJECT;
    next();
  },
  baseDelete,
);

/**
 * @swagger
 * /api/v1/project/{id}/images:
 *   post:
 *     tags: [Project]
 *     summary: Upload one or more images (max 5, 5MB each) and append them to this project's images[]
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
 *         description: Images uploaded, returns the project's updated images[]
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: No file, wrong type (non-image), or too large (> 5MB)
 *       403:
 *         description: Project does not belong to the authenticated candidate
 *       404:
 *         description: Project not found
 */
router.post(
  '/:id/images',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.PROJECT;
    next();
  },
  baseUploadImages,
);

export default router;
