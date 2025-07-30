import express from 'express';
import { processMessage } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', processMessage);

export default router;
