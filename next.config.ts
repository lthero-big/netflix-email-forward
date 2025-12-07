import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 禁用严格模式以避免浏览器扩展引起的 hydration 警告
};

export default nextConfig;
