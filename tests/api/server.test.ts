import request from 'supertest';
import { ApiServer } from '../../src/api/server';

describe('API Server Tests', () => {
  let server: ApiServer;
  let app: any;

  beforeAll(() => {
    server = new ApiServer();
    app = server.getApp();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('User Routes', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/v1/users/me')
        .send({ gold: 100 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Character Routes', () => {
    it('should get characters', async () => {
      const response = await request(app)
        .get('/api/v1/characters')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('characters');
      expect(Array.isArray(response.body.data.characters)).toBe(true);
    });

    it('should create character', async () => {
      const response = await request(app)
        .post('/api/v1/characters')
        .send({
          name: 'TestCharacter',
          class: 'WARRIOR'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Battle Routes', () => {
    it('should start PvE battle', async () => {
      const response = await request(app)
        .post('/api/v1/battles/pve')
        .send({ characterId: 'test-id' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('battle');
    });
  });

  describe('Quest Routes', () => {
    it('should get quests', async () => {
      const response = await request(app)
        .get('/api/v1/quests')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('quests');
      expect(Array.isArray(response.body.data.quests)).toBe(true);
    });
  });

  describe('Shop Routes', () => {
    it('should get shop items', async () => {
      const response = await request(app)
        .get('/api/v1/shop/items')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
  });

  describe('Payment Routes', () => {
    it('should create payment intent', async () => {
      const response = await request(app)
        .post('/api/v1/payments/intents')
        .send({
          product: 'gems',
          amount: 100
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('payment_intent');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});