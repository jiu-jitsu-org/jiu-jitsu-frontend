/**
 * 쓰던 댓글 초안 — 기기에 회원 · 글별로 남긴다(#528).
 *
 * 앱에서 글 상세는 열 때마다 새 웹뷰라, 웹뷰가 살아 있는 동안만 남는 sessionStorage로는 뒤로 갔다가
 * (스와이프 포함) 같은 글을 다시 열면 쓰던 댓글이 사라진다. 그래서 같은 주소의 웹뷰끼리 함께 쓰는
 * localStorage에 둔다(띠 묻기 기록 · pending-toast와 같은 선택).
 *
 * - 한 회원의 초안만 담는다. 다른 회원으로 저장하면 이전 회원 초안은 통째로 버린다 — 로그아웃 뒤 다른 계정이
 *   같은 글을 열어도 이전 계정 초안이 보이지 않는다. 로그아웃을 본 화면은 clearCommentDrafts로 지운다.
 * - 하루(24시간)가 지난 초안은 되살리지 않고, 저장할 때 함께 지운다.
 * - 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 아무것도 남기지 않는다 — 되살리지 않을 뿐이다.
 */

const STORAGE_KEY = "oss:comment-drafts";

/** 보관 기간 — 하루(#528 결정). */
export const COMMENT_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type DraftEntry = { body: string; savedAt: number };

type DraftStore = {
  userId: string;
  drafts: Record<string, DraftEntry>;
};

function readStore(): DraftStore | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftStore> | null;
    if (
      typeof parsed?.userId !== "string" ||
      typeof parsed.drafts !== "object" ||
      parsed.drafts === null
    ) {
      return null;
    }
    return { userId: parsed.userId, drafts: parsed.drafts };
  } catch {
    return null;
  }
}

function isFresh(
  entry: DraftEntry | undefined,
  now: number,
): entry is DraftEntry {
  return (
    typeof entry?.body === "string" &&
    entry.body !== "" &&
    typeof entry.savedAt === "number" &&
    now - entry.savedAt <= COMMENT_DRAFT_TTL_MS
  );
}

/** 이 회원이 이 글에 쓰던 초안. 없거나 다른 회원 것이거나 하루가 지났으면 null. */
export function readCommentDraft(
  userId: string,
  contentId: number,
  now = Date.now(),
): string | null {
  const store = readStore();
  if (!store || store.userId !== userId) return null;
  const entry = store.drafts[String(contentId)];
  return isFresh(entry, now) ? entry.body : null;
}

/** 초안을 남긴다. 빈 글이면 그 글의 초안을 지운다(입력칸을 모두 지움 · 등록 성공). */
export function saveCommentDraft(
  userId: string,
  contentId: number,
  body: string,
  now = Date.now(),
): void {
  const store = readStore();
  // 다른 회원의 초안은 이어 담지 않는다. 지난 초안도 이참에 걷어 낸다.
  const drafts: Record<string, DraftEntry> = {};
  if (store?.userId === userId) {
    for (const [key, entry] of Object.entries(store.drafts)) {
      if (isFresh(entry, now)) drafts[key] = entry;
    }
  }
  if (body) drafts[String(contentId)] = { body, savedAt: now };
  else delete drafts[String(contentId)];

  try {
    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId, drafts } satisfies DraftStore),
      );
    }
  } catch {
    // 저장소를 못 쓰거나 가득 찼으면 남기지 않는다.
  }
}

/** 모든 초안을 지운다 — 로그아웃. */
export function clearCommentDrafts(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
}
