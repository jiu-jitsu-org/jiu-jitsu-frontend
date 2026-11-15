import {
  componentTokens,
  primitiveTokens,
  semanticTokens,
  type TokenEntry,
} from "@/app/styles/tokens/manifest";
import { Button } from "@/shared/ui/button";
import { ChevronDownIcon } from "@/shared/ui/icons";

import {
  Code,
  DocPage,
  DocTable,
  Dot,
  H,
  P,
  Pair,
  Sub,
} from "../doc-kit";

const D = "color";

const ALL = [...primitiveTokens, ...semanticTokens, ...componentTokens];

/** 부품 토큰에서 원시 색까지 따라 내려간 이름들. */
function chainOf(name: string): string[] {
  const chain = [name];
  let current = ALL.find((token) => token.name === name);
  while (current?.alias) {
    chain.push(current.alias);
    current = ALL.find((token) => token.name === current?.alias);
  }
  return chain;
}

/** 세 단이 한 줄로 이어지는 예 — 버튼·글자·빈 화면처럼 자주 보는 것. */
const CHAIN_SAMPLES = [
  "button-filled-default-bg",
  "empty-state-default-title-text",
  "divider-bg",
];

/** 이름 끝의 단계(50·500p·true-white…)를 떼어 색 계열로 묶는다. */
function primitiveFamily(name: string): string {
  return name.replace(/-(true-)?[a-z0-9]+$/, "");
}

/** 첫 마디(text·surface·button…)로 묶는다. 한 개뿐인 묶음은 "기타"로 모은다. */
function groupByPrefix(tokens: TokenEntry[]): [string, TokenEntry[]][] {
  const groups = new Map<string, TokenEntry[]>();
  for (const token of tokens) {
    const key = token.name.split("-")[0];
    groups.set(key, [...(groups.get(key) ?? []), token]);
  }
  const etc: TokenEntry[] = [];
  const result: [string, TokenEntry[]][] = [];
  for (const [key, list] of groups) {
    if (list.length === 1) etc.push(...list);
    else result.push([key, list]);
  }
  if (etc.length > 0) result.push(["기타", etc]);
  return result;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups];
}

/** 의미 토큰의 역할 — 첫 마디마다 무엇에 칠하는지. */
const ROLES: { prefix: string; role: string }[] = [
  { prefix: "primary", role: "오스 파랑 — 주 행동·켜짐·링크" },
  { prefix: "text", role: "글자색 — primary 본문 · secondary 보조 · tertiary 시간·개수" },
  { prefix: "icon", role: "아이콘 색 — 글자색과 같은 단계 + 불꽃 같은 고유 색" },
  { prefix: "surface", role: "면 — 화면 바탕 · 카드 · 입력칸 · 눌림 면" },
  { prefix: "border", role: "테두리 — 입력칸과 고른 것 하나에만" },
  { prefix: "overlay", role: "사진·어두운 막 위에 얹는 것" },
  { prefix: "interactive", role: "투표처럼 누르는 막대의 색" },
];

