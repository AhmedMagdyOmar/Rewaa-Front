import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const getRemotePatterns = (): NonNullable<NextConfig["images"]>["remotePatterns"] => {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
    {
      protocol: "http",
      hostname: "localhost",
      port: "8000",
      pathname: "/**",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "8000",
      pathname: "/**",
    },
  ];

  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_API_URL);
      const isAlreadyAdded = patterns.some(
        (p) => p.hostname === parsed.hostname && (p.port || "") === parsed.port,
      );
      if (!isAlreadyAdded) {
        patterns.push({
          protocol: parsed.protocol.replace(":", "") as "http" | "https",
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          pathname: "/**",
        });
      }
    } catch {
      // Ignore invalid URL
    }
  }

  if (process.env.S3_ENDPOINT) {
    try {
      const endpoint = process.env.S3_ENDPOINT;
      const parsed = new URL(endpoint.startsWith("http") ? endpoint : `https://${endpoint}`);
      patterns.push({
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        pathname: "/**",
      });
    } catch {
      // Ignore invalid URL
    }
  }

  return patterns;
};

const isLocalApi =
  process.env.NODE_ENV !== "production" ||
  Boolean(process.env.NEXT_PUBLIC_API_URL?.includes("localhost")) ||
  Boolean(process.env.NEXT_PUBLIC_API_URL?.includes("127.0.0.1")) ||
  process.env.DANGEROUSLY_ALLOW_LOCAL_IP === "true";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: getRemotePatterns(),
    dangerouslyAllowLocalIP: isLocalApi,
  },
};

const withMDX = createMDX({});

export default withNextIntl(withMDX(nextConfig));
