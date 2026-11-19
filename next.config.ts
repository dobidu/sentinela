import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Basemap e fontes do mapa: o nome do .pmtiles leva a data do build, então
        // um arquivo novo nunca reaproveita cache de offsets antigos.
        source: "/map/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
