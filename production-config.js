// Production Environment Detection
(function() {
    'use strict';

    // Wait for config to load, then set production flags
    if (window.appConfig && window.appConfig.isProduction()) {
        window.PRODUCTION_MODE = true;
        window.DEBUG_MODE = false;
        console.log('🔥 SimpleSquads Production Mode Active');
    }
})();