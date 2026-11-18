import { NextResponse } from "next/server";

import { getAnalyticsMeasurementId } from "@/config/env";

/**
 * GET /api/analytics/config — 앱 밖 브라우저가 GA 웹 태그를 띄울지 · 어느 속성으로 보낼지(#579).
 *
 * 레이아웃에서 env를 읽지 않는 이유: 정적 페이지(정책 · 고객 지원)는 빌드 때 값이 굳고(빌드 환경엔 값이 없다),
 * 요청 때 읽게 하면 모든 페이지가 동적 렌더로 바뀐다. 측정 ID는 공개 값이라 그대로 내려 준다.
 * 배포(호스트)마다 값이 달라 공유 캐시가 호스트별로 5분 들고 있어도 된다.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { measurementId: getAnalyticsMeasurementId() },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
