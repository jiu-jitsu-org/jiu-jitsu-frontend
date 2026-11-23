"use client";

import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { ChevronDownIcon } from "@/shared/ui/icons";
import { useToast } from "@/shared/ui/toast";

import { docToMarkdown } from "./doc-markdown";

import {
  DOC_GROUP_LABEL,
  DOC_LIST,
  decodeHash,
  docIdFromHash,
  findDoc,
  type DocGroup,
} from "./doc-registry";

const GROUPS: DocGroup[] = ["foundation", "component", "pattern"];

/**
 * /ds 세 칸 — 왼쪽 문서 목록 · 가운데 문서 한 장 · 오른쪽 '이 문서 목차'.
 *
 * 한 주소 안에서 앵커로 문서를 바꾼다(`/ds#button`). 문서는 모두 서버에서 그려 두고
 * 지금 주소의 문서만 보이게 한다. 소제목 앵커(`#button--anatomy`)는 앞 마디로 문서를 고른다.
 * 좁은 화면은 왼쪽 목록이 위쪽 줄의 '문서 목록'으로 접히고, 오른쪽 목차는 넓은 화면에서만 보인다.
 */
export function DocShell({ docs }: { docs: Record<string, ReactNode> }) {
  const [active, setActive] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = (scrollTop: boolean) => {
      const next = docIdFromHash(window.location.hash);
      const apply = () => {
        setActive(next);
        setMenuOpen(false);
      };
      // 주소가 바뀐 경우엔 문서를 바로 그려 둔다 — 숨은 채로 소제목에 스크롤하면 움직이지 않는다.
      if (scrollTop) flushSync(apply);
      else apply();
      // 그려진 다음 프레임에 위치를 잡는다 — 소제목 앵커면 그 소제목으로.
      requestAnimationFrame(() => {
        const target = window.location.hash.includes("--")
          ? document.getElementById(decodeHash(window.location.hash))
          : null;
        if (target) target.scrollIntoView();
        else if (scrollTop) window.scrollTo(0, 0);
      });
    };
    sync(false);
    const onHash = () => sync(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const activeDoc = findDoc(active);

  return (
    <div className="app-wide-page min-h-dvh bg-surface-container">
      {/* 좁은 화면 — 위에 붙은 문서 바. 누르면 문서 목록이 펼쳐진다. */}
      <div className="sticky top-0 z-30 bg-surface-container/95 pt-[var(--safe-area-top)] backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          className="flex h-14 w-full items-center justify-between px-4 text-left active:bg-surface-container-pressed"
        >
          <span className="min-w-0">
            <span className="block text-label-m text-text-tertiary">
              디자인 시스템 · {DOC_GROUP_LABEL[activeDoc.group]}
            </span>
            <span className="block truncate text-body-m text-text-primary">
              {activeDoc.title}
            </span>
          </span>
          <ChevronDownIcon
            size={20}
            className={cn(
              "shrink-0 text-icon-secondary transition-transform duration-200",
              menuOpen && "rotate-180",
            )}
          />
        </button>
        {menuOpen ? (
          <div className="max-h-[70dvh] overflow-y-auto px-2 pb-4">
            <div className="px-2 pb-4">
              <CopyForAi active={active} />
            </div>
            <SideNav active={active} />
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex max-w-[1360px]">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto px-3 pt-8 pb-12 lg:block">
          <a
            href="#overview"
            className="block px-3 pb-4 text-title-3 text-text-primary"
          >
            디자인 시스템
          </a>
          <SideNav active={active} />
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-6 pb-32 sm:px-8 lg:pt-10 xl:px-12">
          <div className="mx-auto max-w-[760px]">
            {DOC_LIST.map((doc) => (
              <div key={doc.id} data-doc={doc.id} hidden={doc.id !== active}>
                {docs[doc.id] ?? null}
              </div>
            ))}
          </div>
        </main>

        <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 overflow-y-auto pt-10 pr-6 xl:block">
          <CopyForAi active={active} />
          <Toc active={active} />
        </aside>
      </div>
    </div>
  );
}

/** 지금 문서를 마크다운으로 복사 — AI에게 부품 규칙을 그대로 넘길 때. */
function CopyForAi({ active }: { active: string }) {
  const toast = useToast();
  return (
    <Button
      variant="tint"
      size="s"
      className="mb-6"
      onClick={async () => {
        const pane = document.querySelector(`[data-doc="${active}"]`);
        if (!pane) return;
        try {
          await navigator.clipboard.writeText(docToMarkdown(pane));
          toast.show("이 문서를 마크다운으로 복사했어요", { tone: "success" });
        } catch {
          toast.show("복사하지 못했어요", { tone: "error" });
        }
      }}
    >
      AI용 복사
    </Button>
  );
}

function SideNav({ active }: { active: string }) {
  return (
    <nav aria-label="디자인 시스템 문서" className="flex flex-col gap-6">
      <NavLink id="overview" title="개요" active={active} />
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="px-3 pb-1 text-label-m text-text-tertiary">
            {DOC_GROUP_LABEL[group]}
          </p>
          <ul className="flex flex-col">
            {DOC_LIST.filter((doc) => doc.group === group).map((doc) => (
              <li key={doc.id}>
                <NavLink id={doc.id} title={doc.title} active={active} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NavLink({
  id,
  title,
  active,
}: {
  id: string;
  title: string;
  active: string;
}) {
  const current = id === active;
  return (
    <a
      href={`#${id}`}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-9 items-center rounded-10 px-3 text-body-s motion-safe:transition-colors motion-safe:duration-120",
        current
          ? "bg-surface-primary-subtle text-primary"
          : "text-text-secondary active:bg-surface-container-pressed",
      )}
    >
      {title}
    </a>
  );
}

/**
 * 이 문서 목차 — 보이는 문서의 소제목(data-toc)을 모아 만들고, 화면 위쪽에 걸린 소제목을 표시한다.
 */
function Toc({ active }: { active: string }) {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const pane = document.querySelector(`[data-doc="${active}"]`);
    if (!pane) return;
    const headings = [...pane.querySelectorAll<HTMLElement>("[data-toc]")];
    // 문서가 바뀔 때마다 그 문서의 소제목을 다시 모은다(DOM에서 읽어야 해서 effect에서 한다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(headings.map((el) => ({ id: el.id, label: el.textContent ?? "" })));
    setCurrent(headings[0]?.id ?? null);

    const onScroll = () => {
      // 화면 위에서 120px 선을 지난 마지막 소제목이 지금 읽는 절이다.
      let last: string | null = headings[0]?.id ?? null;
      for (const el of headings) {
        if (el.getBoundingClientRect().top <= 120) last = el.id;
      }
      setCurrent(last);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);

  if (items.length === 0) return null;
  return (
    <nav aria-label="이 문서 목차">
      <p className="pb-2 text-label-m text-text-tertiary">이 문서 목차</p>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block py-1.5 text-label-m motion-safe:transition-colors motion-safe:duration-120",
                item.id === current ? "text-primary" : "text-text-tertiary",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
