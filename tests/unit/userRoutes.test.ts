import request from 'supertest';
import express from 'express';
import { userRoutes } from '@/api/routes/userRoutes';

const app = express();
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  describe('GET /api/users/me', () => {
    it('should return user placeholder data', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { user: 'placeholder' }
      });
    });
  });
});
