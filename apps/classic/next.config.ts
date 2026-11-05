import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = {
  cacheComponents: false,
  turbopack: { root: path.resolve(__dirname, '../..') },
  devIndicators: false,
};
export default config;
