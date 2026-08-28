import { NextResponse } from "next/server";

/**
 * Apple App Site Association (유니버설 링크)
 * - Apple은 `/.well-known/apple-app-site-association`를 확장자 없는 경로로 요청하고
 *   리다이렉트 없는 200 + `Content-Type: application/json` 응답을 요구한다.
 *   public/ 정적 파일로 두면 확장자가 없어 MIME 타입을 보장할 수 없어, 라우트 핸들러로 헤더를 직접 제어한다.
 * - 빌드 타임에 프리렌더해 요청마다 서버 로직이 도는 것을 막는다.
 */
export const dynamic = "force-static";

/** Team ID + Bundle ID. dev·운영 번들이 동일해 두 도메인이 같은 내용을 서빙한다. */
const APP_ID = "3T5QFYSPG5.com.jiujitsulab.connect";

/** 글쓰기(/community/write)는 앱으로 넘기지 않고 웹에 남긴다. */
const APPLE_APP_SITE_ASSOCIATION = {
    applinks: {
        details: [
            {
                appIDs: [APP_ID],
                components: [
                    { "/": "/community/write", exclude: true },
                    { "/": "/community/*" },
                ],
            },
        ],
    },
} as const;

export async function GET() {
    return NextResponse.json(APPLE_APP_SITE_ASSOCIATION, {
        status: 200,
        // charset 없이 정확히 application/json으로 내려야 Apple 검증을 통과한다.
        headers: { "Content-Type": "application/json" },
    });
}
