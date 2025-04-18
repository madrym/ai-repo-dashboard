/**
 * GitHub API response caching
 */
import { CACHE_CONFIG } from './config';

// Type definitions
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

/**
 * In-memory cache for API responses
 */
class ApiCache {
  private cache: Map<string, CacheEntry<any>>;
  
  /**
   * Creates a new ApiCache instance
   */
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * Gets an item from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl * 1000;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Sets an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds
   */
  set<T>(key: string, data: T, ttl = CACHE_CONFIG.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  /**
   * Removes an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clears all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Gets or sets an item in the cache
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param ttl Time to live in seconds
   * @returns Cached or fetched data
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl = CACHE_CONFIG.DEFAULT_TTL
  ): Promise<T> {
    const cachedData = this.get<T>(key);
    
    if (cachedData !== null) {
      return cachedData;
    }
    
    const data = await fetchFn();
    this.set(key, data, ttl);
    
    return data;
  }
}

// Create a singleton instance of the cache
const apiCache = new ApiCache();

export default apiCache; 