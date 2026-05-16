import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone"    // next build 시점에 Next가 실행에 필요한 최소 런타임 파일만 모아서 .next/standalone 디렉터리를 만들어 주는 설정
};

export default nextConfig;
