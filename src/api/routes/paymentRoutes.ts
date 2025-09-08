import { Router } from 'express';

const router = Router();

router.post('/intents', (_req, res) => {
  res.json({ success: true, data: { payment_intent: 'placeholder' } });
});

export { router as paymentRoutes };
