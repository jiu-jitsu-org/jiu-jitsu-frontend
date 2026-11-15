import type { ReactNode } from "react";

import { DocShell } from "./doc-kit/doc-shell";
import { ButtonDoc } from "./docs/component-button";
import { EmptyStateDoc } from "./docs/component-empty-state";
import { IconButtonDoc } from "./docs/component-icon-button";
import { SearchFieldDoc } from "./docs/component-search-field";
import { ToastDoc } from "./docs/component-toast";
import {
  BackButtonDoc,
  ChipDoc,
  DividerDoc,
  OpenInAppPromptDoc,
  RelativeTimeDoc,
  SkeletonDoc,
  SpinnerDoc,
} from "./docs/components-basic";
import { ColorDoc } from "./docs/foundation-color";
import {
  CharacterDoc,
  IconDoc,
  LayerDoc,
  MotionDoc,
  RadiusDoc,
  TypographyDoc,
} from "./docs/foundations";
import { OverviewDoc } from "./docs/overview";
import { BeltAvatarDoc, CompetitionRowDoc, FeedCardDoc } from "./docs/patterns";

/**
 * /ds — 디자인 시스템 문서(당근 Seed 문서식: 기초 · 부품 · 패턴마다 문서 한 장).
 *
 * 문서 목록·순서는 doc-kit/doc-registry.ts, 문서 틀(머리 · 견본 판 · 표 · 좋은 예/피할 것)은 doc-kit/,
 * 문서 내용은 docs/에 있다. 새 문서는 registry에 한 줄 + docs/에 파일 + 아래 DOC_CONTENT에 한 줄.
 *
 * 색은 scripts/build-tokens.mjs가 만든 토큰 목록(manifest.ts)을 그대로 읽어 그리므로
 * Figma 변수를 다시 내보내고 `npm run tokens`만 돌리면 이 페이지도 따라 바뀐다.
 * 글자·모서리·모션 값 설명은 globals.css · motion.css를 옮겨 적었다 — 크기는 그려진 부품에서 잰다.
 */
const DOC_CONTENT: Record<string, ReactNode> = {
  overview: <OverviewDoc />,
  color: <ColorDoc />,
  typography: <TypographyDoc />,
  radius: <RadiusDoc />,
  motion: <MotionDoc />,
  icon: <IconDoc />,
  layer: <LayerDoc />,
  character: <CharacterDoc />,
  button: <ButtonDoc />,
  "icon-button": <IconButtonDoc />,
  chip: <ChipDoc />,
  "search-field": <SearchFieldDoc />,
  toast: <ToastDoc />,
  "empty-state": <EmptyStateDoc />,
  skeleton: <SkeletonDoc />,
  spinner: <SpinnerDoc />,
  divider: <DividerDoc />,
  "back-button": <BackButtonDoc />,
  "open-in-app-prompt": <OpenInAppPromptDoc />,
  "relative-time": <RelativeTimeDoc />,
  "belt-avatar": <BeltAvatarDoc />,
  "competition-row": <CompetitionRowDoc />,
  "feed-card": <FeedCardDoc />,
};

export function DesignSystemPage() {
  return <DocShell docs={DOC_CONTENT} />;
}
