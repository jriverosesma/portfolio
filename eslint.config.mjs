export default {
  extends: ['eslint:recommended', 'plugin:astro/recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['astro'],
  overrides: [
    {
      files: ['*.astro'],
      processor: 'astro/astro',
    },
  ],
}
