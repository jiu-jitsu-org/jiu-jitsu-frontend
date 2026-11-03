// 여러 기능이 함께 쓰는 공통 UI barrel.
// 개발자는 `@/shared/ui`에서 컴포넌트를 한 번에 import 한다.
// 버튼·아이콘 버튼·뼈대·구분 띠·빈 화면처럼 모양이 화면과 상관없는 부품은 여기 둔다.
// confirm-dialog/app-bar-shell/keyboard-aware-shell처럼 커뮤니티 흐름에 묶인 UI는
// features/community/presentation에 둔다. 전체 목록과 실물은 /ds 페이지에서 본다(개발 환경).
export * from "./icons";
export { BackButton } from "./back-button";
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";
export { IconButton, iconButtonVariants } from "./icon-button";
export type { IconButtonProps } from "./icon-button";
export { Skeleton } from "./skeleton";
export { Divider } from "./divider";
export { EmptyState } from "./empty-state";
export {
  FILLED_BUTTON_PRESS,
  FILLED_BUTTON_PRESSED_BG,
  ICON_BUTTON_PRESS,
  NEUTRAL_BUTTON_PRESS,
  NEUTRAL_BUTTON_PRESSED_BG,
  PRESS_BOUNCE,
  SURFACE_PRESS,
} from "./press-styles";
export { Spinner } from "./spinner";
export { ToastProvider, useToast } from "./toast";
export { enqueuePendingToast, usePendingToast } from "./pending-toast";
export type { PendingToastAction } from "./pending-toast";
export {
  OpenInAppPromptProvider,
  useOpenInAppPrompt,
} from "./open-in-app-prompt";
export { ServerClockProvider, useServerNow } from "./server-clock";
export { RelativeTime } from "./relative-time";
