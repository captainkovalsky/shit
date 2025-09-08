import { Router } from 'express';

const router = Router();

router.post('/pve', (_req, res) => {
  res.json({ success: true, data: { battle: 'placeholder' } });
});

export { router as battleRoutes };
