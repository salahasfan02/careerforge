import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "@react-pdf/renderer", "docx"],
};

export default nextConfig;
