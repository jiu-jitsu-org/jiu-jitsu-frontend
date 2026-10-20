import { getImageKitClientEnv } from "@/config/env";
import type { ImageUploadAuth } from "@/features/community/domain/image";
import type {
  CreatePostInput,
  CreatedPost,
  UpdatePostInput,
} from "@/features/community/domain/post";
import { compressImage } from "@/features/community/presentation/compress-image";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

/**
 * 게시글 작성 클라이언트 호출부 (브라우저 전용).
 *
 * 우리 서버 호출(①③④)은 BFF 라우트(/api/community/*)를 거치고, ②만 서드파티(ImageKit)에
 * 브라우저가 직접 업로드한다(원본 File이 브라우저에만 있으므로). 전체 순서:
 *   ① GET  /api/community/image/auth   → { token, expire, signature }
 *   ② POST {ImageKit}/api/v1/files/upload (서명으로 직접 업로드) → { fileId, url }
 *   ③ POST /api/community/image        → { id }(우리 서버 int imageId, TEMP)
 *   ④ POST /api/community/board        → { id }(생성된 게시글)
 *   ④' PUT /api/community/posts/{id}    → 수정(응답 본문 없음)
 * ①②③은 사진을 고르는 즉시 장별로 일어나고(썸네일 상태), ④는 등록 탭 시점에 확보된 id를 보낸다.
 */

/**
 * ImageKit 공개 설정(업로드 엔드포인트 + publicKey)은 config로 중앙화한다.
 * publicKey는 비밀이 아니라 클라이언트 노출이 정상이며, 서버 서명(/image/auth)과
 * 반드시 같은 계정의 키여야 한다. 기본값/override 규칙은 config/env.ts 참고.
 */
const { uploadUrl: IMAGEKIT_UPLOAD_URL, publicKey: IMAGEKIT_PUBLIC_KEY } =
  getImageKitClientEnv();

/** ImageKit 업로드 폴더. 루트가 아니라 커뮤니티 게시글 이미지 경로 아래로 모은다. */
const IMAGEKIT_FOLDER = "community/posts";

/**
 * status(+업스트림 에러 code)를 실은 에러. 호출부가 401·C0000 등을 분기한다.
 * code는 BFF가 details로 내려준 업스트림 봉투에서 꺼낸 값 — ImageKit 직접 호출 등 봉투가 없으면 undefined.
 */
export class WriteRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "WriteRequestError";
  }
}

/**
 * 이미지 파이프라인 단계별 타임아웃(ms). 응답이 끝내 안 오면(웹뷰가 백그라운드에서 멈춤·네트워크 끊김)
 * 썸네일이 '업로드 중'에 머물고 등록 버튼이 잠기므로, 초과 시 실패로 흘려 ↻ 재시도로 복구하게 한다.
 * ①③은 bffFetch의 만료 → 네이티브 토큰 갱신(상한 15초) → 재호출 경로까지 담도록 BFF 업스트림 상한(10초)
 * + 갱신 상한보다 넉넉히 잡는다. ②는 서명 유효(240초)보다 충분히 짧아야 재시도가 새 서명(①)부터
 * 다시 받는 흐름이 자연스럽다.
 */
const IMAGE_AUTH_TIMEOUT_MS = 30_000;
const IMAGEKIT_UPLOAD_TIMEOUT_MS = 60_000;
const IMAGE_REGISTER_TIMEOUT_MS = 30_000;

/** 타임아웃으로 끊긴 요청의 WriteRequestError code(status는 0 — 응답 자체가 없음). */
const WRITE_TIMEOUT_CODE = "TIMEOUT";

/**
 * 한 단계를 타임아웃 안에서 실행한다. 초과하면 signal을 abort(요청·본문 읽기 중단)하고
 * WriteRequestError(status 0, TIMEOUT)로 끊는다. abort가 닿지 않는 대기(bffFetch의 네이티브 세션
 * 갱신 등)도 race로 함께 끊는다.
 */
async function withTimeout<T>(
  context: string,
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`[community-write] ${context} ${timeoutMs}ms 타임아웃`);
      reject(
        new WriteRequestError(`${context} timeout`, 0, WRITE_TIMEOUT_CODE),
      );
    }, timeoutMs);
  });
  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/** BFF 응답({ success, data })에서 data를 꺼낸다. 실패면 status와 업스트림 code(details.code)를 실어 throw. */
