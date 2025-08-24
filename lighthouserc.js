module.exports = {
    ci: {
        collect: {
            url: [
                'https://skycaffe.vercel.app/',
                'https://skycaffe.vercel.app/meniu',
                'https://skycaffe.vercel.app/despre',
                'https://skycaffe.vercel.app/meniu-digital'
            ],
            startServerCommand: 'npm run start',
            numberOfRuns: 3,
            settings: {
                preset: 'desktop',
                chromeFlags: '--no-sandbox --disable-dev-shm-usage',
                // Ensure we test with realistic conditions
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1,
                    requestLatencyMs: 0,
                    downloadThroughputKbps: 0,
                    uploadThroughputKbps: 0
                }
            }
        },
        assert: {
            assertions: {
                // Performance - Target 100%
                'categories:performance': ['error', { minScore: 0.95 }],

                // Accessibility - Must be 100%
                'categories:accessibility': ['error', { minScore: 1.0 }],

                // Best Practices - Target 100%
                'categories:best-practices': ['error', { minScore: 0.95 }],

                // SEO - Must be 100%
                'categories:seo': ['error', { minScore: 1.0 }],

                // PWA - Target high score
                'categories:pwa': ['warn', { minScore: 0.8 }],

                // Core Web Vitals
                'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['warn', { maxNumericValue: 300 }],

                // Additional Performance Metrics
                'speed-index': ['warn', { maxNumericValue: 3000 }],
                'interactive': ['warn', { maxNumericValue: 3800 }],

                // SEO Specific Audits
                'document-title': 'error',
                'meta-description': 'error',
                'http-status-code': 'error',
                'link-text': 'error',
                'is-crawlable': 'error',
                'hreflang': 'off',
                'plugins': 'error',

                // Accessibility Specific Audits
                'accesskeys': 'error',
                'aria-allowed-attr': 'error',
                'aria-hidden-body': 'error',
                'aria-hidden-focus': 'error',
                'aria-input-field-name': 'error',
                'aria-required-attr': 'error',
                'aria-roles': 'error',
                'aria-toggle-field-name': 'error',
                'aria-valid-attr': 'error',
                'aria-valid-attr-value': 'error',
                'button-name': 'error',
                'bypass': 'error',
                'color-contrast': 'error',
                'definition-list': 'error',
                'dlitem': 'error',
                'document-title': 'error',
                'duplicate-id': 'error',
                'form-field-multiple-labels': 'error',
                'frame-title': 'error',
                'heading-order': 'error',
                'html-has-lang': 'error',
                'html-lang-valid': 'error',
                'image-alt': 'error',
                'input-image-alt': 'error',
                'label': 'error',
                'landmark-one-main': 'error',
                'link-name': 'error',
                'list': 'error',
                'listitem': 'error',
                'meta-refresh': 'error',
                'meta-viewport': 'error',
                'object-alt': 'error',
                'tabindex': 'error',
                'td-headers-attr': 'error',
                'th-has-data-cells': 'error',
                'valid-lang': 'error',
                'video-caption': 'error',
                'video-description': 'error',

                // Performance Specific Audits
                'render-blocking-resources': 'warn',
                'unused-css-rules': 'warn',
                'unused-javascript': 'warn',
                'uses-optimized-images': 'warn',
                'uses-webp-images': 'warn',
                'uses-text-compression': 'error',
                'uses-responsive-images': 'warn',
                'efficient-animated-content': 'warn',
                'preload-lcp-image': 'warn',
                'total-byte-weight': 'warn'
            }
        },
        upload: {
            target: 'temporary-public-storage'
        }
    }
}
