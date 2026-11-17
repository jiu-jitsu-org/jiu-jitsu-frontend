"use client";

import { useState } from "react";

import { BackButton } from "@/shared/ui/back-button";
import { Chip } from "@/shared/ui/chip";
import { Divider } from "@/shared/ui/divider";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

import { OpenInAppPromptDemo, RelativeTimeSamples } from "../design-system-demos";
import {
  Anatomy,
  Code,
  DocPage,
  DocTable,
  Dot,
  Fold,
  H,
  MarkerLegend,
  Measure,
  P,
  Pair,
  Stage,
  Sub,
  USAGE_DATE,
} from "../doc-kit";

/* ───────────────────────── Chip ───────────────────────── */

const FILTERS = ["관심", "서울", "접수 중", "노기"];

function ChipToggleRow({ tone }: { tone: "neutral" | "primary" }) {
  const [on, setOn] = useState<Record<string, boolean>>({ 서울: true, "접수 중": true });
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((label) => (
        <Chip
          key={label}
          tone={tone}
          selected={on[label] ?? false}
          aria-pressed={on[label] ?? false}
          onClick={() => setOn((prev) => ({ ...prev, [label]: !prev[label] }))}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}

export function ChipDoc() {
  const D = "chip";
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `3개 파일 · 5번 (${USAGE_DATE})` },
        { label: "색", value: 2 },
        { label: "상태", value: 4 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        고르면 켜지는 둥근 버튼. 커뮤니티 글쓰기 카테고리(#303)와 대회 목록 필터(#334)·지역 시트가 같이
        쓴다. 눌러서 켜고 꺼 본다.
      </P>
      <Stage>
        <ChipToggleRow tone="primary" />
      </Stage>

      <H doc={D} id="anatomy">해부도</H>
      <Stage className="gap-10">
        <Anatomy
          marks={[
            { top: "0%", left: "15%" },
            { top: "100%", left: "50%" },
          ]}
        >
          <Chip selected={false}>서울</Chip>
        </Anatomy>
        <Anatomy start={3} marks={[{ top: "0%", left: "85%" }]}>
          <Chip selected tone="primary">
            접수 중
          </Chip>
        </Anatomy>
      </Stage>
      <MarkerLegend
        items={[
          { name: "테두리 1", note: "꺼짐은 옅은 회색 테두리 + 투명 면" },
          { name: "글자", note: "Button S · 좌우 12" },
          { name: "켜짐 면", note: "primary면 옅은 파랑 면 + 파랑 테두리·글자" },
        ]}
      />

      <H doc={D} id="variants">변형</H>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-20 bg-surface-field-subtle p-4">
          <ChipToggleRow tone="neutral" />
          <div>
            <p className="font-mono text-label-m text-text-primary">tone=&quot;neutral&quot; (기본)</p>
            <p className="text-label-m text-text-tertiary">글쓰기 카테고리 — 하나만 고름, 켜짐이 차분하다</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-20 bg-surface-field-subtle p-4">
          <ChipToggleRow tone="primary" />
          <div>
            <p className="font-mono text-label-m text-text-primary">tone=&quot;primary&quot;</p>
            <p className="text-label-m text-text-tertiary">대회 필터 — 여러 개를 겹쳐 켜도 한눈에 읽힌다</p>
          </div>
        </div>
      </div>

      <H doc={D} id="sizes">크기</H>
      <Stage>
        <Measure pick={["높이", "모서리", "좌우", "글자"]} label="한 가지 크기">
          <Chip selected={false}>서울</Chip>
        </Measure>
      </Stage>

      <H doc={D} id="states">상태</H>
      <DocTable
        cols="repeat(4, minmax(0, 1fr))"
        head={["꺼짐", "켜짐", "필수인데 비움(invalid)", "비활성"]}
        rows={[
          [
            <Chip key="a" selected={false}>
              기술
            </Chip>,
            <Chip key="b" selected>
              기술
            </Chip>,
            <Chip key="c" selected={false} invalid>
              기술
            </Chip>,
            <Chip key="d" selected={false} disabled>
              기술
            </Chip>,
          ],
          [
            <Chip key="a" tone="primary" selected={false}>
              노기
            </Chip>,
            <Chip key="b" tone="primary" selected>
              노기
            </Chip>,
            <Chip key="c" tone="primary" selected={false} invalid>
              노기
            </Chip>,
            <Chip key="d" tone="primary" selected={false} disabled>
              노기
            </Chip>,
          ],
        ]}
      />
      <P>누르는 동안 0.96으로 눌렸다가 놓으면 스프링으로 돌아온다(Button l과 같은 값).</P>

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        good={<ChipToggleRow tone="primary" />}
        goodNote="켜고 끄는 칩에는 aria-pressed를 붙인다 — 칩이 대신 붙이지 않는다."
        bad={
          <Chip selected={false} onClick={() => {}}>
            저장하기
          </Chip>
        }
        badNote="누르면 일이 끝나는 동작은 칩이 아니라 Button."
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["Chip", "켜고 끄는 값 — 필터·카테고리"],
          ["대회 상태 칩(StatusChip)", "누를 수 없는 표시 — 접수 중·마감. 테두리 없이 면만(대회 줄 패턴 참고)"],
          ["Button", "누르면 일이 끝나는 동작"],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[
          ["꺼짐 테두리", <Dot key="a" token="chip-default-border" withName />],
          ["켜짐 면(neutral)", <Dot key="b" token="tag-chip-selected-bg" withName />],
          ["켜짐 테두리(neutral)", <Dot key="c" token="chip-selected-border" withName />],
          ["켜짐(primary)", <Dot key="d" token="primary" withName />],
          ["켜짐 면(primary)", <Dot key="e" token="surface-primary-subtle" withName />],
          ["글자", <Dot key="f" token="tag-chip-default-text" withName />],
          ["오류 테두리", <Dot key="g" token="border-error" withName />],
          ["비활성 글자", <Dot key="h" token="tag-chip-disabled-text" withName />],
        ]}
      />
      <P>
        칩 토큰에 파랑 켜짐 · 오류 색이 없어 의미 토큰(<Code>primary</Code> · <Code>border-error</Code>)을
        빌려 쓴다.
      </P>

      <H doc={D} id="oss">오스에서</H>
      <Sub>누르면 시트를 여는 칩</Sub>
      <P>
        대회 필터의 &lsquo;지역&rsquo;처럼 누르면 고르는 시트가 열리는 칩은 켜고 끄는 단추가 아니다 — 그래서{" "}
        <Code>aria-pressed</Code>를 칩이 대신 붙이지 않고 호출부가 정한다.
      </P>
      <Sub>필수 선택을 비운 채 등록</Sub>
      <P>
        글쓰기에서 카테고리를 고르지 않고 등록을 누르면 꺼진 칩 테두리가 오류 색으로 바뀐다(
        <Code>invalid</Code>). 어느 칸이 비었는지 &lsquo;카테고리를 선택해주세요&rsquo; 안내와 함께 짚어 준다.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── Skeleton ───────────────────────── */

export function SkeletonDoc() {
  const D = "skeleton";
  return (
    <DocPage
      id={D}
      meta={[{ label: "쓰는 곳", value: `7개 파일 · 40번 (${USAGE_DATE})` }]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        불러오는 동안 실제 내용이 들어올 자리에 옅은 회색 면을 깐다. 크기·모양은{" "}
        <Code>className</Code>으로 정한다(글 줄 <Code>h-4 w-40</Code>, 동그란 프로필{" "}
        <Code>size-10 rounded-full</Code>).
      </P>
      <Stage tone="plain" align="start">
        <div className="flex items-center gap-3 motion-safe:animate-pulse">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </Stage>

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        tone="plain"
        good={
          <div className="flex w-full max-w-60 flex-col gap-2 motion-safe:animate-pulse">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        }
        goodNote="깜빡임은 줄이나 화면을 감싼 바깥에 한 번 건다."
        bad={
          <div className="flex w-full max-w-60 flex-col gap-2">
            <Skeleton className="h-4 w-32 motion-safe:animate-pulse" />
            <Skeleton className="h-3 w-48 motion-safe:animate-pulse [animation-delay:300ms]" />
          </div>
        }
        badNote="블록마다 걸면 타이밍이 어긋나 지저분하게 반짝인다."
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["Skeleton", "무엇이 올지 모양을 아는 첫 불러오기 — 목록·상세"],
          ["Spinner", "모양을 모르거나 작은 자리 — 더 불러오기·버튼 옆"],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[["면", <Dot key="a" token="feed-card-header-avatar-bg" withName />]]}
      />
      <P>뼈대를 쓰는 화면: 글 상세(11) · 글쓰기(7) · 내 활동(6) · 대회 목록(5) · 알림함(4) · 대회 상세(4) · 차단 회원(3).</P>
    </DocPage>
  );
}

/* ───────────────────────── Spinner ───────────────────────── */

export function SpinnerDoc() {
  const D = "spinner";
  return (
    <DocPage id={D} meta={[{ label: "쓰는 곳", value: `2개 파일 · 2번 (${USAGE_DATE})` }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        2px 고리에서 위쪽만 비운 원이 돈다. 0.15초 늦게 옅게 나타나 빨리 끝나는 불러오기에서는
        깜빡이지 않는다. 동작 줄이기 설정이면 돌지 않고 천천히 깜빡인다.
      </P>
      <Stage tone="plain" className="gap-8">
        <Measure pick={["폭"]} label="기본">
          <Spinner />
        </Measure>
        <Measure pick={["폭"]} label="size-8">
          <Spinner className="size-8" />
        </Measure>
      </Stage>
      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[["고리", <Dot key="a" token="feed-card-header-avatar-bg" withName />]]}
      />
      <P>
        스크린리더 이름은 <Code>label</Code>(기본 &lsquo;불러오는 중&rsquo;). 서버 컴포넌트에서도 쓰도록
        상태가 없다.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── Divider ───────────────────────── */

export function DividerDoc() {
  const D = "divider";
  return (
    <DocPage id={D} meta={[{ label: "쓰는 곳", value: `3개 파일 · 3번 (${USAGE_DATE})` }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        글 본문과 댓글처럼 큰 덩어리 사이를 나누는 4px 회색 띠. 선 대신 면으로 나눈다. 위아래 간격은
        호출부가 정한다(본문 아래는 <Code>mt-6</Code>).
      </P>
      <Stage tone="plain" align="start">
        <p className="text-body-s text-text-secondary">본문</p>
        <Divider className="-mx-6 my-4" />
        <p className="text-body-s text-text-secondary">댓글</p>
      </Stage>

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        tone="plain"
        good={
          <div className="flex w-full flex-col gap-3">
            <p className="text-body-s text-text-secondary">작성자 · 시간</p>
            <p className="text-body-s text-text-primary">본문 첫 줄</p>
          </div>
        }
        goodNote="같은 덩어리 안의 작은 구분은 간격으로."
        bad={
          <div className="flex w-full flex-col">
            <p className="text-body-s text-text-secondary">작성자 · 시간</p>
            <Divider className="my-2" />
            <p className="text-body-s text-text-primary">본문 첫 줄</p>
          </div>
        }
        badNote="덩어리 안에 띠를 넣으면 화면이 토막 난다."
      />
      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[
          ["띠", <Dot key="a" token="divider-bg" withName />],
          ["두께", "4 (h-1)"],
        ]}
      />
      <Fold title="예전 /ds의 Divider 설명">
        <p className="pt-2 text-body-s text-text-secondary">큰 덩어리 사이 4px 띠</p>
      </Fold>
    </DocPage>
  );
}

/* ───────────────────────── BackButton ───────────────────────── */

export function BackButtonDoc() {
  const D = "back-button";
  return (
    <DocPage id={D} meta={[{ label: "쓰는 곳", value: `3개 파일 · 3번 (${USAGE_DATE})` }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        개발용 테스트 화면(메인 허브 · 실험 화면)이 메인으로 돌아오는 버튼. 기록이 있으면 뒤로, 직접
        들어왔으면 <Code>fallbackHref</Code>(기본 <Code>/</Code>)로 간다. 앱 화면의 앱바에는 쓰지
        않는다 — 그쪽은 네이티브 닫기(CLOSE_SUBVIEW)를 거친다.
      </P>
      <Stage tone="plain" align="start">
        <BackButton fallbackHref="/ds" />
      </Stage>
      <P>
        안쪽은 IconButton ghost m + BackArrow 24. 누르면 이 페이지에서 실제로 뒤로 간다.
      </P>
      <Sub>정리할 것</Sub>
      <P>
        아이콘 색에 토큰이 아닌 <Code>text-zinc-900</Code>이 남아 있다. 고칠 때 <Code>text-icon-primary</Code>로.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── OpenInAppPrompt ───────────────────────── */

export function OpenInAppPromptDoc() {
  const D = "open-in-app-prompt";
  return (
    <DocPage id={D} meta={[{ label: "부르는 곳", value: `2개 파일 (${USAGE_DATE})` }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        외부 브라우저(비로그인)에서 좋아요·댓글·저장처럼 로그인이 필요한 것을 눌렀을 때 뜨는 &lsquo;앱에서
        계속하기&rsquo; 안내. 회색으로 죽여 두면 고장으로 읽혀서, 눌렀을 때 이유를 말하고 앱으로 넘긴다.
        루트에 하나 두고 어디서든 <Code>useOpenInAppPrompt().prompt()</Code>로 연다.
      </P>
      <Stage>
        <OpenInAppPromptDemo />
      </Stage>
      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["OpenInAppPrompt", "웹(앱 밖)에서 — 앱으로 보낸다"],
          ["네이티브 로그인 유도", "앱 웹뷰 안에서 — AUTH_LOGIN_PROMPT"],
          ["대화상자(ConfirmDialog)", "같은 모양의 확인 · 취소"],
        ]}
      />
    </DocPage>
  );
}

/* ───────────────────────── RelativeTime ───────────────────────── */

export function RelativeTimeDoc() {
  const D = "relative-time";
  return (
    <DocPage id={D} meta={[{ label: "쓰는 곳", value: `4개 파일 · 4번 (${USAGE_DATE})` }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        &lsquo;3분 전&rsquo;처럼 지금 기준으로 쓴 시간. 서버 시각 기준 시계(<Code>ServerClockProvider</Code>)를
        읽어 60초마다 · 앱으로 돌아올 때 다시 그린다. 시계가 없는 곳(이 페이지)에서는 기기 시계를 쓴다.
      </P>
      <Stage align="start">
        <RelativeTimeSamples />
      </Stage>
      <H doc={D} id="rules">규칙</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["지난 시간", "보이는 글"]}
        rows={[
          ["1분 미만", "방금 전"],
          ["1분 ~ 59분", "N분 전"],
          ["1시간 ~ 23시간", "N시간 전"],
          ["1일 ~ 6일", "N일 전"],
          ["7일 이상 · 올해", "M월 D일"],
          ["7일 이상 · 해가 바뀜", "YY년 M월 D일"],
        ]}
      />
      <P>
        정확한 시각(&lsquo;YY년 M월 D일 HH:mm&rsquo;)은 글 상세에서 시간을 눌렀을 때만 보인다. 서버 날짜는
        타임존 없는 한국 시각이라 infrastructure에서 <Code>toKstIso</Code>로 맞춰 넘긴다.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── FallbackScreen ───────────────────────── */

export function FallbackScreenDoc() {
  const D = "fallback-screen";
  return (
    <DocPage id={D} meta={[{ label: "쓰는 곳", value: "5개 파일 · 5번 (2026-11-17 기준)" }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        없는 주소 · 화면 오류 · 없는 대회 · 글 수정 불러오기 실패에서 화면 전체를 대신하는 안내(#503). 제목 +
        (설명) + 지금 자리에서 나갈 버튼. 화면 높이 전체를 쓰므로 여기서는 실물 대신 규칙만 둔다 — 실물은
        없는 주소(예: <Code>/zzz</Code>)로 본다.
      </P>

      <H doc={D} id="places">자리별 버튼</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "버튼"]}
        rows={[
          ["앱 서브뷰", "(다시 시도) + 닫기 — 앱에 CLOSE_SUBVIEW"],
          ["앱 탭 첫 화면", "다시 시도만 — / · /competition은 닫을 곳이 없다"],
          ["브라우저", "(다시 시도) + browserLink (기본 '홈으로' /)"],
        ]}
      />
      <P>
        자리는 브릿지와 주소로 정해 서버는 브라우저 모양으로 그리고 하이드레이션 뒤 바뀐다. 버튼 줄 높이를
        고정해 문구가 움직이지 않는다. PAGE_READY는 보내지 않는다(앱이 정상 화면으로 여겨 스와이프를 막지
        않게).
      </P>

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["FallbackScreen", "화면 자체를 그릴 수 없을 때 — 나갈 길이 필요"],
          ["DetailErrorState", "상세 조회만 실패, 앱 헤더 · 뒤로가기는 살아 있을 때"],
          ["EmptyState", "불러오기는 끝났는데 보여 줄 것이 없을 때"],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[
          ["제목", <Dot key="a" token="empty-state-default-title-text" withName />],
          ["설명", <Dot key="b" token="empty-state-default-description-text" withName />],
          ["버튼 바탕", <Dot key="c" token="button-neutral-default-bg" withName />],
        ]}
      />
    </DocPage>
  );
}
