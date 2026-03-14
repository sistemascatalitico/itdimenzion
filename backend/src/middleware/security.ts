import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { securityConfig } from '../config/security';

export const rateLimitMiddleware = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  message: {
    error: securityConfig.rateLimit.message,
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: securityConfig.rateLimit.message,
      statusCode: 429,
      timestamp: new Date().toISOString(),
    });
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    statusCode: 429,
  },
  skipSuccessfulRequests: true,
});

export const helmetMiddleware = securityConfig.helmet
  ? helmet(securityConfig.helmet)
  : (_req: Request, _res: Response, next: NextFunction) => next();

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

export const logSecurityEvent = (
  event: string,
  req: Request,
  additionalData?: any
) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    ...additionalData,
  };
  
  console.warn('🔒 SECURITY EVENT:', JSON.stringify(securityLog, null, 2));
  
  // In production, you might want to send this to a security monitoring service
  // or store it in a dedicated security log database
};

export const detectSuspiciousActivity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/passwd|\/windows\/system32)/i,
    /<script|javascript:|on\w+\s*=/i,
    /union\s+select|drop\s+table|insert\s+into/i,
    /(exec|eval|system|passthru)\s*\(/i,
  ];
  
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', req, {
        pattern: pattern.toString(),
        matchedData: requestData,
      });
      
      return res.status(400).json({
        error: 'Invalid request detected',
        statusCode: 400,
      });
    }
  }
  
  next();
};