/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
const router = express.Router();

import { authRegister, authLogin } from '@/auth/auth.controller';
import { authLimiter } from '@/middlewares/rateLimit.middleware';

router.post('/register', authLimiter, asyncHandler(authRegister));
router.post('/login', authLimiter, asyncHandler(authLogin));

export default router;
