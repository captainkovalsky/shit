import { Router } from 'express';

const router = Router();

router.post('/telegram/payments', (_req, res) => {
  res.json({ success: true });
});

export { router as webhookRoutes };
