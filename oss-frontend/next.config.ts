import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",    // next build 시점에 Next가 실행에 필요한 최소 런타임 파일만 모아서 .next/standalone 디렉터리를 만들어 주는 설정
  // iOS 웹뷰를 LAN IP(http://<host>:3000)로 띄울 때 Next dev 리소스(HMR 등)의
  // cross-origin 차단을 풀어준다. dev 전용 설정이라 빌드/배포엔 영향 없다.
  allowedDevOrigins: ["172.30.1.18"],
};

export default nextConfig;
