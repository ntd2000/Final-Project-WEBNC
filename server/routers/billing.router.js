import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import controller from '../controllers/billing.controller.js';

const router = Router();

router.get('/history', auth(['employee']), controller.getHistory);

router.post('/', auth(['customer']), controller.create);

router.post('/:id/verify-otp', auth(['customer']), controller.verifyOtp);

export default router;
