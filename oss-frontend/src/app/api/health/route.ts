import { NextResponse } from "next/server";

/**
 * Health Check
 * - 비즈니스 기능 제공이 아니라 단순하게 컨테이너가 HTTP 응답 가능한 상태인지 확인하는 진입점
 * - 위와 같은 이유로 복잡한 구조 보다는 예외적으로 얇고 단순하게 유지 ..
 * @returns 
 */
export async function GET() {
    return NextResponse.json(
        {
            success: true,
            data: {
                status: "ok",
                timestamp: new Date().toISOString(),
            },
        },
        { status: 200 },
    );
}