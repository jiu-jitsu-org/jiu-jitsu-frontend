// 공개 저장소용: 실제 회원 사진·닉네임을 샘플로 바꾼다(캐릭터 이미지 4장 + 사진 없는 기본 아이콘 1개).
export async function useSamples(page) {
  // 글 제목·본문 등 머리줄 아래 내용은 가린다(자리는 그대로)
  await page.addStyleTag({ content: "article > :not(header){visibility:hidden!important}" });
  await page.evaluate(() => {
    const SRC = [
      "/images/balance/character-a-default.png",
      "/images/balance/character-b-default.png",
      "/images/balance/character-a-selected.png",
      "/images/balance/character-b-selected.png",
      null,
    ];
    document.querySelectorAll("article header").forEach((h, i) => {
      const av = h.querySelector("span.rounded-full");
      if (!av) return;
      const src = SRC[i % SRC.length];
      // null: 사진 없는 회원 — 앱 기본 사람 아이콘 모양
      av.innerHTML = src
        ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover">`
        : `<svg viewBox="0 0 24 24" style="width:62%;height:62%" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5z"/></svg>`;
      const name = av.nextElementSibling;
      if (name) name.textContent = `샘플 닉네임 ${i + 1}`;
    });
  });
  await page.waitForTimeout(400);
}
