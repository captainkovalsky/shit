import { Router } from 'express';

const router = Router();

router.get('/me', (_req, res) => {
  res.json({ success: true, data: { user: 'placeholder' } });
});

export { router as userRoutes };