export function ColorDoc() {
  return (
    <DocPage
      id={D}
      meta={[
        { label: "기본 팔레트", value: primitiveTokens.length },
        { label: "의미", value: semanticTokens.length },
        { label: "부품", value: componentTokens.length },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        색은 세 단으로 이어진다. 1단 기본 팔레트(파랑 500 같은 원래 색) → 2단 의미(글자 · 면 · 주 색)
        → 3단 부품(버튼 바탕 · 빈 화면 제목). 화면 코드는 2단·3단만 쓰고, 1단은 직접 쓰지 않는다.
      </P>
      <P>
        원본은 Figma 변수를 내보낸 <Code>design-tokens/*.tokens.json</Code>이고{" "}
        <Code>npm run tokens</Code>가 CSS와 이 페이지가 읽는 목록을 만든다 — 아래 색은 모두 그
        목록에서 그린다.
      </P>
      <div className="mt-4 flex flex-col gap-2">
        {CHAIN_SAMPLES.map((name) => {
          const chain = chainOf(name).reverse();
          return (
            <div
              key={name}
              className="flex flex-wrap items-center gap-2 rounded-15 bg-surface-field-subtle px-4 py-3"
            >
              {chain.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  {index > 0 ? (
                    <ChevronDownIcon size={16} className="-rotate-90 text-icon-tertiary" />
                  ) : null}
                  <Dot token={step} withName />
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <H doc={D} id="primitive">1단 · 기본 팔레트</H>
      <P>화면 코드에서 직접 쓰지 않는다. 아래 의미·부품 토큰이 이 색을 가리킨다.</P>
      <div className="mt-4 flex flex-col gap-5">
        {groupBy(primitiveTokens, (t) => primitiveFamily(t.name)).map(([family, list]) => (
          <div key={family}>
            <p className="text-label-m text-text-secondary">{family}</p>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {list.map((token) => (
                <PrimitiveSwatch key={token.name} token={token} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <H doc={D} id="semantic">2단 · 의미</H>
      <P>
        클래스는 <Code>bg-이름</Code> · <Code>text-이름</Code> · <Code>border-이름</Code>. 새 화면은
        이 토큰부터 쓴다.
      </P>
      <div className="mt-4 grid gap-x-6 gap-y-6 md:grid-cols-2">
        {groupByPrefix(semanticTokens).map(([group, list]) => (
          <div key={group}>
            <p className="text-label-m text-text-secondary">{group}</p>
            <div className="mt-2">
              <TokenList tokens={list} />
            </div>
          </div>
        ))}
      </div>

      <H doc={D} id="component">3단 · 부품</H>
      <P>Figma 부품별 색. 눌러서 펼친다 — {componentTokens.length}개.</P>
      <div className="mt-3 flex flex-col gap-1">
        {groupByPrefix(componentTokens).map(([group, list]) => (
          <details key={group} className="group rounded-15 open:bg-surface-field-subtle">
            <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-15 px-3 text-body-m text-text-primary active:bg-surface-container-pressed [&::-webkit-details-marker]:hidden">
              <span>{group}</span>
              <span className="flex items-center gap-2 text-label-m text-text-tertiary">
                {list.length}
                <ChevronDownIcon
                  size={20}
                  className="transition-transform duration-200 group-open:rotate-180"
                />
              </span>
            </summary>
            <div className="px-3 pb-3">
              <TokenList tokens={list} />
            </div>
          </details>
        ))}
      </div>

      <H doc={D} id="roles">어디에 쓰나</H>
      <DocTable
        cols="120px minmax(0,1fr) 80px"
        head={["의미 묶음", "역할", "개수"]}
        rows={ROLES.map((role) => [
          <span key="p" className="font-mono text-label-m">
            {role.prefix}
          </span>,
          role.role,
          semanticTokens.filter((t) => t.name.split("-")[0] === role.prefix).length,
        ])}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <Sub>부품 토큰이 있으면 부품 토큰</Sub>
      <Pair
        good={<Button variant="filled">확인</Button>}
        goodNote={
          <>
            버튼은 <Code>bg-button-filled-default-bg</Code> — Figma에서 버튼 색만 바꿔도 따라온다.
          </>
        }
        bad={
          <Button variant="filled" className="bg-primary">
            확인
          </Button>
        }
        badNote={
          <>
            지금은 같은 파랑이라도 <Code>bg-primary</Code>를 쓰면 버튼 색을 바꿀 때 이 자리만 남는다.
          </>
        }
      />
      <Sub>값을 옮겨 적지 않는다</Sub>
      <Pair
        good={<span className="text-body-m text-text-secondary">3분 전</span>}
        goodNote={
          <>
            <Code>text-text-secondary</Code> — 토큰 이름으로.
          </>
        }
        bad={<span className="font-mono text-body-s text-text-tertiary">text-[#70737c]</span>}
        badNote="hex를 적으면 색을 고칠 때 찾을 수 없다(레포 규칙으로도 막는다)."
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["무엇", "어디"]}
        rows={[
          ["원본", <Code key="a">oss-frontend/design-tokens/*.tokens.json</Code>],
          ["만드는 명령", <Code key="b">npm run tokens</Code>],
          [
            "만들어지는 것(손대지 않음)",
            <Code key="c">src/app/styles/tokens/*.css · manifest.ts</Code>,
          ],
          ["라이트 · 다크", "라이트 전용(다크 토큰 없음)"],
        ]}
      />
    </DocPage>
  );
}

function PrimitiveSwatch({ token }: { token: TokenEntry }) {
  return (
    <div className="min-w-0">
      <div
        // 흰색 계열도 칸이 보이게 아주 옅은 안쪽 그림자를 깐다(테두리 대신).
        className="aspect-square rounded-15 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
        style={{ background: `var(--${token.name})` }}
      />
      <p className="mt-1 truncate text-label-m text-text-primary">
        {token.name.replace(`${primitiveFamily(token.name)}-`, "")}
      </p>
      <p className="truncate font-mono text-label-m text-text-tertiary">{token.hex}</p>
    </div>
  );
}

function TokenList({ tokens }: { tokens: TokenEntry[] }) {
  return (
    <ul className="flex flex-col">
      {tokens.map((token) => (
        <li key={token.name} className="flex items-center gap-3 py-1.5">
          <span
            className="size-8 shrink-0 rounded-10 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
            style={{ background: `var(--${token.name})` }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-label-m text-text-primary">
              {token.name}
            </span>
            <span className="block truncate font-mono text-label-m text-text-tertiary">
              {token.alias ? `→ ${token.alias} · ` : ""}
              {token.hex}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
