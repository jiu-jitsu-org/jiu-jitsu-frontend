// 여러 기능이 함께 쓰는 공통 UI barrel.
// 개발자는 `@/shared/ui`에서 컴포넌트를 한 번에 import 한다.
// feed/confirm-dialog/app-bar-shell/keyboard-aware-shell 등 community 전용 UI는
// features/community/presentation으로 이동했다(단일 기능 전용은 공통화하지 않는다).
export * from "./icons";
export { BackButton } from "./back-button";
export { ToastProvider, useToast } from "./toast";
