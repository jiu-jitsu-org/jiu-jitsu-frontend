import { Button, buttonVariants } from "@/shared/ui/button";

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

const D = "button";

/** button.tsx의 cva 그대로 — 색마다 쓰는 토큰. */
const VARIANTS = [
  {
    name: "filled",
    label: "확인",
    use: "대화상자의 주 행동, 화면 안 주 버튼",
    count: "4",
    bg: "button-filled-default-bg",
    text: "button-filled-default-text",
    pressed: "button-filled-pressed-bg",
    disabled: "button-filled-disabled-bg",
  },
  {
    name: "neutral",
    label: "다시 시도",
    use: "취소·다시 시도처럼 덜 중요한 쪽",
    count: "9",
    bg: "button-neutral-default-bg",
    text: "button-neutral-default-text",
    pressed: "button-neutral-pressed-bg",
    disabled: "button-neutral-disabled-bg",
  },
  {
    name: "tint",
    label: "앱에서 보기",
    use: "배너 안 작은 권유",
    count: "1",
    bg: "button-tint-default-bg",
    text: "button-tint-default-text",
    pressed: "button-tint-pressed-bg",
    disabled: "button-tint-disabled-bg",
  },
  {
    name: "text",
    label: "더 보기",
    use: "면 없는 글자 버튼",
    count: "0",
    bg: "button-text-default-bg",
    text: "button-text-default-text",
    pressed: "button-text-pressed-bg",
    disabled: null,
  },
  {
    name: "cta",
    label: "저장",
    use: "시트 하단의 주 행동(저장·완료)",
    count: "5",
    bg: "cta-primary-bg",
    text: "cta-primary-text",
    pressed: "cta-primary-pressed-bg",
    disabled: "cta-primary-disabled-bg",
  },
  {
    name: "cta-ghost",
    label: "나중에",
    use: "cta 밑 보조 행동",
    count: "2",
    bg: "cta-transparent-text-bg",
    text: "cta-transparent-text-text",
    pressed: "cta-transparent-text-pressed-bg",
    disabled: null,
  },
  {
    name: "destructive",
    label: "삭제",
    use: "삭제·차단처럼 되돌리기 어려운 확인",
    count: "조건부 1",
    bg: "confirm-dialog-destructive-button-bg",
    text: "button-filled-default-text",
    pressed: null,
    disabled: null,
  },
] as const;

