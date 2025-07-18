import { STORAGE_KEYS, CACHE_SETTINGS } from "@/shared/constants";

export interface AuthData {
  token: string;
  record: Record<string, unknown>;
}

export interface QueryParams {
  filter: string;
  sort: string;
  expand: string;
  selectedFields: string[];
  page: number;
  perPage: number;
}

export interface CacheData<T> {
  params: T;
  timestamp: number;
}

/**
 * Utility class for managing localStorage operations
 */
export class LocalStorageManager {
  /**
   * Generic method to safely get an item from localStorage
   */
  private static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Generic method to safely set an item in localStorage
   */
  private static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error);
    }
  }

  /**
   * Generic method to safely remove an item from localStorage
   */
  private static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error);
    }
  }

  /**
   * Get PocketBase base URL
   */
  static getBaseUrl(): string | null {
    return this.getItem(STORAGE_KEYS.PB_BASE_URL);
  }

  /**
   * Set PocketBase base URL
   */
  static setBaseUrl(url: string): void {
    this.setItem(STORAGE_KEYS.PB_BASE_URL, url);
  }

  /**
   * Remove PocketBase base URL
   */
  static removeBaseUrl(): void {
    this.removeItem(STORAGE_KEYS.PB_BASE_URL);
  }

  /**
   * Get authentication data
   */
  static getAuthData(): AuthData | null {
    const authString = this.getItem(STORAGE_KEYS.PB_AUTH);
    if (!authString) return null;

    try {
      return JSON.parse(authString) as AuthData;
    } catch (error) {
      console.warn("Failed to parse auth data from localStorage", error);
      return null;
    }
  }

  /**
   * Set authentication data
   */
  static setAuthData(authData: AuthData): void {
    try {
      this.setItem(STORAGE_KEYS.PB_AUTH, JSON.stringify(authData));
    } catch (error) {
      console.warn("Failed to save auth data to localStorage", error);
    }
  }

  /**
   * Remove authentication data
   */
  static removeAuthData(): void {
    this.removeItem(STORAGE_KEYS.PB_AUTH);
  }

  /**
   * Get pinned collections
   */
  static getPinnedCollections(): string[] {
    const pinnedString = this.getItem(STORAGE_KEYS.PB_PINNED_COLLECTIONS);
    if (!pinnedString) return [];

    try {
      return JSON.parse(pinnedString) as string[];
    } catch (error) {
      console.warn(
        "Failed to parse pinned collections from localStorage",
        error
      );
      return [];
    }
  }

  /**
   * Set pinned collections
   */
  static setPinnedCollections(collections: string[]): void {
    try {
      this.setItem(
        STORAGE_KEYS.PB_PINNED_COLLECTIONS,
        JSON.stringify(collections)
      );
    } catch (error) {
      console.warn("Failed to save pinned collections to localStorage", error);
    }
  }

  /**
   * Get cache key for query parameters
   */
  private static getQueryParamsCacheKey(collectionName: string): string {
    return `${STORAGE_KEYS.PB_QUERY_PARAMS_PREFIX}${collectionName}`;
  }

  /**
   * Get cached query parameters for a collection
   */
  static getQueryParams(collectionName: string): QueryParams | null {
    const cacheKey = this.getQueryParamsCacheKey(collectionName);
    const cachedString = this.getItem(cacheKey);
    if (!cachedString) return null;

    try {
      const cacheData = JSON.parse(cachedString) as CacheData<QueryParams>;

      // Check if cache is still valid
      if (Date.now() - cacheData.timestamp > CACHE_SETTINGS.QUERY_PARAMS_TTL) {
        this.removeQueryParams(collectionName);
        return null;
      }

      return cacheData.params;
    } catch (error) {
      console.warn("Failed to parse query params from localStorage", error);
      return null;
    }
  }

  /**
   * Set cached query parameters for a collection
   */
  static setQueryParams(collectionName: string, params: QueryParams): void {
    const cacheKey = this.getQueryParamsCacheKey(collectionName);
    const cacheData: CacheData<QueryParams> = {
      params,
      timestamp: Date.now(),
    };

    try {
      this.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to save query params to localStorage", error);
    }
  }

  /**
   * Remove cached query parameters for a specific collection
   */
  static removeQueryParams(collectionName: string): void {
    const cacheKey = this.getQueryParamsCacheKey(collectionName);
    this.removeItem(cacheKey);
  }

  /**
   * Clear all cached query parameters
   */
  static clearAllQueryParams(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(STORAGE_KEYS.PB_QUERY_PARAMS_PREFIX)
      );
      keys.forEach((key) => this.removeItem(key));
    } catch (error) {
      console.warn("Failed to clear all query params cache", error);
    }
  }

  /**
   * Clear cache for a specific collection (alias for removeQueryParams)
   */
  static clearCacheForCollection(collectionName: string): void {
    this.removeQueryParams(collectionName);
  }

  /**
   * Clear all cached query parameters (alias for clearAllQueryParams)
   */
  static clearAllCache(): void {
    this.clearAllQueryParams();
  }

  /**
   * Clear all PocketBase related data from localStorage
   */
  static clearAll(): void {
    this.removeBaseUrl();
    this.removeAuthData();
    this.clearAllQueryParams();
    // Note: We don't clear pinned collections as they might be user preferences
  }

  /**
   * Check if user is authenticated (has both URL and auth data)
   */
  static isAuthenticated(): boolean {
    return !!(this.getBaseUrl() && this.getAuthData());
  }
}
