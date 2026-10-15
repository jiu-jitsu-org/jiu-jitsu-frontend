"use client";

import { useState } from "react";

/**
 * 토글이 꺼짐→켜짐으로 바뀐 그 순간부터 true — 리액션 팝 클래스의 스위치.
 *
 * 마운트 때 이미 켜져 있으면 false다(목록을 열 때마다 하트가 튀지 않게). 꺼지면 클래스가
 * 빠지므로 다시 켤 때 애니메이션이 처음부터 재생된다. 렌더 중 보정이라 바뀐 렌더에 바로 붙는다.
 */
export function usePopOnActivate(active: boolean) {
  const [last, setLast] = useState(active);
  const [popped, setPopped] = useState(false);
  if (last !== active) {
    setLast(active);
    if (active) setPopped(true);
  }
  return active && popped;
}
