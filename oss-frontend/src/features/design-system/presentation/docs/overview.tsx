import {
  componentTokens,
  primitiveTokens,
  semanticTokens,
} from "@/app/styles/tokens/manifest";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { IconButton } from "@/shared/ui/icon-button";
import { BellIcon, HeartIcon } from "@/shared/ui/icons";

import { Code, DocPage, H, P, USAGE_DATE } from "../doc-kit";
import { DOC_GROUP_LABEL, DOC_LIST, type DocGroup } from "../doc-kit/doc-registry";

const D = "overview";

/** 묶음 카드 머리에 얹는 작은 실물 — 그 묶음이 무엇인지 한눈에. */
function GroupPreview({ group }: { group: DocGroup }) {
  if (group === "foundation") {
    return (
      <div className="flex items-center gap-1.5">
        {["primary", "text-primary", "surface-secondary", "error"].map((token) => (
          <span
            key={token}
            className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
            style={{ background: `var(--${token})` }}
          />
        ))}
        {" "}
        <span className="ml-1 text-title-2 text-text-primary">가</span>
      </div>
    );
  }
  if (group === "component") {
    return (
      <div className="pointer-events-none flex items-center gap-2" aria-hidden>
        <Button size="s">확인</Button>
        <Chip selected tone="primary">
          노기
        </Chip>
        <IconButton aria-label="알림" size="s">
          <BellIcon />
        </IconButton>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-text-error" aria-hidden>
      <HeartIcon size={24} />
      <span className="text-body-s text-text-secondary">띠 · 대회 · 피드</span>
    </div>
  );
}

export function OverviewDoc() {
  const groups: DocGroup[] = ["foundation", "component", "pattern"];
  return (
    <DocPage
      id={D}
      meta={[
        { label: "문서", value: DOC_LIST.length - 1 },
        { label: "색 토큰", value: primitiveTokens.length + semanticTokens.length + componentTokens.length },
        { label: "사용 수", value: USAGE_DATE },
      ]}
    >
      <H doc={D} id="map">전체 지도</H>
      <P>
        왼쪽 목록에서 문서를 고른다. 주소는 <Code>/ds#문서</Code>(예: <Code>/ds#button</Code>)라 링크로
        바로 보낼 수 있다. 모든 견본은 앱의 실제 부품을 그대로 가져다 그린다.
      </P>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {groups.map((group) => {
          const docs = DOC_LIST.filter((doc) => doc.group === group);
          return (
            <section key={group} className="flex flex-col rounded-20 bg-surface-field-subtle p-5">
              <div className="flex h-10 items-center">
                <GroupPreview group={group} />
              </div>
              <h3 className="mt-4 text-title-3 text-text-primary">
                {DOC_GROUP_LABEL[group]}
                {" "}
                <span className="ml-1 text-label-m text-text-tertiary">{docs.length}</span>
              </h3>
              <ul className="mt-2 flex flex-col">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={`#${doc.id}`}
                      className="-mx-2 flex flex-col rounded-10 px-2 py-1.5 active:bg-surface-container-pressed"
                    >
                      <span className="text-body-s text-text-primary">{doc.title}</span>
                      <span className="text-label-m text-text-tertiary">{doc.summary}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <H doc={D} id="rules">이 페이지의 약속</H>
      <ul className="mt-3 flex flex-col gap-2 text-body-s text-text-secondary">
        <li>· 값은 지어내지 않는다 — 크기는 그려진 부품에서 재고, 색은 토큰 변수를 그대로 칠한다.</li>
        <li>· 사용 수는 코드에서 센 스냅샷이다({USAGE_DATE}). 디자인 시스템 페이지 자신은 빼고 셌다.</li>
        <li>· 라이트 전용이다(다크 토큰 없음).</li>
        <li>
          · 로컬 · 개발 서버에서만 열린다(<Code>is-design-system-page-enabled.ts</Code>) — 운영 사용자에게는 404.
        </li>
      </ul>
    </DocPage>
  );
}
