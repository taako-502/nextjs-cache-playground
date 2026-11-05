import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root: path.resolve(__dirname, '../..') },
  devIndicators: false,
};
export default config;
