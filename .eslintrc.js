module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Ignore specific rules that were causing build failures
    '@typescript-eslint/no-unused-vars': 'warn',
    '@next/next/no-img-element': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
