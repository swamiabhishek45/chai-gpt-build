type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  /** Set a key in cache with a TTL in milliseconds */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /** Retrieve a key from cache, returning null if expired or not found */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /** Delete a single key from cache */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /** Delete all keys matching a specific substring pattern (e.g. invalidating a user's conversations) */
  deleteByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /** Clear all keys from the cache */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance
export const appCache = new SimpleCache();

// Default standard TTL limits (in milliseconds)
export const CACHE_TTL = {
  USER: 5 * 60 * 1000,          // 5 minutes
  CONV_LIST: 10 * 60 * 1000,    // 10 minutes
  CONV_DETAIL: 10 * 60 * 1000,  // 10 minutes
};
