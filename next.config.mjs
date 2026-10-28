/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    remotePatterns: [{ protocol: 'https', hostname: 'assets.isthereanydeal.com' }],
  },
}


export default nextConfig

