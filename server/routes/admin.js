import express from 'express';
import { getStats } from '../controllers/adminController.js';

const router = express.Router();

router.get('/', getStats);

export default router;
