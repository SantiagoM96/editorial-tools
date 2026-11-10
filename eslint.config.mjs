import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**', 'dist/**', 'dist-pages/**', 'public/**',
      'reference/**', 'playwright-report/**', 'test-results/**',
      'tests/artifacts/**',
      // Código heredado transitorio; motor de imágenes y modelos TS sí se validan.
      'src/features/cronica/engine/legacy-engine.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
