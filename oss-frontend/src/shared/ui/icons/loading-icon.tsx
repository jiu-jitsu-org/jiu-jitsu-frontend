import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 로딩(원호) 아이콘 — 글쓰기 첨부 썸네일의 업로드 중 상태(24x24, 디자인 loading.svg).
 *
 * 원의 5/6쯤을 그린 호(arc)라 회전시키면 스피너가 된다. 회전은 호출부가 `animate-spin`으로 준다 — 정지 상태로도
 * 쓸 수 있게 아이콘 자체는 움직이지 않는다. 색상은 부모에서 상속(image/status-icon #FAFAFA).
 */
export function LoadingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M21 12.0004C20.9999 13.901 20.3981 15.7528 19.2809 17.2904C18.1637 18.8279 16.5885 19.9723 14.7809 20.5596C12.9733 21.1469 11.0262 21.1468 9.21864 20.5594C7.41109 19.9721 5.83588 18.8276 4.71876 17.29C3.60165 15.7523 2.99999 13.9005 3 11.9999C3.00001 10.0993 3.60171 8.24755 4.71884 6.70994C5.83598 5.17233 7.4112 4.02785 9.21877 3.44052C11.0263 2.85319 12.9734 2.85316 14.781 3.44044"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
