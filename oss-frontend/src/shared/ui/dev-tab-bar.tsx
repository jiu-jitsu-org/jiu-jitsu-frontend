"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { isNativeBridgeAvailable } from "@/shared/lib/native-bridge";
import { CalendarIcon, ChatBubbleIcon } from "@/shared/ui/icons";

/** 탭 바 높이(홈 인디케이터 여백 제외). FAB 등이 이만큼 위로 비켜선다. */
const TAB_BAR_HEIGHT = "56px";

const TABS = [
  { href: "/", label: "커뮤니티", Icon: ChatBubbleIcon },
  { href: "/competition", label: "대회", Icon: CalendarIcon },
] as const;

/**
 * 테스트용 하단 탭 바 — 앱 밖 브라우저(폰 Safari 등)에서 대회 탭을 열어 보기 위한 임시 입구.
 *
 * 실제 하단 탭은 iOS 앱이 그린다. 웹 단독으로 띄우면 탭이 없어 `/competition`에 갈 길이 없으므로,
 * 개발 환경(`enabled`, 서버가 정함)이면서 네이티브 브릿지가 없을 때만 앱 탭을 흉내 내 그린다.
 * 앱 웹뷰에선 진짜 탭과 겹치지 않게 그리지 않는다. 대회 API가 붙어 앱 탭으로 들어가면 지운다.
 */
export function DevTabBar({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  // 브릿지 판정은 브라우저에서만 가능 — 첫 그림은 비워 두고 마운트 뒤에 정한다.
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 마운트 뒤에만 알 수 있는 값(브릿지 유무)으로 한 번 정한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(enabled && !isNativeBridgeAvailable());
  }, [enabled]);

  // 떠 있는 버튼(글쓰기 FAB 등)이 탭 바에 가리지 않게 높이를 전역 변수로 알린다.
  useEffect(() => {
    if (!show) return;
    const root = document.documentElement;
    root.style.setProperty("--dev-tab-bar-h", `calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom))`);
    return () => {
      root.style.removeProperty("--dev-tab-bar-h");
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* 마지막 줄이 탭 바 밑에 깔리지 않게 같은 높이만큼 자리를 둔다. */}
      <div aria-hidden className="h-[var(--dev-tab-bar-h)]" />
      <nav
        aria-label="테스트용 하단 탭"
        className="fixed inset-x-0 bottom-0 z-40 bg-surface-background pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex" style={{ height: TAB_BAR_HEIGHT }}>
          {TABS.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] leading-[14px] font-semibold",
                    active ? "text-text-primary" : "text-text-tertiary",
                  )}
                >
                  <Icon size={22} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
