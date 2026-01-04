/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or Upstash
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up stale entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (entry.resetTime < now) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 }
): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitMap.get(key);

    // If no entry or window expired, create new one
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs
        };
        rateLimitMap.set(key, entry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: entry.resetTime
        };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime
        };
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
    };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from various headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a default
    return 'unknown';
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
    // Auth endpoints - stricter limits
    auth: { windowMs: 60 * 1000, maxRequests: 10 },

    // AI endpoints - moderate limits (expensive operations)
    ai: { windowMs: 60 * 1000, maxRequests: 20 },

    // General API - relaxed limits
    api: { windowMs: 60 * 1000, maxRequests: 60 },

    // Admin operations
    admin: { windowMs: 60 * 1000, maxRequests: 100 }
};
