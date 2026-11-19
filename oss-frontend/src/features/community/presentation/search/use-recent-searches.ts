"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  RECENT_SEARCH_LIMIT,
  addRecentSearch,
} from "@/features/community/domain/post-search";

/**
 * 최근 검색(#591) — 이 기기에만 남긴다(localStorage, 10개까지). 서버로 보내지 않는다.
 *
 * WHY localStorage: 앱은 검색 화면을 열 때마다 새 서브뷰 웹뷰로 띄워 sessionStorage가 이어지지 않는다.
 * 같은 주소의 웹뷰끼리 함께 쓰는 localStorage에 둔다(띠 묻기 · 미뤄 둔 토스트와 같은 선택).
 * 기기 단위라 같은 기기에서 계정을 바꿔도 남는다 — 검색어는 계정 정보가 아니라 감수한다.
 *
 * 저장소를 못 쓰면(사생활 보호 모드 등) 빈 목록으로 보고 저장도 조용히 건너뛴다 — 검색은 그대로 된다.
 */
const STORAGE_KEY = "oss.community.recent-searches";

/** 같은 문서 안의 변경 알림(storage 이벤트는 다른 문서에만 온다). */
const CHANGE_EVENT = "oss:recent-searches-change";

const EMPTY: readonly string[] = [];

let cachedRaw: string | null = null;
let cachedList: readonly string[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    return value
      .filter((item): item is string => typeof item === "string" && !!item)
      .slice(0, RECENT_SEARCH_LIMIT);
  } catch {
    return EMPTY;
  }
}

/** 같은 원문이면 같은 배열을 돌려준다 — useSyncExternalStore가 매번 새 값으로 보고 다시 그리지 않게. */
function getSnapshot(): readonly string[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parse(raw);
  }
  return cachedList;
}

/** 서버에서는 알 수 없어 비어 있다 — 하이드레이션 뒤 실제 목록이 그려진다. */
function getServerSnapshot(): readonly string[] | null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(list: readonly string[]): void {
  try {
    if (list.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 저장소를 못 쓰면 이번 검색만 남지 않을 뿐이다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * 최근 검색 목록과 고치는 함수. 목록은 하이드레이션 전에는 null(아직 모름)이라 그때는 아무것도 그리지 않는다.
 */
export function useRecentSearches() {
  const recent = useSyncExternalStore<readonly string[] | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const add = useCallback((keyword: string) => {
    write(addRecentSearch(getSnapshot(), keyword));
  }, []);

  const remove = useCallback((keyword: string) => {
    write(getSnapshot().filter((item) => item !== keyword));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  return { recent, add, remove, clear };
}
