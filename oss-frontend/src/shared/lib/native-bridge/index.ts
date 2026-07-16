// Native bridge public API barrel.
// 메시지 계약과 런타임 adapter를 한 경로에서 import하되, ambient global 선언(.d.ts)은 export하지 않는다.
export { InboundMessageType, OutboundMessageType } from "./messages";
export type {
  AuthLoginPayload,
  AuthLoginSuccessPayload,
  BridgeMessage,
  InboundMessage,
  OpenSubviewPayload,
} from "./messages";
export {
  closeNativeSubview,
  detectPlatform,
  isNativeBridgeAvailable,
  openNativeSubview,
  postToNative,
  registerWebBridge,
} from "./native-bridge";
export type { BridgePlatform } from "./native-bridge";
export { useNativeBackHandler } from "./native-back";
export {
  notifySessionRefreshed,
  notifySessionRefreshFailed,
  refreshSessionViaBridge,
} from "./session-refresh";
