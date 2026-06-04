import type { InboundMessage } from "@/shared/lib/native-bridge/messages";

/**
 * 브릿지 interop을 위한 window 전역 타입 선언.
 *
 * - `webkit.messageHandlers.AppBridge` : iOS(WKWebView)가 주입하는 수신구
 * - `AppBridge`                        : Android(addJavascriptInterface)가 주입하는 수신구
 * - `WebBridge`                        : 웹(FE)이 정의하고 네이티브가 호출하는 수신구
 *
 * 이 전역들은 네이티브 연동 계약상 불가피한 interop 표면이다. (앱 정책: 전역 변수 지양이나
 * 브릿지 핸들은 플랫폼이 강제하는 예외) 직접 접근은 native-bridge.ts 한 곳으로만 캡슐화한다.
 *
 * NOTE: 파일명을 native-bridge.ts와 다르게 둔다. 같은 basename의 .d.ts는 해당 .ts의
 *       선언 파일로 간주되어 ambient 전역 선언이 무시된다.
 */
declare global {
  interface Window {
    webkit?: {
      messageHandlers?: Record<
        string,
        { postMessage: (message: unknown) => void } | undefined
      >;
    };
    AppBridge?: {
      postMessage: (json: string) => void;
    };
    WebBridge?: {
      receive: (raw: string | InboundMessage) => void;
    };
  }
}

export {};
