import express from 'express';
import { getStats } from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', getStats);

export default router;
