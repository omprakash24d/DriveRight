import { LRUCache } from 'lru-cache';

// Rate limit: 50 requests per IP per 15 minutes
const fifteenMinutesInMs = 15 * 60 * 1000;

export const rateLimiter = new LRUCache<string, number>({
  max: 500, // Max number of unique IPs to track
  ttl: fifteenMinutesInMs,
});

export const RATE_LIMIT_COUNT = 50;
