// LocalStorage keys
export const STORAGE_KEYS = {
  PB_BASE_URL: "pb_base_url",
  PB_AUTH: "pb_auth",
  PB_PINNED_COLLECTIONS: "pb_pinned_collections",
  PB_QUERY_PARAMS_PREFIX: "pb_query_params_",
} as const;

// Cache settings
export const CACHE_SETTINGS = {
  QUERY_PARAMS_TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Default values
export const DEFAULTS = {
  BASE_URL: "http://127.0.0.1:8090",
  PER_PAGE: 30,
  PAGE: 1,
  PERFORMANCE_TEST_COUNT: 3,
  PERFORMANCE_TEST_DELAY: 1000, // 1 second
} as const;

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  REPORTS: "/reports",
  REPORT_DETAIL: (reportId: string) => `/reports/${reportId}`,
  COLLECTION: (collectionName: string) => `/c/${collectionName}`,
} as const;
export const COLLECTION_PREFIX = "px";
export const COLLECTIONS = {
  REPORTS: `${COLLECTION_PREFIX}_reports`,
  REPORT_ITEM: `${COLLECTION_PREFIX}_report_item`,
  CONFIG: `${COLLECTION_PREFIX}_config`,
};

export const CONFIG_KEYS = {
  AI_INFO: "ai_info",
};
