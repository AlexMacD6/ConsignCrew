/**
 * Simple API response cache to prevent redundant requests
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 30000; // 30 seconds default

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new APICache();

/**
 * Cached fetch wrapper
 */
export async function cachedFetch(
  url: string, 
  options: RequestInit = {}, 
  ttl: number = 30000
): Promise<Response> {
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  
  // Only cache GET requests
  if (!options.method || options.method === 'GET') {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`🚀 Cache hit for ${url}`);
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  console.log(`📡 API call for ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    // Cache successful GET responses
    if (response.ok && (!options.method || options.method === 'GET')) {
      try {
        const data = await response.clone().json();
        apiCache.set(cacheKey, data, ttl);
        console.log(`✅ Cached response for ${url}`);
      } catch (jsonError) {
        console.warn(`⚠️ Failed to parse JSON for caching ${url}:`, jsonError);
        // Don't fail the request if caching fails
      }
    }

    return response;
  } catch (fetchError) {
    console.error(`🚨 Fetch failed for ${url}:`, fetchError);
    throw fetchError;
  }
}

/**
 * Debounce utility to prevent rapid successive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
