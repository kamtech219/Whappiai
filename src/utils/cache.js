/**
 * Memory Cache Utility
 * Provides a simple in-memory cache with TTL (Time To Live)
 */

class MemoryCache {
    constructor(ttlSeconds = 60) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;

        // Clean up expired items periodically to prevent memory leaks
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiry) {
                    this.cache.delete(key);
                }
            }
        }, Math.max(10000, this.ttl));

        // Ensure the interval doesn't prevent the Node.js process from exiting
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    set(key, value, customTtlSeconds = null) {
        const ttl = customTtlSeconds ? customTtlSeconds * 1000 : this.ttl;
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = MemoryCache;