export function ButtonDoc() {
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `17개 파일 · 22번 (${USAGE_DATE})` },
        { label: "색", value: 7 },
        { label: "크기", value: 3 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        글자가 든 버튼. <Code>@/shared/ui</Code>의 <Code>Button</Code>을 쓰고, 링크(
        <Code>&lt;a&gt;</Code>)를 버튼 모양으로 그릴 때는 <Code>buttonVariants</Code>를 쓴다.
        기본값은 <Code>filled</Code> · <Code>m</Code>.
      </P>
      <Stage>
        <Button>확인</Button>
      </Stage>

      <H doc={D} id="anatomy">해부도</H>
      <Stage>
        <Anatomy
          marks={[
            { top: "50%", left: "0%" },
            { top: "100%", left: "50%" },
            { top: "0%", left: "100%" },
          ]}
        >
          <Button variant="cta" size="l" className="w-64">
            저장
          </Button>
        </Anatomy>
      </Stage>
      <MarkerLegend
        items={[
          { name: "바탕 면", note: "variant가 정하는 색. 테두리는 없다." },
          { name: "글자", note: "가운데 한 줄. 크기마다 Button S · M 글자." },
          { name: "모서리", note: "s · m 10, l 15" },
        ]}
      />

      <H doc={D} id="variants">변형</H>
      <P>색 이름은 Figma 버튼 토큰 이름을 그대로 쓴다. 숫자는 그 색을 쓰는 곳({USAGE_DATE}).</P>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {VARIANTS.map((variant) => (
          <div
            key={variant.name}
            className="flex flex-col gap-3 rounded-20 bg-surface-field-subtle p-4"
          >
            <div className="flex h-14 items-center justify-center">
              <Button variant={variant.name}>{variant.label}</Button>
            </div>
            <div>
              <p className="font-mono text-label-m text-text-primary">
                {variant.name}
                <span className="ml-2 text-text-tertiary">{variant.count}번</span>
              </p>
              <p className="text-label-m text-text-tertiary">{variant.use}</p>
            </div>
          </div>
        ))}
      </div>

      <H doc={D} id="sizes">크기</H>
      <P>아래 숫자는 화면에 그려진 버튼에서 바로 잰 값이다(px).</P>
      <Stage className="gap-10">
        <Measure label="s · 6번">
          <Button size="s">작은 버튼</Button>
        </Measure>
        <Measure label="m · 5번">
          <Button size="m">다시 시도</Button>
        </Measure>
        <Measure label="l · 11번" pick={["높이", "모서리", "글자"]}>
          <Button size="l" className="w-40">
            확인
          </Button>
        </Measure>
      </Stage>
      <P>
        l은 좌우 여백이 없다 — 대화상자·시트 아래에서 <Code>flex-1</Code>·<Code>w-full</Code>로
        폭을 채운다.
      </P>

      <H doc={D} id="states">상태</H>
      <P>
        누르는 동안: s · m은 눌림 색이 120ms로 깔리고, l은 눌림 색 + 0.96으로 눌렸다가 스프링으로
        돌아온다. 비활성은 눌러도 변하지 않는다. 직접 눌러 본다.
      </P>
      <DocTable
        cols="120px repeat(3, minmax(0, 1fr))"
        head={["", "기본", "누르는 동안(고정 표시)", "비활성"]}
        rows={VARIANTS.filter((v) => v.pressed && v.disabled).map((variant) => [
          <span key="n" className="font-mono text-label-m">
            {variant.name}
          </span>,
          <Button key="d" variant={variant.name} size="s">
            {variant.label}
          </Button>,
          <Button
            key="p"
            variant={variant.name}
            size="s"
            // 누르는 순간의 색을 멈춰 보여 준다 — 같은 토큰 변수를 그대로 칠한다.
            style={{ background: `var(--${variant.pressed})` }}
          >
            {variant.label}
          </Button>,
          <Button key="x" variant={variant.name} size="s" disabled>
            {variant.label}
          </Button>,
        ])}
      />
      <P>
        불러오는 중 · 오류 상태는 버튼에 없다 — 결과는 토스트로 알리고, 진행 중엔 버튼을 비활성으로
        둔다.
      </P>

      <H doc={D} id="guidelines">가이드라인</H>
      <Sub>한 줄에 주 행동은 하나</Sub>
      <Pair
        good={
          <div className="flex w-full max-w-72 gap-2">
            <Button variant="neutral" size="l" className="flex-1">
              취소
            </Button>
            <Button variant="filled" size="l" className="flex-1">
              확인
            </Button>
          </div>
        }
        goodNote="덜 중요한 쪽은 neutral, 주 행동은 오른쪽 filled."
        bad={
          <div className="flex w-full max-w-72 gap-2">
            <Button variant="filled" size="l" className="flex-1">
              취소
            </Button>
            <Button variant="filled" size="l" className="flex-1">
              확인
            </Button>
          </div>
        }
        badNote="둘 다 파랑이면 어느 쪽이 앞으로 가는 버튼인지 읽히지 않는다."
      />
      <Sub>되돌릴 수 없으면 destructive</Sub>
      <Pair
        good={
          <div className="flex w-full max-w-72 gap-2">
            <Button variant="neutral" size="l" className="flex-1">
              취소
            </Button>
            <Button variant="destructive" size="l" className="flex-1">
              삭제
            </Button>
          </div>
        }
        goodNote="삭제·차단 확인은 빨강 — 색만 보고도 멈춰 생각하게 한다."
        bad={
          <div className="flex w-full max-w-72 gap-2">
            <Button variant="neutral" size="l" className="flex-1">
              취소
            </Button>
            <Button variant="filled" size="l" className="flex-1">
              삭제
            </Button>
          </div>
        }
        badNote="평소 확인과 같은 파랑이면 습관처럼 눌러 버린다."
      />
      <Sub>시트 하단은 cta 하나 + cta-ghost</Sub>
      <Pair
        good={
          <div className="flex w-full max-w-72 flex-col gap-2">
            <Button variant="cta" size="l" className="w-full">
              저장
            </Button>
            <Button variant="cta-ghost" size="l" className="w-full">
              나중에
            </Button>
          </div>
        }
        goodNote="보조 행동은 면 없이 — 색 면은 주 행동 하나만."
        bad={
          <div className="flex w-full max-w-72 flex-col gap-2">
            <Button variant="cta" size="l" className="w-full">
              저장
            </Button>
            <Button variant="cta" size="l" className="w-full">
              나중에
            </Button>
          </div>
        }
        badNote="꽉 찬 버튼 두 개를 쌓으면 무게가 같아진다."
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="140px minmax(0,1fr) minmax(0,1fr)"
        head={["부품", "언제", "헷갈리는 점"]}
        rows={[
          ["Button", "글자로 동작을 말할 때", "—"],
          [
            "IconButton",
            "앱바 뒤로·⋮·닫기처럼 아이콘만으로 뜻이 통할 때",
            "아이콘 + 글자를 같이 쓰려면 Button에 아이콘을 넣는다",
          ],
          [
            "Chip",
            "골라서 켜고 끄는 값(필터·카테고리)",
            "누르면 일이 끝나는 동작이면 Button",
          ],
          [
            <Code key="a">buttonVariants</Code>,
            "다른 주소로 가는 링크를 버튼 모양으로",
            "<a>는 disabled가 없어 눌림만 보인다",
          ],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <P>색 점은 토큰 변수를 그대로 칠한 실제 색이다.</P>
      <DocTable
        cols="104px repeat(4, minmax(0, 1fr))"
        head={["variant", "바탕", "글자", "누름", "비활성 바탕"]}
        rows={VARIANTS.map((variant) => [
          <span key="n" className="font-mono text-label-m">
            {variant.name}
          </span>,
          <Dot key="b" token={variant.bg} withName />,
          <Dot key="t" token={variant.text} withName />,
          variant.pressed ? (
            <Dot key="p" token={variant.pressed} withName />
          ) : (
            <span key="p" className="text-label-m text-text-tertiary">
              밝기 90%
            </span>
          ),
          variant.disabled ? (
            <Dot key="x" token={variant.disabled} withName />
          ) : (
            <span key="x" className="text-label-m text-text-tertiary">
              —
            </span>
          ),
        ])}
      />
      <DocTable
        cols="80px repeat(4, minmax(0, 1fr))"
        head={["크기", "높이", "모서리", "좌우", "글자"]}
        rows={[
          ["s", "32 (h-8)", "10", "12", "text-button-s"],
          ["m", "38", "10", "16", "text-button-m"],
          ["l", "51", "15", "0 (호출부가 폭)", "text-button-m"],
        ]}
      />

      <H doc={D} id="oss">오스에서</H>
      <Sub>앱 안 웹뷰라서</Sub>
      <P>
        큰 버튼(l)만 눌렀다 출렁이는 움직임(<Code>PRESS_BOUNCE</Code>)이 붙는다 — 시트·대화상자 아래
        버튼은 앱 네이티브 버튼과 나란히 보이는 자리라 손맛을 맞췄다. 작은 버튼은 색만 바뀐다.
      </P>
      <Sub>눌림 색 토큰이 없는 destructive</Sub>
      <P>
        Figma에 삭제 버튼의 눌림 색이 없어 밝기만 90%로 낮춘다. 토큰이 생기면 바꾼다.
      </P>
      <Sub>쓰지 않는 색</Sub>
      <P>
        <Code>text</Code>는 {USAGE_DATE} 쓰는 곳이 없다. 목록 끝 &lsquo;더 보기&rsquo;처럼 면 없는 글자
        버튼이 필요할 때 먼저 이것을 쓴다.
      </P>

      <Fold title="예전 /ds의 Button 견본 — 크기 s 32 · m 38 · l 51">
        <div className="flex flex-col gap-4 pt-2">
          {(["filled", "neutral", "tint", "text"] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 font-mono text-label-m text-text-tertiary">
                {variant}
              </span>
              <Button variant={variant} size="s">
                작은 버튼
              </Button>
              <Button variant={variant} size="m">
                다시 시도
              </Button>
              <Button variant={variant} size="m" disabled>
                비활성
              </Button>
            </div>
          ))}
          <div className="flex max-w-sm flex-col gap-2">
            <Button variant="cta" size="l" className="w-full" disabled>
              저장
            </Button>
            <a href="#button" className={buttonVariants({ variant: "tint", size: "s" })}>
              buttonVariants를 쓴 링크
            </a>
          </div>
        </div>
      </Fold>
    </DocPage>
  );
}
