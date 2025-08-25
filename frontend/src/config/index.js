/**
 * Centralized Configuration for Tabble Frontend
 * Provides typed configuration with validation and environment-specific settings
 */

// Environment variables with validation
const config = {
    // =============================================================================
    // API CONFIGURATION
    // =============================================================================

    // Backend API base URL
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',

    // =============================================================================
    // APPLICATION CONFIGURATION
    // =============================================================================

    // Application metadata
    APP_NAME: process.env.REACT_APP_APP_NAME || 'Tabble',
    VERSION: process.env.REACT_APP_VERSION || '1.0.0',

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_TEST: process.env.NODE_ENV === 'test',

    // =============================================================================
    // UI CONFIGURATION
    // =============================================================================

    // Theme configuration
    DEFAULT_THEME: process.env.REACT_APP_DEFAULT_THEME || 'dark',
    PRIMARY_COLOR: process.env.REACT_APP_PRIMARY_COLOR || '#FFA500',
    SECONDARY_COLOR: process.env.REACT_APP_SECONDARY_COLOR || '#000000',

    // UI settings
    DRAWER_WIDTH: 280,
    APP_BAR_HEIGHT: 64,
    MOBILE_BREAKPOINT: 768,

    // =============================================================================
    // FIREBASE CONFIGURATION
    // =============================================================================

    // Firebase configuration for client-side auth
    FIREBASE: {
        API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
        AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
    },

    // Check if Firebase is configured
    FIREBASE_ENABLED: !!(
        process.env.REACT_APP_FIREBASE_API_KEY &&
        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN &&
        process.env.REACT_APP_FIREBASE_PROJECT_ID
    ),

    // =============================================================================
    // FEATURE FLAGS
    // =============================================================================

    // Feature toggles
    FEATURES: {
        ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
        DEMO_MODE: process.env.REACT_APP_ENABLE_DEMO_MODE === 'true',
        OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
        PWA: process.env.REACT_APP_ENABLE_PWA === 'true',
    },

    // =============================================================================
    // PERFORMANCE CONFIGURATION
    // =============================================================================

    // Query and caching settings
    QUERY_CACHE_TIME: parseInt(process.env.REACT_APP_QUERY_CACHE_TIME) || 300000, // 5 minutes
    QUERY_STALE_TIME: parseInt(process.env.REACT_APP_QUERY_STALE_TIME) || 60000, // 1 minute
    IMAGE_LAZY_LOADING: process.env.REACT_APP_IMAGE_LAZY_LOADING !== 'false',

    // Pagination settings
    DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 20,
    MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE) || 100,

    // =============================================================================
    // API CONFIGURATION
    // =============================================================================

    // API endpoints
    ENDPOINTS: {
        AUTH: '/auth',
        CUSTOMER: '/customer',
        ADMIN: '/admin',
        CHEF: '/chef',
        ANALYTICS: '/analytics',
        TABLES: '/tables',
        FEEDBACK: '/feedback',
        LOYALTY: '/loyalty',
        SELECTION_OFFERS: '/selection-offers',
        SETTINGS: '/settings',
    },

    // HTTP configuration
    HTTP_TIMEOUT: parseInt(process.env.REACT_APP_HTTP_TIMEOUT) || 30000, // 30 seconds
    HTTP_RETRIES: parseInt(process.env.REACT_APP_HTTP_RETRIES) || 3,

    // =============================================================================
    // FILE UPLOAD CONFIGURATION
    // =============================================================================

    // File upload settings
    UPLOAD: {
        MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5242880, // 5MB
        ALLOWED_IMAGE_TYPES: (process.env.REACT_APP_ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp').split(','),
        CHUNK_SIZE: parseInt(process.env.REACT_APP_UPLOAD_CHUNK_SIZE) || 1024000, // 1MB chunks
    },

    // =============================================================================
    // SESSION & AUTHENTICATION
    // =============================================================================

    // Session configuration
    SESSION: {
        TIMEOUT_MINUTES: parseInt(process.env.REACT_APP_SESSION_TIMEOUT_MINUTES) || 30,
        REFRESH_THRESHOLD: parseInt(process.env.REACT_APP_SESSION_REFRESH_THRESHOLD) || 5,
        STORAGE_PREFIX: process.env.REACT_APP_STORAGE_PREFIX || 'tabble_',
    },

    // Authentication settings
    AUTH: {
        PHONE_NUMBER_REGEX: /^\+91\d{10}$/,
        OTP_LENGTH: 6,
        OTP_EXPIRY_MINUTES: parseInt(process.env.REACT_APP_OTP_EXPIRY_MINUTES) || 5,
    },

    // =============================================================================
    // ANALYTICS & MONITORING
    // =============================================================================

    // Analytics configuration
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: process.env.REACT_APP_GOOGLE_ANALYTICS_ID,
        MIXPANEL_TOKEN: process.env.REACT_APP_MIXPANEL_TOKEN,
        ENABLE_TRACKING: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    },

    // Error monitoring
    MONITORING: {
        SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
        LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
    },

    // =============================================================================
    // DEVELOPMENT & DEBUGGING
    // =============================================================================

    // Development settings
    DEV: {
        ENABLE_MSW: process.env.REACT_APP_ENABLE_MSW === 'true',
        ENABLE_STORYBOOK: process.env.REACT_APP_ENABLE_STORYBOOK === 'true',
        MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
    },

    // Debug settings
    DEBUG: {
        ENABLE_REDUX_LOGGER: process.env.REACT_APP_ENABLE_REDUX_LOGGER === 'true',
        ENABLE_API_LOGGER: process.env.REACT_APP_ENABLE_API_LOGGER === 'true',
        SHOW_DEVTOOLS: process.env.REACT_APP_SHOW_DEVTOOLS === 'true',
    },
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate critical configuration values
 * @throws {Error} If critical configuration is missing
 */
