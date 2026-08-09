/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// PWA/service worker removed — it was intercepting fetch requests
// (specifically /api/warkari/[qrCode]) and causing a broken, sticky
// service worker state on mobile that survived reloads. Not essential for
// the hackathon demo; revisit with a properly configured caching strategy
// later if "add to home screen" is genuinely needed.
module.exports = nextConfig;