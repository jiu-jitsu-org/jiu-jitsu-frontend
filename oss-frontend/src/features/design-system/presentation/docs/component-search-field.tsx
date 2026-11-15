import { SearchFieldDemo, SearchFieldSample } from "../design-system-demos";
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

const D = "search-field";

/** 입력 중 모양을 멈춰 보여 줄 때 거는 클래스 — search-field.tsx의 focus-within과 같은 토큰. */
const FOCUSED_LOOK =
  "bg-textfield-focused-bg ring-2 ring-textfield-focused-border ring-inset";

export function SearchFieldDoc() {
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `2개 파일 · 2번 (${USAGE_DATE})` },
        { label: "상태", value: 3 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        돋보기 + 입력 + 지우기(×). 오스 웹의 공용 입력칸은 아직 이것 하나다 — 글쓰기의 제목·본문·댓글
        입력은 화면마다 직접 그린다. 대회 이름 검색(#345)이 처음 썼다. 직접 입력해 본다.
      </P>
      <Stage>
        <div className="w-full max-w-sm">
          <SearchFieldDemo />
        </div>
      </Stage>

      <H doc={D} id="anatomy">해부도</H>
      <Stage>
        <Anatomy
          marks={[
            { top: "0%", left: "60%" },
            { top: "100%", left: "6%" },
            { top: "100%", left: "40%" },
            { top: "50%", left: "100%" },
          ]}
        >
          <SearchFieldSample initial="고수부지 오픈" className="w-80" />
        </Anatomy>
      </Stage>
      <MarkerLegend
        items={[
          { name: "칸(면)", note: "높이 40 · 모서리 10 · 평소엔 회색 면만, 테두리 없음" },
          { name: "돋보기", note: "18 · icon-secondary" },
          { name: "입력 글자", note: "16px — 이보다 작으면 iOS가 입력할 때 화면을 확대한다" },
          { name: "지우기(×)", note: "글자가 있을 때만. 보이는 원 20, 누를 자리 32" },
        ]}
      />

      <H doc={D} id="sizes">크기</H>
      <P>잰 값(px). 폭은 호출부가 정한다.</P>
      <Stage>
        <Measure label="한 가지 크기" pick={["높이", "모서리"]}>
          <SearchFieldSample className="w-72" />
        </Measure>
      </Stage>

      <H doc={D} id="states">상태</H>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "비어 있음", node: <SearchFieldSample className="w-full" /> },
          {
            label: "입력 중(고정 표시)",
            node: <SearchFieldSample className={`w-full ${FOCUSED_LOOK}`} />,
          },
          { label: "글자 있음", node: <SearchFieldSample initial="서울" className="w-full" /> },
        ].map((state) => (
          <div key={state.label} className="flex flex-col gap-3 rounded-20 bg-surface-field-subtle p-4">
            {state.node}
            <p className="text-label-m text-text-tertiary">{state.label}</p>
          </div>
        ))}
      </div>
      <P>
        입력 중엔 면이 한 단계 밝아지고 안쪽으로 파랑 테두리 2가 그려진다(크기는 그대로). 비활성 · 오류
        상태는 아직 없다. 엔터는 키보드만 내리고, Esc는 <Code>onEscape</Code>(보통 닫기)를 부른다.
      </P>

      <H doc={D} id="guidelines">가이드라인</H>
      <Sub>무엇으로 찾는지 안내 문구에</Sub>
      <Pair
        good={<SearchFieldSample placeholder="대회 이름으로 찾기" className="w-64" />}
        goodNote="찾는 기준(대회 이름)을 문구로 말한다."
        bad={<SearchFieldSample placeholder="검색" className="w-64" />}
        badNote="'검색'만 쓰면 장소·날짜로도 찾을 수 있는지 모른다."
      />
      <Sub>입력칸은 회색 면 하나</Sub>
      <Pair
        good={<SearchFieldSample className="w-64" />}
        goodNote="평소엔 면만 — 테두리는 입력 중에만 파랑으로."
        bad={<SearchFieldSample className="w-64 ring-1 ring-border-default ring-inset" />}
        badNote="평소에도 테두리를 두르면 면과 선이 겹쳐 무거워진다."
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["SearchField", "목록을 글자로 거를 때"],
          ["Chip", "정해진 값 몇 개 중에 고를 때(지역·접수 중·노기)"],
          [
            "글쓰기 입력(화면 전용)",
            "제목·본문·댓글처럼 길게 쓰는 칸 — 아직 공용 부품이 아니다",
          ],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[
          ["평소 면", <Dot key="a" token="surface-secondary" withName />],
          ["입력 중 면", <Dot key="b" token="textfield-focused-bg" withName />],
          ["입력 중 테두리", <Dot key="c" token="textfield-focused-border" withName />],
          ["안내 문구", <Dot key="d" token="textfield-default-placeholder" withName />],
          ["글자", <Dot key="e" token="text-primary" withName />],
          ["커서", <Dot key="f" token="primary" withName />],
          ["돋보기", <Dot key="g" token="icon-secondary" withName />],
          ["지우기", <Dot key="h" token="icon-disabled" withName />],
        ]}
      />

      <H doc={D} id="oss">오스에서</H>
      <Sub>폰 브라우저 기본 모양을 걷어낸다</Sub>
      <P>
        iOS 검색칸의 안쪽 둥근 회색 면·그림자와 기본 돋보기·×를 모두 없애고 앱 모양만 남긴다. 한글
        조합 중의 엔터·Esc는 조합을 끝내는 데 쓰여 무시한다.
      </P>
      <Sub>공용 입력칸이 더 필요해지면</Sub>
      <P>
        Figma에는 <Code>textfield-*</Code> 토큰(기본 · 입력 중 · 비활성 · 오류 · 글자 수)이 이미 있다.
        글쓰기 입력을 공용으로 묶을 때 이 토큰을 쓴다.
      </P>

      <Fold title="예전 /ds의 SearchField 설명">
        <p className="pt-2 text-body-s text-text-secondary">
          높이 40 · 회색 면 · 입력 중 파랑 테두리 · 글자 16(iOS 확대 막음) · 글자 있으면 지우기
        </p>
      </Fold>
    </DocPage>
  );
}
