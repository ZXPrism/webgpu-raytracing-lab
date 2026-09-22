import { defineConfig } from 'vitest/config';
import { preview } from '@vitest/browser-preview';

export default defineConfig({
    test: {
        globals: true,
        browser: {
            enabled: true,
            // NOTE (260922): the `preview` provider launches no browser of its own.
            // It opens the tests in your system's default browser, so NO Chrome
            // install is required. The `browser` field below is just the internal
            // key for this instance (the preview provider ignores it, and
            // `_BrowserNames` is not augmented, so it accepts any string), while
            // `name` is what actually shows up in the test output.
            provider: preview(),
            instances: [{ browser: 'preview', name: 'system browser' }],
        },
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'dist/',
                '*.config.ts',
                'src/test/',
            ],
        },
    },
});
