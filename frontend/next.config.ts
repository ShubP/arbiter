import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal standalone server for containerized deployment.
  output: "standalone",
};

export default nextConfig;
