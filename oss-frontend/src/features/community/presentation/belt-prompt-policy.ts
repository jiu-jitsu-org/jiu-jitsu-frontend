"use client";

/**
 * 띠 묻기 시트를 띄워도 되는지 정하는 노출 규칙 (#276).
 *
 * - '나중에'(또는 바깥 탭으로 닫기)를 누르면 7일 동안 띄우지 않는다.
 * - 하루에 한 번까지만 확인한다 — 띠가 있는지 서버에 묻는 것도 그날의 한 번으로 친다.
 *   띠가 있는 회원이 댓글을 달 때마다 프로필을 조회하지 않게 하기 위함이다.
 *
 * WHY localStorage인가: 앱에서 글 상세·밸런스 게임은 각각 다른 웹뷰다. sessionStorage는 웹뷰마다
 * 따로라 한 상세에서 '나중에'를 눌러도 다음 상세에서 또 뜬다. 같은 origin 웹뷰끼리 공유되는
 * localStorage에 둔다(pending-toast와 같은 선택). 기기 단위 기록이라 같은 기기에서 계정을 바꾸면
 * 그대로 이어지지만, 하루·7일 뒤면 다시 확인하므로 손해가 작다.
 */
const STORAGE_KEY = "belt-prompt";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/** 글 등록 → 상세 이동 사이에 "방금 쓴 글"을 넘기는 키. 같은 웹뷰 안의 이동이라 sessionStorage로 충분하다. */
const AFTER_POST_KEY = "belt-prompt-after-post";

type BeltPromptRecord = {
  /** 이 시각(ms) 전에는 띄우지 않는다. */
  snoozedUntil?: number;
  /** 마지막으로 확인한 날(기기 시간 기준 YYYY-MM-DD). */
  checkedDay?: string;
};

function readRecord(): BeltPromptRecord {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BeltPromptRecord) : {};
  } catch {
    return {};
  }
}

function writeRecord(patch: BeltPromptRecord): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readRecord(), ...patch }),
    );
  } catch {
    // 스토리지 차단 환경. 기록을 못 남기면 다음 계기에 다시 확인할 뿐이다.
  }
}

/** "하루"는 기기 시간의 날짜로 센다 — 사용자가 느끼는 하루와 맞추기 위함. */
function dayOf(now: number): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** 지금 띠가 있는지 확인해 봐도 되는가. */
export function canCheckBeltPrompt(now = Date.now()): boolean {
  const { snoozedUntil, checkedDay } = readRecord();
  if (snoozedUntil !== undefined && now < snoozedUntil) return false;
  return checkedDay !== dayOf(now);
}

/** 오늘 확인을 마쳤다고 남긴다(띠가 있든 없든, 시트를 띄웠든 아니든). */
export function markBeltPromptChecked(now = Date.now()): void {
  writeRecord({ checkedDay: dayOf(now) });
}

/** '나중에' — 7일 동안 띄우지 않는다. */
export function snoozeBeltPrompt(now = Date.now()): void {
  writeRecord({ snoozedUntil: now + SNOOZE_MS });
}

/** 글을 등록한 직후 상세로 넘어가기 전에 부른다. 상세가 같은 글이면 띠 확인을 한다. */
export function markBeltPromptAfterPost(postId: number): void {
  try {
    window.sessionStorage.setItem(AFTER_POST_KEY, String(postId));
  } catch {
    // 스토리지 차단 환경 — 이번 계기만 놓친다.
  }
}

/** 이 글이 방금 쓴 글이면 true를 돌려주며 지운다(한 번만). */
export function consumeBeltPromptAfterPost(postId: number): boolean {
  try {
    if (window.sessionStorage.getItem(AFTER_POST_KEY) !== String(postId)) {
      return false;
    }
    window.sessionStorage.removeItem(AFTER_POST_KEY);
    return true;
  } catch {
    return false;
  }
}
