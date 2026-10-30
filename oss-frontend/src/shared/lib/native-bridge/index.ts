// Native bridge public API barrel.
// 메시지 계약과 런타임 adapter를 한 경로에서 import하되, ambient global 선언(.d.ts)은 export하지 않는다.
export { InboundMessageType, OutboundMessageType } from "./messages";
export type {
  AuthLoginPayload,
  AuthLoginSuccessPayload,
  BridgeMessage,
  ConfirmDialogPayload,
  ConfirmDialogResult,
  ConfirmDialogTitleParts,
  InboundMessage,
  LeaveGuardPayload,
  OpenSubviewPayload,
  OpenUserProfilePayload,
  PhotosPickedPayload,
  PickedPhoto,
  PickPhotosPayload,
  SelectSheetOption,
  SelectSheetPayload,
  SelectSheetResult,
  ShareSheetPayload,
} from "./messages";
export {
  closeNativeSubview,
  detectPlatform,
  isNativeBridgeAvailable,
  openNativeSubview,
  openNativeUserProfile,
  postToNative,
  registerWebBridge,
  showNativeShareSheet,
  supportsNativeMessage,
} from "./native-bridge";
export type { BridgePlatform } from "./native-bridge";
export { useNativeLeaveGuard } from "./native-leave-guard";
export { useIsExternalBrowser } from "./use-external-browser";
export {
  requestNativeConfirm,
  requestNativePhotos,
  requestNativeSelectSheet,
} from "./native-dialog";
export type {
  NativePhotosResult,
  NativeSelectSheetOutcome,
} from "./native-dialog";
export {
  notifySessionRefreshed,
  notifySessionRefreshFailed,
  refreshSessionViaBridge,
} from "./session-refresh";
