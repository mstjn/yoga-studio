import { Request, Response, NextFunction } from 'express';

  export function errorMiddleware(err: Error & { status?: number }, req: Request, res: Response, next:    
  NextFunction) {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    console.error(err);
    res.status(status).json({ message });
  }