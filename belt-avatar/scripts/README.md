# 띠 아바타 시안 재현 스크립트 (이슈 #265)

실제 홈 피드(`/`)를 headless Chromium으로 열고, 작성자 사진 자리에 시안 모양을 DOM/SVG로 덧씌워 찍는다. 앱 코드는 바꾸지 않는다.

- `shot5.mjs` — 1안 손그림 띠 테두리 + 띠 두 가닥 (`MODES`: `circle` 사진 원형 / `clip` 사진도 같은 모양)
- `shot4.mjs` — 2안 띠 색 테두리 (`MODES`: `a` 테두리 속 검은 칸 / `b` 배지 / `c` 테두리 끊김)
- `belt.mjs` — 카드별 띠·그랄 순서(`BELTS`), `sample.mjs` — 공개용 샘플 사진·닉네임 치환

실행: `oss-frontend`에서 `npm run dev`(3000) 후 `OUT=<출력 폴더> PUB=1 node shot5.mjs`.
`playwright` 패키지가 필요하다(`npm i -D playwright` 또는 설치된 위치로 import 경로 변경).
