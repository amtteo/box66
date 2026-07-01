import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const apkHeaders = [
  {
    key: "Content-Type",
    value: "application/vnd.android.package-archive",
  },
  {
    key: "Content-Disposition",
    value: "inline",
  },
];

const nextConfig: NextConfig = {
  // Native pg + Prisma adapter must not be bundled by Turbopack (causes flaky DB connections).
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client"],
  async headers() {
    return [
      { source: "/pos.apk", headers: apkHeaders },
      { source: "/kds.apk", headers: apkHeaders },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
