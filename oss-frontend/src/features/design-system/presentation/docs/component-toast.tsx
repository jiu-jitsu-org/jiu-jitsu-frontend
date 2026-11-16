import { ToastDemo, ToastStage } from "../design-system-demos";
import {
  Code,
  DocPage,
  DocTable,
  Dot,
  Fold,
  H,
  Marker,
  MarkerLegend,
  P,
  Sub,
  USAGE_DATE,
} from "../doc-kit";

const D = "toast";

const TONES = [
  { tone: "success", label: "완료", count: 18, message: "게시글을 삭제했어요", when: "요청이 끝났을 때" },
  { tone: "info", label: "안내", count: 21, message: "이 글의 알림을 받아요", when: "상태가 바뀌었거나 알려줄 것이 있을 때" },
  { tone: "warning", label: "주의", count: 14, message: "사진은 최대 3장까지 첨부할 수 있어요", when: "한도에 닿았거나 지금은 할 수 없을 때" },
  { tone: "error", label: "실패", count: 27, message: "게시글을 삭제하지 못했어요", when: "요청이 실패했을 때" },
] as const;

export function ToastDoc() {
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `21개 파일 · 80번 (${USAGE_DATE})` },
        { label: "상태", value: 4 },
        { label: "되돌리기 버튼", value: "5번" },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        아래에 좌우로 길게 잠깐 떴다 사라지는 결과 알림. 앱 맨 바깥에 <Code>ToastProvider</Code>가
        있고, 어디서든 <Code>useToast().show(문구, {"{ tone, action }"})</Code>로 띄운다. 아래 판은 진짜
        토스트를 판 안에 띄운 것이다 — 누르면 다시 뜬다.
      </P>
      <div className="mt-4">
        <ToastStage message="게시글을 숨겼어요" tone="success" actionLabel="되돌리기" />
      </div>

      <H doc={D} id="anatomy">해부도</H>
      <div className="mt-4">
        <ToastStage
          message="게시글을 숨겼어요"
          tone="success"
          actionLabel="되돌리기"
          marks={
            <>
              <Marker n={1} top="calc(100% - 74px)" left="16px" className="z-[70]" />
              <Marker n={2} top="calc(100% - 66px)" left="42px" className="z-[70]" />
              <Marker n={3} top="calc(100% - 66px)" left="110px" className="z-[70]" />
              <Marker n={4} top="calc(100% - 66px)" left="calc(100% - 56px)" className="z-[70]" />
            </>
          }
        />
      </div>
      <MarkerLegend
        items={[
          { name: "상자", note: "최소 높이 58 · 모서리 20 · 짙은 바탕 + 옅은 그림자. 여러 줄이면 늘어난다." },
          { name: "상태 아이콘", note: "20 · 색 면 위 짙은 기호(실패만 흰 기호)" },
          { name: "문구", note: "Body S · 아이콘과 12 띄움" },
          { name: "되돌리기 버튼(선택)", note: "면 없는 하늘색 글자 · 문구와 8 띄움" },
        ]}
      />

      <H doc={D} id="variants">변형</H>
      <P>상태마다 왼쪽 아이콘만 바뀐다 — 모양·움직임은 같다. 숫자는 그 상태로 띄우는 곳({USAGE_DATE}).</P>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {TONES.map((tone) => (
          <div key={tone.tone} className="flex flex-col gap-2">
            <ToastStage message={tone.message} tone={tone.tone} className="h-28" />
            <p className="font-mono text-label-m text-text-primary">
              {tone.tone}
              {" "}
              <span className="ml-1 font-sans text-text-tertiary">
                {tone.label} · {tone.count}번
              </span>
            </p>
            <p className="text-label-m text-text-tertiary">{tone.when}</p>
          </div>
        ))}
      </div>

      <H doc={D} id="states">상태 · 움직임</H>
      <DocTable
        cols="120px minmax(0,1fr)"
        head={["때", "모양"]}
        rows={[
          ["나타남", "16 아래 · 0.96에서 500ms 스프링(ease-spring-gentle)으로 떠오름"],
          ["떠 있음", "2초. 되돌리기 버튼이 있으면 읽고 누를 시간을 줘 5초"],
          ["다시 불림", "상자는 그대로, 글자만 아래에서 새로 올라옴 — 같은 일이 또 일어났음을 알림"],
          ["밀어서 닫기", "아래로 36px 넘게 밀고 놓으면 바로 닫힘. 미는 동안 흐려짐"],
          ["사라짐", "200ms에 8 내려가며 흐려짐"],
          ["동작 줄이기", "옅게 나타나고 사라지기만 함"],
        ]}
      />
      <P>앱 화면 아래에서 직접 띄워 본다.</P>
      <div className="mt-3">
        <ToastDemo />
      </div>

      <H doc={D} id="guidelines">가이드라인</H>
      <DocTable
        cols="minmax(0,1fr) minmax(0,1fr)"
        head={["좋은 예", "피할 것"]}
        rows={[
          ["게시글을 삭제했어요 — 무엇이 어떻게 됐는지 한 문장", "완료되었습니다 — 무엇이 끝났는지 모름"],
          ["게시글을 삭제하지 못했어요 — 실패도 같은 문장 꼴", "오류가 발생했습니다(500) — 내부 사정을 그대로"],
          ["숨기기처럼 되돌릴 수 있으면 '되돌리기' 버튼", "삭제처럼 되돌릴 수 없는데 '되돌리기'를 붙임"],
          ["결과 알림은 토스트 하나", "토스트를 띄우고 같은 말을 화면에도 또 씀"],
        ]}
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["Toast", "방금 한 동작의 결과 — 몰라도 계속 쓸 수 있는 것"],
          ["대화상자(ConfirmDialog)", "멈추고 골라야 할 때 — 삭제 확인처럼"],
          ["OpenInAppPrompt", "웹에서 앱 전용 동작을 눌렀을 때 — 앱으로 보낼 때"],
          ["EmptyState", "목록이 비었을 때 — 화면 자리에 남는 안내"],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[
          ["상자 바탕", <ToastColor key="a" name="toast-strong-background" token="cool-gray-900" />],
          ["문구", <Dot key="b" token="toast-default-text" withName />],
          ["되돌리기 글자", <ToastColor key="c" name="toast-action-text" token="blue-300" />],
          ["되돌리기 누름", <ToastColor key="d" name="toast-action-pressed-bg" token="surface-on-dark-pressed-bg" />],
          ["완료 아이콘", <ToastColor key="e" name="toast-icon-success" token="blue-300" />],
          ["안내 아이콘", <ToastColor key="f" name="toast-icon-info" token="icon-subtle" />],
          ["주의 아이콘", <ToastColor key="g" name="toast-icon-warning" token="toast-icon-warning" raw="#ffc233" />],
          ["실패 아이콘", <ToastColor key="h" name="toast-icon-error" token="error" />],
          ["기호", <ToastColor key="i" name="toast-icon-mark" token="icon-primary" />],
        ]}
      />
      <P>
        문구 색 말고 8개는 Figma 토큰이 오기 전 임시로 <Code>globals.css</Code>에 둔 이름이다. 오른쪽이 실제로
        가리키는 토큰이고, 주의 아이콘만 토큰 없이 <Code>#ffc233</Code>를 그대로 쓴다.
      </P>

      <H doc={D} id="oss">오스에서</H>
      <Sub>웹뷰를 건너가는 토스트</Sub>
      <P>
        앱에서 글 상세는 목록과 다른 웹뷰다. 상세에서 신고하고 바로 닫으면 토스트도 같이 사라진다. 그래서
        문구만 남기고(<Code>enqueuePendingToast</Code>, 4곳) 다음에 앞으로 오는 화면이 대신 띄운다(
        <Code>usePendingToast</Code>, 3곳).
      </P>
      <Sub>바닥 높이는 화면이 정한다</Sub>
      <DocTable
        cols="220px minmax(0,1fr)"
        head={["화면", "바닥에서"]}
        rows={[
          ["기본", "16"],
          ["댓글 입력 바가 있는 상세", "85"],
          ["아래 고정 바", "87"],
          ["아래 고정 바 + 안내 글", "113"],
        ]}
      />
      <P>
        화면 맨 바깥에 <Code>toast-inset-*</Code> 클래스를 달면 <Code>--toast-bottom-inset</Code>이
        바뀐다. 토스트는 시트·대화상자(z-50)보다 위(z-[60])다.
      </P>

      <Fold title="예전 /ds의 Toast 설명">
        <p className="pt-2 text-body-s text-text-secondary">
          useToast().show(문구, {"{ tone, action }"}) · 아래로 밀면 닫힘
        </p>
      </Fold>
    </DocPage>
  );
}

/** 임시 토스트 색 — 이름(globals.css) 옆에 실제로 가리키는 토큰의 색 점. */
function ToastColor({ name, token, raw }: { name: string; token: string; raw?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-mono text-label-m text-text-secondary">{name} →</span>
      <Dot token={token} raw={raw} withName />
    </span>
  );
}
