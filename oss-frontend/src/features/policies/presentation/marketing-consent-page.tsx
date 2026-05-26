import {
  Lead,
  Notice,
  OrderedList,
  PolicyDocument,
  Section,
  UnorderedList,
} from "./policy-document";

/**
 * Presentation page for the OSS marketing consent notice.
 *
 * Plain text document describing what optional marketing communications
 * users may receive and how to opt out. Visual primitives are shared via
 * `./policy-document` for consistency with other policy pages.
 */
export function MarketingConsentPage() {
  return (
    <PolicyDocument title="마케팅 정보 수신 동의" subtitle="서비스명: OSS">
      <Lead>
        본 동의는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조 및
        같은 법 시행령에 따라, 「JiuJitsuLab」(이하 &quot;운영자&quot;)이
        제공하는 주짓수 커뮤니티 서비스 「OSS」(이하 &quot;서비스&quot;)
        이용자에게 발송하는 <strong>광고성 정보 수신 여부</strong>에 관한
        사항을 안내합니다.
      </Lead>
      <Lead>
        본 동의는 <strong>선택 사항</strong>이며, 동의하지 않더라도 회원가입 및
        서비스의 기본 이용에는 어떠한 제한도 없습니다. 단, 동의하지 않을 경우
        운영자가 안내하는 이벤트·혜택 정보를 받지 못할 수 있습니다.
      </Lead>

      <Section title="1. 수집·이용 목적">
        <p>운영자는 다음 목적을 위해 광고성 정보를 발송할 수 있습니다.</p>
        <UnorderedList>
          <li>운영자 제공 콘텐츠(게시물·영상·가이드 등)의 신규 등록 안내 및 추천</li>
          <li>주짓수 대회·세미나·오픈매트 등 이벤트 안내 및 참여 신청 안내</li>
          <li>커뮤니티 활성화를 위한 기획전·챌린지·설문 등의 참여 안내</li>
          <li>신규 기능·업데이트 등 서비스 개선 사항 안내(광고성 정보에 해당하는 경우)</li>
          <li>제휴 도장·브랜드와 관련된 혜택·할인 정보 제공</li>
          <li>그 밖에 서비스 이용에 도움이 되는 부가 정보 제공</li>
        </UnorderedList>
        <Notice>
          서비스 운영상 필수적인 공지(약관·정책 변경, 보안, 계정 안내, 댓글·좋아요
          등 본인 활동 관련 알림 등)는 본 동의 여부와 무관하게 발송됩니다.
        </Notice>
      </Section>

      <Section title="2. 마케팅 정보 수신 채널">
        <p>
          이용자는 아래 채널을 통해 광고성 정보를 수신하며, 동의 여부는 채널별로
          개별 선택할 수 있습니다.
        </p>
        <UnorderedList>
          <li>
            ☐ <strong>앱 푸시 알림</strong> (OSS 앱)
          </li>
        </UnorderedList>
        <Notice>
          향후 이메일, 카카오 알림톡 등 발송 채널이 추가될 경우, 운영자는 본 동의
          내용을 사전에 갱신하고 별도로 이용자의 동의를 받습니다.
        </Notice>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <UnorderedList>
          <li>
            광고성 정보는{" "}
            <strong>이용자가 수신 동의를 철회하거나 회원 탈퇴하는 시점까지</strong>{" "}
            발송됩니다.
          </li>
          <li>동의 철회 또는 탈퇴 즉시 해당 목적의 발송은 중단됩니다.</li>
        </UnorderedList>
      </Section>

      <Section title="4. 동의 철회 방법">
        <p>
          이용자는 언제든지 다음의 방법으로 광고성 정보 수신 동의를 철회할 수
          있습니다.
        </p>
        <UnorderedList>
          <li>
            앱 내 <strong>[설정 &gt; 알림 설정]</strong> 화면에서 마케팅 알림
            수신을 OFF
          </li>
          <li>단말기 자체의 푸시 알림 권한 해제</li>
          <li>운영자 이메일(jiujitsulab.team@gmail.com)로 철회 요청</li>
        </UnorderedList>
      </Section>

      <Section title="5. 유의사항">
        <OrderedList>
          <li>
            본 동의는 「정보통신망법」 제50조 제8항에 따라, 이용자가 동의한
            날부터 <strong>2년이 경과한 시점</strong>에 운영자가 수신 동의 유지
            여부를 재확인할 수 있습니다.
          </li>
          <li>
            운영자는 「정보통신망법」 제50조 제4항에 따라 광고성 정보 발송 시
            제목 또는 본문에 &quot;(광고)&quot; 표시 등 법령이 정한 사항을
            표기합니다.
          </li>
          <li>
            야간 시간대(오후 9시 ~ 다음 날 오전 8시)에는 별도의 사전 동의 없이는
            광고성 푸시 알림을 발송하지 않습니다.
          </li>
          <li>
            만 14세 미만 아동은 회원가입이 제한되므로 본 동의의 대상이 되지
            않습니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="부칙">
        <p>본 동의의 시행일은 추후 공지합니다.</p>
      </Section>
    </PolicyDocument>
  );
}
