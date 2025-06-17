import { Request, Response } from 'express';

/**
 * Debug endpoint to test CORS headers
 */
export const corsTest = (req: Request, res: Response): void => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
  });
};
