/** @type {import('next').NextConfig} */
module.exports = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    serverActions: { bodySizeLimit: '4mb' }, // product image uploads
  },
};
