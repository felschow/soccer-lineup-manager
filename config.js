// Configuration Management
// This file handles environment-specific configurations

class Config {
    constructor() {
        // Default to development environment
        this.environment = this.detectEnvironment();
        this.firebaseConfig = this.getFirebaseConfig();
    }

    detectEnvironment() {
        // Detect environment based on hostname
        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else if (hostname.includes('github.io')) {
            return 'production';
        } else {
            return 'production';
        }
    }

    getFirebaseConfig() {
        // Secure Firebase config using environment variables or build-time injection
        const defaultConfig = {
            // Default/fallback for development - will be overridden in production
            apiKey: "AIzaSyBIhPmJfQKiay3ymDZYetK8erAlWBF0kC0",
            authDomain: "simplesquad-d2b96.firebaseapp.com",
            projectId: "simplesquad-d2b96",
            storageBucket: "simplesquad-d2b96.firebasestorage.app",
            messagingSenderId: "838946254361",
            appId: "1:838946254361:web:29618041ce08a45777c488",
            measurementId: "G-Z3DSVQ2E3K"
        };

        // In production, these will be injected by build process or environment variables
        const productionConfig = {
            apiKey: window.FIREBASE_API_KEY || defaultConfig.apiKey,
            authDomain: window.FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
            projectId: window.FIREBASE_PROJECT_ID || defaultConfig.projectId,
            storageBucket: window.FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
            messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
            appId: window.FIREBASE_APP_ID || defaultConfig.appId,
            measurementId: window.FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId
        };

        // Use production config if in production environment
        if (this.isProduction()) {
            return productionConfig;
        }

        return defaultConfig;
    }

    // Feature flags
    getFeatureFlags() {
        const flags = {
            development: {
                enableDebugLogging: true,
                enableAnalytics: false,
                enableErrorReporting: true,
                showDevTools: true
            },
            staging: {
                enableDebugLogging: true,
                enableAnalytics: false,
                enableErrorReporting: true,
                showDevTools: false
            },
            production: {
                enableDebugLogging: false,
                enableAnalytics: false, // Disable for GitHub Pages to avoid errors
                enableErrorReporting: true,
                showDevTools: false
            }
        };

        return flags[this.environment] || flags.development;
    }

    // Get current environment
    getEnvironment() {
        return this.environment;
    }

    // Check if development
    isDevelopment() {
        return this.environment === 'development';
    }

    // Check if production
    isProduction() {
        return this.environment === 'production';
    }
}

// Create global config instance
window.appConfig = new Config();