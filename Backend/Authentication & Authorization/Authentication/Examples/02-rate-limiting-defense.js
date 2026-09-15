/**
 * 02-rate-limiting-defense.js
 * 
 * Demonstrates:
 * In-memory sliding window / token bucket rate limiter to stop brute-force password guessing.
 */

class SimpleRateLimiter {
  constructor(maxAttempts = 3, windowSeconds = 10) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowSeconds * 1000;
    this.records = new Map(); // IP -> [timestamps]
  }

  check(clientIp) {
    const now = Date.now();
    const timestamps = this.records.get(clientIp) || [];

    // Filter timestamps within the current window
    const activeTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (activeTimestamps.length >= this.maxAttempts) {
      const oldest = activeTimestamps[0];
      const retryAfterSec = Math.ceil((this.windowMs - (now - oldest)) / 1000);
      return {
        allowed: false,
        retryAfterSec,
        message: `Too many login attempts. Please try again after ${retryAfterSec}s.`
      };
    }

    // Record this attempt
    activeTimestamps.push(now);
    this.records.set(clientIp, activeTimestamps);

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - activeTimestamps.length
    };
  }
}

console.log('===============================================================');
console.log('RATE LIMITER BRUTE-FORCE SIMULATION');
console.log('===============================================================');

const limiter = new SimpleRateLimiter(3, 5); // 3 attempts per 5 seconds
const attackerIp = '192.168.1.50';

for (let i = 1; i <= 5; i++) {
  const result = limiter.check(attackerIp);
  if (result.allowed) {
    console.log(`Attempt ${i}: Allowed ✅ | Remaining attempts: ${result.remainingAttempts}`);
  } else {
    console.log(`Attempt ${i}: BLOCKED ❌ | HTTP 429 Too Many Requests | ${result.message}`);
  }
}
