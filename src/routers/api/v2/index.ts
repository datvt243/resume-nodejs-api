/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express from 'express';

const router = express.Router();

import routeAuth from './auth.route';

router.use('/auth', routeAuth);

export default router;
