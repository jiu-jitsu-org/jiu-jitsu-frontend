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
      <div className="mt-4 flex flex-col gap-3">
        {groupBy(primitiveTokens, (t) => primitiveFamily(t.name)).map(([family, list]) => (
          <PrimitiveRamp key={family} family={family} tokens={list} />
        ))}
      </div>

      <H doc={D} id="semantic">2단 · 의미</H>
      <P>
        클래스는 <Code>bg-이름</Code> · <Code>text-이름</Code> · <Code>border-이름</Code>. 새 화면은
        이 토큰부터 쓴다.
      </P>
      <div className="mt-4 flex flex-col gap-6">
        {groupByPrefix(semanticTokens).map(([group, list]) => (
          <div key={group}>
            <p className="text-label-m text-text-secondary">{group}</p>
            <ul className="mt-2 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4 md:grid-cols-6">
              {list.map((token) => (
                <SemanticSwatch key={token.name} token={token} group={group} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <H doc={D} id="component">3단 · 부품</H>
      <P>
        Figma 부품별 색 {componentTokens.length}개. 부품마다 한 줄, 변형(filled · tint…)끼리 모았다. 점에 손을
        올리면 토큰 이름과 가리키는 색이 보인다.
      </P>
      <div className="mt-4 flex flex-col gap-5">
        {groupByPrefix(componentTokens).map(([group, list]) => (
          <ComponentRow key={group} group={group} tokens={list} />
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

/** 밝은 칸 위에는 어두운 글자, 어두운 칸 위에는 밝은 글자 — 칸 안 단계 숫자가 읽히게. */
function isDarkHex(hex: string): boolean {
  const value = hex.replace("#", "").slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.6;
}

/** 띠 한 칸의 폭 — 가장 긴 계열(cool-gray)에 맞춰 모든 계열의 단계가 같은 폭으로 줄 선다. */
const RAMP_COLUMNS = Math.max(
  ...groupBy(primitiveTokens, (t) => primitiveFamily(t.name)).map(([, list]) => list.length),
);

/**
 * 한 색 계열을 이어 붙인 띠 한 줄 — 칸 안에 단계, hex는 칸에 손을 올리면 보인다.
 * (AI용 복사에는 hex까지 들어가게 화면에 안 보이는 글로 함께 둔다.)
 * 반투명 흰색은 흰 바탕에서 안 보여 짙은 바탕 위에 얹는다.
 */
function PrimitiveRamp({ family, tokens }: { family: string; tokens: TokenEntry[] }) {
  const onDark = family === "opacity-white";
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <p className="w-28 shrink-0 text-label-m text-text-secondary">{family}</p>
      <ul
        className="grid min-w-0 flex-1"
        style={{ gridTemplateColumns: `repeat(${RAMP_COLUMNS}, minmax(0, 1fr))` }}
      >
        {tokens.map((token) => (
          <li
            key={token.name}
            title={`${token.name} · ${token.hex}`}
            className={`flex h-10 min-w-0 items-end overflow-hidden px-0.5 pb-1 text-[10px] leading-none whitespace-nowrap sm:px-1.5 sm:text-[11px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] first:rounded-l-10 last:rounded-r-10 ${
              onDark || isDarkHex(token.hex) ? "text-text-on-dark" : "text-text-secondary"
            }`}
            style={{
              background: `linear-gradient(var(--${token.name}), var(--${token.name})), var(${
                onDark ? "--cool-gray-900" : "--bw-true-white"
              })`,
            }}
          >
            <span className="sm:truncate">{token.name.replace(`${family}-`, "")}</span>
            <span className="sr-only"> {token.hex}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 의미 토큰 한 칸 — 색 면 + 묶음 이름을 뗀 짧은 이름. 가리키는 원래 색은 손을 올리면 보인다. */
function SemanticSwatch({ token, group }: { token: TokenEntry; group: string }) {
  const short = group === "기타" ? token.name : token.name.replace(`${group}-`, "");
  const target = `${token.alias ? `${token.alias} · ` : ""}${token.hex}`;
  return (
    <li className="min-w-0" title={`${token.name} → ${target}`}>
      <div
        className="h-10 rounded-10 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
        style={{ background: `var(--${token.name})` }}
      />
      <p className="mt-1 truncate text-label-m text-text-primary">
        {short === token.name.split("-")[0] ? token.name : short}
      </p>
      <span className="sr-only">
        {token.name} → {target}
      </span>
    </li>
  );
}

/** 부품 하나의 색을 한 줄에 — 둘째 마디(filled · tint · default…)로 작은 무리를 짓는다. */
function ComponentRow({ group, tokens }: { group: string; tokens: TokenEntry[] }) {
  const clusters = groupBy(tokens, (t) =>
    group === "기타" ? t.name.split("-")[0] : t.name.replace(`${group}-`, "").split("-")[0],
  );
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
      <p className="w-28 shrink-0 pt-4 text-body-s text-text-primary">
        {group}
        {" "}
        <span className="ml-1 text-label-m text-text-tertiary">{tokens.length}</span>
      </p>
      <div className="flex min-w-0 flex-1 flex-wrap gap-x-5 gap-y-3">
        {clusters.map(([sub, list]) => (
          <div key={sub} className="min-w-0">
            <p className="text-[11px] leading-4 text-text-tertiary">{sub}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {list.map((token) => {
                const target = `${token.alias ? `${token.alias} · ` : ""}${token.hex}`;
                return (
                  <li
                    key={token.name}
                    title={`${token.name} → ${target}`}
                    className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
                    style={{ background: `var(--${token.name})` }}
                  >
                    <span className="sr-only">
                      {token.name} → {target}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
