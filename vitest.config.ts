import { defineConfig } from 'vitest/config';
import { preview } from '@vitest/browser-preview';

export default defineConfig({
    test: {
        globals: true,
        browser: {
            enabled: true,
            instances: [{ browser: 'chrome' }],
            provider: preview(),
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