export const validateConfig = () => {
    const errors = [];

    // Check critical API configuration
    if (!config.API_BASE_URL) {
        errors.push('REACT_APP_API_BASE_URL is required');
    }

    // Validate API URL format
    try {
        new URL(config.API_BASE_URL);
    } catch {
        errors.push('REACT_APP_API_BASE_URL must be a valid URL');
    }

    // Check Firebase configuration if enabled
    if (config.FIREBASE_ENABLED) {
        const requiredFirebaseKeys = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID'];
        const missingFirebaseKeys = requiredFirebaseKeys.filter(
            key => !config.FIREBASE[key]
        );

        if (missingFirebaseKeys.length > 0) {
            errors.push(`Missing Firebase configuration: ${missingFirebaseKeys.join(', ')}`);
        }
    }

    // Check file upload configuration
    if (config.UPLOAD.MAX_FILE_SIZE <= 0) {
        errors.push('REACT_APP_MAX_FILE_SIZE must be a positive number');
    }

    if (config.UPLOAD.ALLOWED_IMAGE_TYPES.length === 0) {
        errors.push('REACT_APP_ALLOWED_IMAGE_TYPES cannot be empty');
    }

    // Check session configuration
    if (config.SESSION.TIMEOUT_MINUTES <= 0) {
        errors.push('REACT_APP_SESSION_TIMEOUT_MINUTES must be a positive number');
    }

    if (errors.length > 0) {
        const errorMessage = `Configuration validation failed:\n${errors.map(error => `  - ${error}`).join('\n')}`;
        throw new Error(errorMessage);
    }

    console.log('✅ Frontend configuration validation passed');
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
    const baseUrl = config.API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Get the full URL for static assets
 * @param {string} assetPath - Asset path
 * @returns {string} Full asset URL
 */
export const getAssetUrl = (assetPath) => {
    const baseUrl = config.API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    return `${baseUrl}/static${cleanPath}`;
};

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} Whether the feature is enabled
 */
export const isFeatureEnabled = (feature) => {
    return config.FEATURES[feature] === true;
};

/**
 * Get environment-specific configuration
 * @returns {object} Environment-specific config
 */
export const getEnvironmentConfig = () => {
    if (config.IS_DEVELOPMENT) {
        return {
            ...config,
            API_BASE_URL: 'http://localhost:8000',
            ENABLE_MSW: true,
            ENABLE_API_LOGGER: true,
        };
    }

    if (config.IS_PRODUCTION) {
        return {
            ...config,
            ENABLE_MSW: false,
            ENABLE_API_LOGGER: false,
        };
    }

    return config;
};

// =============================================================================
// CONFIGURATION EXPORT
// =============================================================================

// Validate configuration on import
validateConfig();

// Export the configuration object
export default config;

// Export utility functions
export {
    getApiUrl,
    getAssetUrl,
    isFeatureEnabled,
    getEnvironmentConfig,
};