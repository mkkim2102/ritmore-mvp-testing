import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 브라우저는 127.0.0.1로 열고, 개발 서버는 0.0.0.0에 묶여 있다.
  // 이 출처를 허용하지 않으면 HMR 소켓이 막혀 클라이언트 핸들러가 붙지 않는다.
  allowedDevOrigins: ["127.0.0.1"],
  // 가격과 퍼널 숫자는 요청마다 달라서 페이지 캐시를 쓰지 않는다.
  cacheComponents: false,
  // 엑셀 파일은 서버에서만 만든다.
  serverExternalPackages: ["exceljs"],
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
