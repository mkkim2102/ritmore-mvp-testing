import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 개발 서버는 0.0.0.0에 묶여 있다. 브라우저 출처가 이 목록에 없으면
  // /_next/hmr 이 403이 되고, 소켓이 끊긴 채 클라이언트 핸들러가 붙지 않는다.
  // 127.0.0.1로 열 때와, 바깥 터널 주소로 열 때 둘 다 허용한다.
  allowedDevOrigins: ["127.0.0.1", "**.trycloudflare.com"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
