"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Belt } from "@/features/community/domain/belt";
import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import {
  canCheckBeltPrompt,
  consumeBeltPromptAfterPost,
  markBeltPromptChecked,
  snoozeBeltPrompt,
} from "@/features/community/presentation/belt-prompt-policy";
import { BeltPromptSheet } from "@/features/community/presentation/belt-prompt-sheet";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { useToast } from "@/shared/ui";

const BELT_PATH = "/api/community/profile/belt";

/** 계기가 생긴 화면이 부른다. Provider 밖(띠를 묻지 않는 화면)에서는 아무것도 하지 않는다. */
const BeltPromptContext = createContext<() => void>(() => {});

export function useRequestBeltPrompt(): () => void {
  return useContext(BeltPromptContext);
}

/**
 * 띠 묻기 시트의 계기·확인·저장을 맡는다 (#275, #276).
 *
 * 띠·체급 필수 입력 알럿 대신(#270·#274) 활동한 직후에 띠만 가볍게 묻는다. 지금 계기는 두 가지다.
 * - 글을 등록한 직후: 작성 화면이 상세로 넘어가며 남긴 표시(markBeltPromptAfterPost)를 상세가 소비한다.
 * - 댓글을 남긴 직후: 댓글 입력 바가 useRequestBeltPrompt()로 부른다.
 * 다른 회원 프로필은 앱 화면이라(OPEN_USER_PROFILE) 그 계기는 네이티브 몫이다.
 *
 * 띄우기 전에 노출 규칙(7일·하루 1번, belt-prompt-policy)을 보고, 서버에 띠가 없을 때만 연다.
 */
export function BeltPromptProvider({
  postId,
  children,
}: {
  /** 상세의 글 id — 방금 등록한 글이면 열자마자 확인한다. */
  postId?: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const demo = useIsDemoMode();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkingRef = useRef(false);

  const requestPrompt = useCallback(() => {
    if (demo || checkingRef.current) return;
    checkingRef.current = true;
    void needsBeltPrompt()
      .then((needs) => {
        if (!needs) return;
        // 댓글을 막 보낸 직후면 키보드가 떠 있다 — 내려야 시트가 가려지지 않는다.
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setOpen(true);
      })
      .finally(() => {
        checkingRef.current = false;
      });
  }, [demo]);

  useEffect(() => {
    if (postId !== undefined && consumeBeltPromptAfterPost(postId)) {
      requestPrompt();
    }
  }, [postId, requestPrompt]);

  function later() {
    if (saving) return;
    snoozeBeltPrompt();
    setOpen(false);
  }

  async function save(belt: Belt) {
    setSaving(true);
    try {
      const response = await bffFetch(BELT_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(belt),
      });
      if (!response.ok) {
        // 시트는 열어 둔다 — 고른 띠를 그대로 두고 다시 누를 수 있게.
        toast.show("띠를 저장하지 못했어요");
        return;
      }
      setOpen(false);
      toast.show("내 띠를 저장했어요");
      // 작성자 줄의 띠를 서버 값으로 다시 그린다.
      router.refresh();
    } catch (error) {
      console.error("[belt-prompt] 띠 저장 실패:", error);
      toast.show("띠를 저장하지 못했어요");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BeltPromptContext.Provider value={requestPrompt}>
      {children}
      <BeltPromptSheet
        open={open}
        saving={saving}
        onSave={save}
        onLater={later}
      />
    </BeltPromptContext.Provider>
  );
}

/**
 * 지금 띠를 물어야 하는가 — 노출 규칙을 통과하고, 서버에 띠가 확실히 없을(null) 때만 true.
 *
 * 띠가 있으면 묻지 않는다. 확인이 실패하면(비로그인 401·네트워크·읽을 수 없는 응답) 그날의 기회를
 * 쓰지 않고 다음 계기로 넘긴다 — 띠가 있는지 없는지 알아낸 경우만 확인으로 친다.
 */
async function needsBeltPrompt(): Promise<boolean> {
  if (!canCheckBeltPrompt()) return false;
  try {
    const response = await bffFetch(BELT_PATH);
    if (!response.ok) return false;

    const json = (await response.json().catch(() => null)) as {
      data?: { belt?: Belt | null };
    } | null;
    const belt = json?.data?.belt;
    if (belt === undefined) return false;

    markBeltPromptChecked();
    return belt === null;
  } catch (error) {
    console.error("[belt-prompt] 띠 확인 실패:", error);
    return false;
  }
}