async function unwrap<T>(response: Response, context: string): Promise<T> {
  // 본문을 한 번만 읽어 성공/실패 모두 로깅한다(디버깅용).
  const json = (await response.json().catch(() => null)) as {
    data?: T;
    details?: { code?: unknown };
  } | null;

  if (!response.ok) {
    console.error(`[community-write] ${context} ${response.status} 실패`, json);
    const code = json?.details?.code;
    throw new WriteRequestError(
      `${context} failed`,
      response.status,
      typeof code === "string" ? code : undefined,
    );
  }

  console.info(`[community-write] ${context} ${response.status} 성공`, json);
  return json?.data as T;
}

/** ① ImageKit 업로드용 서명 발급. */
async function fetchImageUploadAuth(): Promise<ImageUploadAuth> {
  return withTimeout("image-auth", IMAGE_AUTH_TIMEOUT_MS, async (signal) => {
    const response = await bffFetch("/api/community/image/auth", {
      method: "GET",
      signal,
    });
    return unwrap<ImageUploadAuth>(response, "image-auth");
  });
}

/** ② 서명으로 ImageKit에 직접 업로드 → { fileId, url }. */
async function uploadToImageKit(
  file: File,
  auth: ImageUploadAuth,
): Promise<{ fileId: string; url: string }> {
  if (!IMAGEKIT_PUBLIC_KEY) {
    throw new WriteRequestError("ImageKit publicKey 미설정", 500);
  }

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", file.name);
  form.append("folder", IMAGEKIT_FOLDER);
  form.append("publicKey", IMAGEKIT_PUBLIC_KEY);
  form.append("token", auth.token);
  form.append("expire", String(auth.expire));
  form.append("signature", auth.signature);

  return withTimeout(
    "imagekit-upload",
    IMAGEKIT_UPLOAD_TIMEOUT_MS,
    async (signal) => {
      const response = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: "POST",
        body: form,
        signal,
      });
      if (!response.ok) {
        throw new WriteRequestError("ImageKit 업로드 실패", response.status);
      }

      const json = (await response.json()) as {
        fileId?: string;
        url?: string;
      };
      console.info("[community-write] imagekit 업로드 성공", json);
      if (!json.fileId || !json.url) {
        throw new WriteRequestError("ImageKit 응답이 올바르지 않음", 502);
      }
      return { fileId: json.fileId, url: json.url };
    },
  );
}

/** ③ 업로드 결과를 우리 서버에 등록 → 우리 서버 int imageId. */
async function registerImage(cdnId: string, imageUrl: string): Promise<number> {
  return withTimeout(
    "image-register",
    IMAGE_REGISTER_TIMEOUT_MS,
    async (signal) => {
      const response = await bffFetch("/api/community/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cdnId, imageUrl }),
        signal,
      });
      const data = await unwrap<{ id: number }>(response, "image-register");
      return data.id;
    },
  );
}

/**
 * File 1장 등록 파이프라인: ⓪ 압축 → ① 서명 → ② ImageKit → ③ 서버 등록 → int imageId.
 * 압축은 업로드 직전에만 수행한다(미리보기는 원본 그대로 — 체감 동일).
 */
export async function uploadImageAndRegister(file: File): Promise<number> {
  const compressed = await compressImage(file);
  console.info(
    `[community-write] 압축 ${file.name}: ${file.size} → ${compressed.size} bytes`,
  );

  const auth = await fetchImageUploadAuth();
  const uploaded = await uploadToImageKit(compressed, auth);
  return registerImage(uploaded.fileId, uploaded.url);
}

/** ④ 게시글 생성. 401이면 status를 실어 throw(호출부가 네이티브 로그인 유도). */
export async function createPost(input: CreatePostInput): Promise<CreatedPost> {
  const response = await bffFetch("/api/community/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<CreatedPost>(response, "create-post");
}

/** ④' 게시글 수정(PUT). imageFileIdList는 남길 이미지 전체. 실패 시 status를 실어 throw. */
export async function updatePost(
  postId: number,
  input: UpdatePostInput,
): Promise<void> {
  const response = await bffFetch(`/api/community/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await unwrap<null>(response, "update-post");
}
