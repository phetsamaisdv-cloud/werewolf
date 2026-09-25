import js from '@eslint/js';
import globals from 'globals';

const browserGlobals = {...globals.browser};
const nodeGlobals = {...globals.node};

export default [
  {
    ignores: ['node_modules/**', 'archive/**', 'schemas/**', '.wrangler/**', '.agents/**', '.opencode/**', '.vscode/**', 'dist/**']
  },
  js.configs.recommended,
  {
    files: ['app.js', 'sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: browserGlobals
    }
  },
  {
    files: ['sw.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {...browserGlobals, ...globals.serviceworker}
    }
  },
  {
    files: ['test/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: nodeGlobals
    }
  },
  {
    rules: {
      'no-unused-vars': ['error', {args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_', ignoreRestSiblings: true}],
      'no-empty': ['error', {allowEmptyCatch: true}],
      'no-undef': 'error',
      'no-console': 'off',
      'no-constant-binary-expression': 'error',
      'no-self-compare': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-template-curly-in-string': 'error'
    }
  },
  {
    files: ['app.js'],
    rules: {
      // app.js ผูกฟังก์ชันผ่าน inline onclick ใน template string → ESLint มองไม่เห็นการเรียกใช้
      'no-unused-vars': 'off'
    }
  }
];
