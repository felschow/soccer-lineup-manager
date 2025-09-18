// Production Environment Configuration
// This file will be loaded in production to inject environment variables

(function() {
    'use strict';

    // Production environment detection
    const isProduction = window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('github.io');

    if (isProduction) {
        // Inject Firebase config from environment
        // These will be replaced during build/deployment
        window.FIREBASE_API_KEY = 'AIzaSyBIhPmJfQKiay3ymDZYetK8erAlWBF0kC0';
        window.FIREBASE_AUTH_DOMAIN = 'simplesquad-d2b96.firebaseapp.com';
        window.FIREBASE_PROJECT_ID = 'simplesquad-d2b96';
        window.FIREBASE_STORAGE_BUCKET = 'simplesquad-d2b96.firebasestorage.app';
        window.FIREBASE_MESSAGING_SENDER_ID = '838946254361';
        window.FIREBASE_APP_ID = '1:838946254361:web:29618041ce08a45777c488';
        window.FIREBASE_MEASUREMENT_ID = 'G-Z3DSVQ2E3K';

        // Production feature flags
        window.PRODUCTION_MODE = true;
        window.DEBUG_MODE = false;
        window.ANALYTICS_ENABLED = false; // Keep disabled for now
        window.ERROR_REPORTING_ENABLED = true;

        // Performance optimizations
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(function() {
                // Preload critical resources when browser is idle
                const criticalResources = [
                    'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js',
                    'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js',
                    'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'
                ];

                criticalResources.forEach(url => {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'script';
                    link.href = url;
                    document.head.appendChild(link);
                });
            });
        }

        // Security: Remove development helpers
        delete window.eval;
        delete window._originalConsole;

        console.log('🔥 SimpleSquad Production Mode Active');
    }
})();