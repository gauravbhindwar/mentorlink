/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  env: {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  },
}

module.exports = nextConfig