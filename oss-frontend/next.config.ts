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
  // public 그림은 Next 기본값이 `max-age=0`이라 Cloudflare가 요청마다 원본 서버까지 확인하러 간다(#410).
  // 1시간만 둔다 — 파일명이 그대로라 그림을 같은 이름으로 바꾸면 그동안 옛 그림이 보인다.
  // 이 값은 Cloudflare 엣지 기간이다. 기기에는 Cloudflare 설정(Browser Cache TTL)이 4시간으로 올려 내보낸다.
  // 앱을 켤 때마다 받는 밸런스 캐릭터는 import로 옮겨 해시 주소(1년 immutable)로 나간다(balance-character-src.ts).
  // 로컬 next dev는 빼 둔다 — 그림을 바꿔 가며 볼 때 브라우저가 옛 그림을 들고 있으면 안 된다.
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
