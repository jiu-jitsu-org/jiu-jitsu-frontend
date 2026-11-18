import Link from "next/link";

import {
  PolicyDocument,
  Section,
  UnorderedList,
} from "./policy-document";

/**
 * 앱 설정 › 문의하기 · 관장 인증 문의와 같은 주소(iOS `SupportContact.email`).
 * 바꾸면 앱도 같이 바꾼다.
 */
const SUPPORT_EMAIL = "jiujitsulab.team@gmail.com";

const linkClassName =
  "break-all font-medium text-zinc-900 underline underline-offset-2";

function SupportEmailLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClassName}>
      {SUPPORT_EMAIL}
    </a>
  );
}

/**
 * Support page used as the App Store Connect Support URL (#505).
 *
 * Opens in a browser without login so people who have not installed the
 * app (rights holders, people reporting an under-14 account) can reach us.
 * Account deletion text follows the app's withdrawal alert and the server's
 * 30-day grace period; align it with the terms when they are finalized.
 */
export function SupportPage() {
  return (
    <PolicyDocument title="고객 지원" subtitle="서비스명: OSS">
      <Section title="문의하기">
        <p>
          서비스 이용 중 궁금한 점이나 불편한 점은 아래 메일로 보내 주세요.
          확인하는 대로 답변드립니다.
        </p>
        <p>
          <strong>이메일:</strong> <SupportEmailLink />
        </p>
        <p>
          앱에서는 [설정] › [문의하기]로 보내면 답변에 필요한 앱 버전 · 기기
          정보가 함께 담깁니다.
        </p>
      </Section>

      <Section title="계정 삭제(회원 탈퇴)">
        <p>앱 [설정] › [회원 탈퇴]에서 할 수 있습니다.</p>
        <UnorderedList>
          <li>탈퇴하면 30일 뒤 계정이 영구 삭제됩니다.</li>
          <li>30일 안에 다시 로그인하면 탈퇴가 취소됩니다.</li>
          <li>작성한 게시물과 댓글은 익명으로 남습니다.</li>
        </UnorderedList>
        <p>
          앱을 쓸 수 없다면 가입한 소셜 계정(Google · Apple · Kakao)을 적어 위
          메일로 요청해 주세요.
        </p>
      </Section>

      <Section title="권리침해 신고">
        <p>
          게시물로 초상권 · 명예 · 저작권 등 권리를 침해당했다면 앱에 가입하지
          않았어도 메일(<SupportEmailLink />)로 신고할 수 있습니다. 아래 내용을
          함께 보내 주세요.
        </p>
        <UnorderedList>
          <li>게시물 주소 또는 위치</li>
          <li>침해 내용</li>
          <li>권리자(또는 대리인)임을 확인할 수 있는 자료</li>
          <li>연락처</li>
        </UnorderedList>
        <p>
          운영자는 확인한 뒤 해당 게시물을 가리고(임시조치) 처리 결과를 메일로
          알려 드립니다. 그 밖의 신고는 앱의 게시물 · 댓글 [신고]를 이용해
          주세요.
        </p>
      </Section>

      <Section title="만 14세 미만 계정">
        <p>
          OSS는 만 14세 미만의 가입을 허용하지 않습니다. 만 14세 미만으로 보이는
          계정을 알게 되면 메일로 알려 주세요. 확인되면 해당 계정과 개인정보를
          삭제합니다.
        </p>
      </Section>

      <Section title="약관 및 정책">
        <UnorderedList>
          <li>
            <Link href="/policies/terms-of-service" className={linkClassName}>
              서비스 이용약관
            </Link>
          </li>
          <li>
            <Link href="/policies/privacy-policy" className={linkClassName}>
              개인정보처리방침
            </Link>
          </li>
        </UnorderedList>
      </Section>
    </PolicyDocument>
  );
}
