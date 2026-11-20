"use client";

import { useReportWebVitals } from "next/web-vitals";

import { track } from "./track";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

/**
 * 웹 화면 성능 지표(`web_vital`, #583) — 지표가 정해질 때 한 번씩(문서마다).
 *
 * 사전 값 lcp · inp · cls · fcp · ttfb만 싣는다(FID · Next 자체 지표는 뺀다). 값은 밀리초 정수,
 * CLS는 단위가 없는 소수라 1000배 정수로. 등급은 Web Vitals 기준을 사전 형식(needs_improvement)으로.
 *
 * 루트 레이아웃에 하나만 둔다 — 클라이언트 경계를 이 부품으로 한정한다.
 * 받는 함수는 모듈 상수로 둔다 — 참조가 바뀌면 useReportWebVitals가 관찰자를 또 걸어(router.refresh로 레이아웃이
 * 다시 그려질 때 등) 같은 지표를 다시 보낸다(Next 문서). 이 부품이 다시 붙는 경우(global-error의 다시 시도 성공,
 * 개발 모드 StrictMode)는 관찰자가 한 벌 더 걸려 그 문서의 지표가 한 번 더 나간다 — 드물어 감수한다.
 */
const METRICS: Record<string, string> = {
  LCP: "lcp",
  INP: "inp",
  CLS: "cls",
  FCP: "fcp",
  TTFB: "ttfb",
};

function reportWebVital(metric: Metric): void {
  const name = METRICS[metric.name];
  if (!name) return;
  track("web_vital", {
    metric: name,
    rating: metric.rating.replace("-", "_"),
    metric_value: name === "cls" ? metric.value * 1000 : metric.value,
  });
}

export function WebVitalsReporter(): null {
  useReportWebVitals(reportWebVital);
  return null;
}
