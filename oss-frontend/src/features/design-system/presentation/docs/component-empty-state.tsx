"use client";


import { EmptyState } from "@/shared/ui/empty-state";

import { EmptyStateDemo } from "../design-system-demos";
import {
  Anatomy,
  Code,
  DocPage,
  DocTable,
  Dot,
  Fold,
  H,
  MarkerLegend,
  P,
  Pair,
  Stage,
  Sub,
  USAGE_DATE,
} from "../doc-kit";

const D = "empty-state";

/** 견본 버튼은 눌러도 아무 일도 하지 않는다. */
const noop = () => {};

export function EmptyStateDoc() {
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `9개 파일 · 11번 (${USAGE_DATE})` },
        { label: "설명 붙임", value: "6번" },
        { label: "버튼 붙임", value: "5번" },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        목록이 비었을 때 그 자리에 남기는 안내 — 제목 + (설명) + (버튼). 메인 피드 · 내 커뮤니티 활동 ·
        차단한 회원 · 대회 목록이 같은 모양을 쓴다. 상태가 없어 서버·클라이언트 어디서든 그린다.
      </P>
      <Stage tone="plain">
        <EmptyStateDemo />
      </Stage>

      <H doc={D} id="anatomy">해부도</H>
      <Stage tone="plain">
        <Anatomy
          marks={[
            { top: "10%", left: "0%" },
            { top: "38%", left: "0%" },
            { top: "78%", left: "0%" },
          ]}
        >
          <EmptyState
            title="예정된 대회가 없어요"
            description="새 대회가 올라오면 여기에 보여 드릴게요"
            action={{ label: "다시 시도", onClick: noop }}
            className="motion-safe:animate-none"
          />
        </Anatomy>
      </Stage>
      <MarkerLegend
        items={[
          { name: "제목", note: "Body M · 무엇이 비었는지" },
          { name: "설명(선택)", note: "Body S · 제목과 4 띄움 · 무엇을 하면 채워지는지" },
          { name: "버튼(선택)", note: "Button neutral m · 설명과 13 띄움" },
        ]}
      />

      <H doc={D} id="variants">변형</H>
      <P>넘기는 것에 따라 세 가지 꼴. 숫자는 {USAGE_DATE} 쓰는 곳.</P>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "제목만", node: <EmptyState title="로그인 후 이용할 수 있어요" /> },
          {
            label: "제목 + 설명 · 6번",
            node: (
              <EmptyState
                title="차단한 회원이 없어요"
                description="차단하면 그 회원의 글과 댓글이 보이지 않아요."
              />
            ),
          },
          { label: "제목 + 버튼 · 5번", node: <EmptyStateDemo /> },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-2">
            <div className="flex h-44 items-center justify-center rounded-20 bg-surface-container">
              {item.node}
            </div>
            <p className="text-label-m text-text-tertiary">{item.label}</p>
          </div>
        ))}
      </div>
      <P>
        견본은 실제 화면처럼 흰 바탕에 둔다 — 버튼이 회색 면이라 회색 판 위에서는 묻힌다.
      </P>

      <H doc={D} id="states">상태 · 움직임</H>
      <P>
        나타날 때 8 아래에서 280ms로 올라오며 자리 잡는다(<Code>animate-rise-in</Code>) — 목록이
        비었다는 걸 &lsquo;자리 잡는&rsquo; 움직임으로 알린다. 세로 위치는 화면마다 달라(피드는 화면
        35%, 활동 화면은 탭 아래 96) 호출부가 <Code>className</Code>으로 정한다.
      </P>

      <H doc={D} id="guidelines">가이드라인</H>
      <Sub>무엇을 하면 채워지는지</Sub>
      <Pair
        tone="plain"
        good={
          <EmptyState title="저장한 글이 없어요" description="글 아래 저장 버튼을 누르면 여기에 모여요." />
        }
        goodNote="비었다는 사실 + 어떻게 하면 채워지는지(내 활동 · 저장)."
        bad={<EmptyState title="데이터가 없습니다" />}
        badNote="무엇이 없는지, 어떻게 하면 되는지 모른다."
      />
      <Sub>버튼은 이 자리를 다시 채우는 동작 하나</Sub>
      <Pair
        tone="plain"
        good={
          <EmptyState
            title="조건에 맞는 대회가 없어요"
            action={{ label: "필터 지우기", onClick: noop }}
          />
        }
        goodNote="대회 목록 — 비게 만든 원인(필터)을 바로 풀어 같은 목록을 다시 채운다."
        bad={
          <EmptyState
            title="조건에 맞는 대회가 없어요. 필터를 지우거나 검색어를 바꾸거나 다음 달을 보세요"
          />
        }
        badNote="할 일을 제목에 몰아 쓰면 길어지고, 정작 누를 곳이 없다."
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["EmptyState", "불러오기는 끝났는데 보여 줄 것이 없을 때"],
          ["Skeleton · Spinner", "아직 불러오는 중일 때"],
          ["Toast", "방금 한 동작의 결과를 잠깐 알릴 때"],
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
          ["버튼 글자", <Dot key="d" token="button-neutral-default-text" withName />],
        ]}
      />

      <H doc={D} id="oss">오스에서</H>
      <P>
        대회 목록은 비운 원인을 나눠 말한다 — 원래 대회가 없으면 &lsquo;예정된 대회가 없어요&rsquo;, 필터로
        다 걸러지면 &lsquo;조건에 맞는 대회가 없어요&rsquo; + 필터 지우기, 이름 검색만으로 비면 &lsquo;이름이
        맞는 대회가 없어요&rsquo; + 검색어 지우기. 문구 끝에 &lsquo;오스!&rsquo;를 붙여 매트 위 말투를 쓰는
        곳도 있다(내 활동 · 쓴 글).
      </P>

      <Fold title="예전 /ds의 EmptyState 설명">
        <p className="pt-2 text-body-s text-text-secondary">제목 + 설명 + 버튼(선택)</p>
      </Fold>
    </DocPage>
  );
}
