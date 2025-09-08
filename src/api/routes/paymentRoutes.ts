import { Router, Request, Response } from 'express';
import { PaymentService } from '@/database/services/PaymentService';

const router = Router();
const paymentService = new PaymentService();

router.post('/intents', async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and product ID are required',
      });
    }

    const result = await paymentService.createPaymentIntent(userId, productId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      data: { paymentIntent: result.paymentIntent },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/intents/:paymentIntentId', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required',
      });
    }
    
    const paymentIntent = await paymentService.getPaymentIntent(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        error: 'Payment intent not found',
      });
    }

    return res.json({
      success: true,
      data: { paymentIntent },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment intent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = paymentService.getAvailableProducts();
    
    return res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }
    
    const history = await paymentService.getUserPaymentHistory(userId);
    
    return res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/webhook/telegram', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-telegram-signature'] as string;
    const payload = req.body;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing signature',
      });
    }

    if (!paymentService.validatePaymentWebhook(payload, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    const { event, payment_intent_id, provider_payload } = payload;

    if (event === 'payment.succeeded') {
      const result = await paymentService.processPaymentSuccess(payment_intent_id, provider_payload);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        data: { paymentIntent: result.paymentIntent },
      });
    } else if (event === 'payment.failed') {
      const result = await paymentService.processPaymentFailure(
        payment_intent_id,
        provider_payload?.failure_reason || 'Unknown error'
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        data: { paymentIntent: result.paymentIntent },
      });
    } else {
      return res.json({
        success: true,
        message: 'Event processed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/simulate/success', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, providerData = {} } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required',
      });
    }

    const result = await paymentService.processPaymentSuccess(paymentIntentId, providerData);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: { paymentIntent: result.paymentIntent },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to simulate payment success',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/simulate/failure', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, reason = 'Simulated failure' } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required',
      });
    }

    const result = await paymentService.processPaymentFailure(paymentIntentId, reason);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: { paymentIntent: result.paymentIntent },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to simulate payment failure',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as paymentRoutes };
