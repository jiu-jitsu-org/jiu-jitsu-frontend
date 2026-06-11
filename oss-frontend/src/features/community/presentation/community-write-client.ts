import type { ImageUploadAuth } from "@/features/community/domain/image";
import type {
  CreatePostInput,
  CreatedPost,
} from "@/features/community/domain/post";
import { compressImage } from "@/features/community/presentation/compress-image";

/**
 * 게시글 작성 클라이언트 호출부 (브라우저 전용).
 *
 * 우리 서버 호출(①③④)은 BFF 라우트(/api/community/*)를 거치고, ②만 서드파티(ImageKit)에
 * 브라우저가 직접 업로드한다(원본 File이 브라우저에만 있으므로). 전체 순서:
 *   ① GET  /api/community/image/auth   → { token, expire, signature }
 *   ② POST {ImageKit}/api/v1/files/upload (서명으로 직접 업로드) → { fileId, url }
 *   ③ POST /api/community/image        → { id }(우리 서버 int imageId, TEMP)
 *   ④ POST /api/community/board        → { id }(생성된 게시글)
 * 등록(③)은 고를 때가 아니라 작성(④) 직전에만 일어나므로 CDN/서버 미아가 생기지 않는다.
 */

/** ImageKit 업로드 엔드포인트(고정 공개 엔드포인트, 필요 시 env로 override). */
const IMAGEKIT_UPLOAD_URL =
  process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_URL ??
  "https://upload.imagekit.io/api/v1/files/upload";

/**
 * ImageKit publicKey (주짓수랩 ImageKit 계정). publicKey는 비밀이 아니라 클라이언트 노출이
 * 정상이며, 서버 서명(/image/auth)과 반드시 같은 계정의 키여야 한다.
 * env로 override 가능하되, 실제 키를 기본값으로 두어 standalone 빌드에서 별도 주입 없이도 동작한다.
 */
const IMAGEKIT_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ??
  "public_mQk8MsljUr3YQ2KBYGqSJg3gYAc=";

/** ImageKit 업로드 폴더. 루트가 아니라 커뮤니티 게시글 이미지 경로 아래로 모은다. */
const IMAGEKIT_FOLDER = "community/posts";

/** status를 실은 에러(호출부가 401 등을 분기). */
export class WriteRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WriteRequestError";
  }
}

/** BFF 응답({ success, data })에서 data를 꺼낸다. 실패면 status를 실어 throw. */
async function unwrap<T>(response: Response, context: string): Promise<T> {
  // 본문을 한 번만 읽어 성공/실패 모두 로깅한다(디버깅용).
  const json = (await response.json().catch(() => null)) as {
    data?: T;
  } | null;

  if (!response.ok) {
    console.error(`[community-write] ${context} ${response.status} 실패`, json);
    throw new WriteRequestError(`${context} failed`, response.status);
  }

  console.info(`[community-write] ${context} ${response.status} 성공`, json);
  return json?.data as T;
}

/** ① ImageKit 업로드용 서명 발급. */
async function fetchImageUploadAuth(): Promise<ImageUploadAuth> {
  const response = await fetch("/api/community/image/auth", { method: "GET" });
  return unwrap<ImageUploadAuth>(response, "image-auth");
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

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new WriteRequestError("ImageKit 업로드 실패", response.status);
  }

  const json = (await response.json()) as { fileId?: string; url?: string };
  console.info("[community-write] imagekit 업로드 성공", json);
  if (!json.fileId || !json.url) {
    throw new WriteRequestError("ImageKit 응답이 올바르지 않음", 502);
  }
  return { fileId: json.fileId, url: json.url };
}

/** ③ 업로드 결과를 우리 서버에 등록 → 우리 서버 int imageId. */
async function registerImage(cdnId: string, imageUrl: string): Promise<number> {
  const response = await fetch("/api/community/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cdnId, imageUrl }),
  });
  const data = await unwrap<{ id: number }>(response, "image-register");
  return data.id;
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
export async function createPost(
  input: CreatePostInput,
): Promise<CreatedPost> {
  const response = await fetch("/api/community/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<CreatedPost>(response, "create-post");
}
