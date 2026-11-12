import { NextResponse } from "next/server";

import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";

/**
 * Apple App Site Association (유니버설 링크)
 * - Apple은 `/.well-known/apple-app-site-association`를 확장자 없는 경로로 요청하고
 *   리다이렉트 없는 200 + `Content-Type: application/json` 응답을 요구한다.
 *   public/ 정적 파일로 두면 확장자가 없어 MIME 타입을 보장할 수 없어, 라우트 핸들러로 헤더를 직접 제어한다.
 * - 요청 때 만든다 — 대회 상세(/competition/*)는 대회 화면을 여는 배포(COMPETITION_ENABLED)에서만 앱으로 넘긴다.
 *   꺼진 배포는 대회 상세가 404라, 앱에 넘기면 열 화면이 없다. 빌드 때 그려 두면 빌드 환경 값으로 굳어 버린다.
 */
export const dynamic = "force-dynamic";

/** Team ID + Bundle ID. dev·운영 번들이 동일해 두 도메인이 같은 내용을 서빙한다. */
const APP_ID = "3T5QFYSPG5.com.jiujitsulab.connect";

/**
 * 글쓰기(/community/write)는 앱으로 넘기지 않고 웹에 남긴다.
 * 대회 상세(/competition/{id}, #369)는 공유 링크로 들어오면 앱에서 연다(jiu-jitsu-ios#251). 대회 탭 목록(/competition)은 넘기지 않는다.
 */
function appleAppSiteAssociation() {
    return {
        applinks: {
            details: [
                {
                    appIDs: [APP_ID],
                    components: [
                        { "/": "/community/write", exclude: true },
                        { "/": "/community/*" },
                        ...(isCompetitionEnabled()
                            ? [{ "/": "/competition/*" }]
                            : []),
                    ],
                },
            ],
        },
    };
}

export async function GET() {
    return NextResponse.json(appleAppSiteAssociation(), {
        status: 200,
        // charset 없이 정확히 application/json으로 내려야 Apple 검증을 통과한다.
        headers: { "Content-Type": "application/json" },
    });
}
