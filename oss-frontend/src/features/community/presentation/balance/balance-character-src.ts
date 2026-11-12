import type { BalanceOptionKey } from "@/features/community/domain/balance-game";
import type { BalanceOptionState } from "@/features/community/presentation/balance/balance-option-button";

import characterADefault from "@/features/community/presentation/balance/images/character-a-default.png";
import characterAIdle from "@/features/community/presentation/balance/images/character-a-idle.png";
import characterASelected from "@/features/community/presentation/balance/images/character-a-selected.png";
import characterAUnselected from "@/features/community/presentation/balance/images/character-a-unselected.png";
import characterBDefault from "@/features/community/presentation/balance/images/character-b-default.png";
import characterBIdle from "@/features/community/presentation/balance/images/character-b-idle.png";
import characterBSelected from "@/features/community/presentation/balance/images/character-b-selected.png";
import characterBUnselected from "@/features/community/presentation/balance/images/character-b-unselected.png";

/**
 * 밸런스 게임 캐릭터 그림 8장(알파 있음) — 홈 캐릭터(BalanceCharacter)와 디자인 시스템 페이지(/ds)가 함께 쓴다.
 * 크기는 174×198(58×66의 @3x)이고 unselected 두 장만 144×164다(밀려나 작게 보이는 쪽).
 *
 * 파일명이 색(빨강/파랑)이 아니라 선택지 키(A/B)를 따르는 이유: 어느 쪽이 무슨 색인지는
 * OPTION_STYLES의 poll-option-a/b 토큰이 이미 정한다. 파일명까지 색으로 부르면 색의 출처가
 * 둘이 되어, 토큰만 바뀌었을 때 자산이 조용히 어긋난다.
 *
 * 아트워크 자체가 상태를 말한다(디자인 원본의 표정 변형):
 * - default = 곁눈질하는 **회색** 캐릭터. A/B 모두 무채색이고 고개 방향만 좌우로 갈린다.
 * - selected = 눈을 크게 뜬 컬러, unselected = 눈이 처진 컬러.
 * - idle = unselected에서 눈만 지운 몸통. 투표 전 대결과 고른 쪽의 노려보기에 쓰고, 눈은 코드가 얹는다.
 *
 * 즉 투표 전에는 행 배경만 색을 내고 캐릭터는 무채색이다가, 투표하는 순간 캐릭터에 색이 든다.
 * 캐릭터 뒤에는 어떤 상태에서도 배경을 깔지 않는다 — 행 배경이 그대로 비쳐야 한다(디자인).
 *
 * WHY public이 아니라 import인가(#410): public 파일은 Next가 `max-age=0`을 붙여 Cloudflare가 매번 원본
 * 서버까지 확인하러 간다. import하면 `/_next/static/media/<이름>.<해시>.png`로 나가 1년 immutable로
 * 캐시되고, 그림을 같은 이름으로 바꿔도 해시가 바뀌어 옛 그림이 남지 않는다.
 * 앱을 켤 때마다 받는 그림이라 여기만 옮겼다. 나머지 public 그림은 next.config의 headers()가 캐시 기간을 둔다.
 * 그림을 바꿀 때는 images/의 같은 이름 파일을 덮어쓰면 된다.
 *
 * "use client" 파일과 나눈 이유: 서버 컴포넌트(/ds)가 클라이언트 파일의 상수를 import하면 값이 아니라
 * 클라이언트 참조가 와서 읽을 수 없다.
 */
export const BALANCE_CHARACTER_SRC: Record<
  BalanceOptionKey,
  Record<BalanceOptionState | "idle", string>
> = {
  A: {
    default: characterADefault.src,
    idle: characterAIdle.src,
    selected: characterASelected.src,
    unselected: characterAUnselected.src,
  },
  B: {
    default: characterBDefault.src,
    idle: characterBIdle.src,
    selected: characterBSelected.src,
    unselected: characterBUnselected.src,
  },
};
