"use client";

import { useEffect, useRef, useState } from "react";

/** 움직임 줄이기 설정이면 나가는 애니메이션을 기다리지 않고 바로 지운다. 이벤트 핸들러에서만 부른다. */
export function prefersReducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 목록에 "새로 들어온" 키 — 팝인 클래스의 스위치(사진 썸네일·태그 칩).
 *
 * 처음 마운트 때 있던 키(수정 화면의 기존 태그 등)는 새 키가 아니다. 렌더 중에 직전 키 목록과 비교해
 * 늘어난 것만 표시한다(렌더 중 보정이라 그 키가 처음 그려지는 렌더에 바로 클래스가 붙는다).
 * 애니메이션이 끝나면 onPopEnd로 표시를 뗀다 — 남겨 두면 키보드가 올라왔다 내려가며 목록이 다시
 * 마운트될 때 같은 조각이 또 튄다.
 */
export function usePopInKeys<K>(keys: readonly K[]) {
  const [known, setKnown] = useState(keys);
  const [popping, setPopping] = useState<ReadonlySet<K>>(() => new Set());
  if (
    known.length !== keys.length ||
    known.some((key, index) => key !== keys[index])
  ) {
    setKnown(keys);
    const added = keys.filter((key) => !known.includes(key));
    if (added.length > 0) setPopping(new Set([...popping, ...added]));
  }

  function onPopEnd(key: K) {
    if (!popping.has(key)) return;
    setPopping((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  return { isPopping: (key: K) => popping.has(key), onPopEnd };
}

/**
 * 지워지는 조각을 바로 빼지 않고 "나가는 중"으로 잠깐 두는 키 집합 — 줄어드는 애니메이션을 보여준 뒤 finish로
 * 실제 상태에서 뺀다. animationend 대신 타이머인 이유: 키보드가 올라와 목록이 통째로 사라지는 등 조각이
 * 먼저 언마운트되면 끝 이벤트가 오지 않아 영영 "나가는 중"에 갇히기 때문.
 * 움직임 줄이기 설정이면 기다리지 않고 바로 finish한다.
 */
export function useLeavingKeys<K>() {
  const [leaving, setLeaving] = useState<ReadonlySet<K>>(() => new Set());
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
    };
  }, []);

  function leave(key: K, durationMs: number, finish: () => void) {
    if (leaving.has(key)) return;
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    setLeaving((prev) => new Set(prev).add(key));
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      finish();
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, durationMs);
    timers.current.add(timer);
  }

  return { isLeaving: (key: K) => leaving.has(key), leave };
}
