import type { NextConfig } from "next";

// iOS 웹뷰를 LAN IP(http://<host>:3000)로 띄울 때 Next dev 리소스(HMR 등)의
// cross-origin 차단을 풀어준다. 개발자마다 LAN IP가 다르므로 하드코딩 대신
// DEV_ALLOWED_ORIGINS(콤마 구분)로 받는다. 본인 .env.development에 설정한다.
// dev 전용이라 빌드/배포엔 영향 없다.
const devAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",    // next build 시점에 Next가 실행에 필요한 최소 런타임 파일만 모아서 .next/standalone 디렉터리를 만들어 주는 설정
  allowedDevOrigins: devAllowedOrigins,
};

export default nextConfig;
