import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 편집(펜) 아이콘 — 게시글 작성 진입 FAB용 디자인 SVG.
 *
 * 원본 색(#FAFAFA) → currentColor로 바꿔 부모의 색 토큰(button-filled-default-text)을 상속한다.
 * viewBox가 20이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 */
export function EditIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <g opacity="0.8" clipPath="url(#clip0_2235_12483)">
        <path
          d="M10.8326 17.4997H17.4993M17.6443 5.67633C18.0849 5.23585 18.3325 4.63839 18.3325 4.01538C18.3326 3.39237 18.0852 2.79484 17.6447 2.35425C17.2042 1.91366 16.6068 1.66609 15.9838 1.66602C15.3607 1.66594 14.7632 1.91335 14.3226 2.35383L3.20096 13.478C3.00748 13.6709 2.86439 13.9084 2.78429 14.1697L1.68346 17.7963C1.66192 17.8684 1.6603 17.945 1.67875 18.0179C1.69721 18.0908 1.73506 18.1574 1.78829 18.2105C1.84152 18.2636 1.90814 18.3014 1.98109 18.3197C2.05404 18.3381 2.13059 18.3363 2.20263 18.3147L5.83013 17.2147C6.0911 17.1353 6.32861 16.9931 6.52179 16.8005L17.6443 5.67633Z"
          stroke="currentColor"
          strokeWidth={1.66667}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2235_12483">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
