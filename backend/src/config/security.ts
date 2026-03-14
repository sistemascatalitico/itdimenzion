const isProduction = process.env.NODE_ENV === 'production';

function requireEnvInProduction(key: string, fallback: string): string {
  const value = process.env[key];
  if (!value && isProduction) {
    throw new Error(`Variable de entorno ${key} es obligatoria en producción`);
  }
  return value || fallback;
}

export const securityConfig = {
  jwt: {
    secret: requireEnvInProduction('JWT_SECRET', 'dev-only-jwt-secret-do-not-use-in-prod'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: requireEnvInProduction('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-do-not-use-in-prod'),
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || (isProduction ? '100' : '1000'),
      10
    ),
    message: 'Too many requests from this IP, please try again later.',
  },
  
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3701'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  
  session: {
    secret: requireEnvInProduction('SESSION_SECRET', 'dev-only-session-secret-do-not-use-in-prod'),
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000', 10),
    secure: isProduction,
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  
  loginSecurity: {
    maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockTimeMs: parseInt(process.env.ACCOUNT_LOCK_TIME || '1800000', 10), // 30 minutes
  },
  
  helmet: isProduction
    ? {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }
    : false,
};