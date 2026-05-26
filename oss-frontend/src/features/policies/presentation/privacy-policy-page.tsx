import {
  Lead,
  Notice,
  OrderedList,
  PolicyDocument,
  PolicyTable,
  Section,
  SubSection,
  UnorderedList,
} from "./policy-document";

/**
 * Presentation page for the OSS privacy policy.
 *
 * Plain text document. Visual primitives are shared via
 * `./policy-document` so this page stays consistent with the
 * terms of service and any future policy pages.
 */
export function PrivacyPolicyPage() {
  return (
    <PolicyDocument title="개인정보처리방침" subtitle="서비스명: OSS">
      <Lead>
        JiuJitsuLab(이메일: jiujitsulab.team@gmail.com, 이하 &quot;운영자&quot;)은
        이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」, 「정보통신망
        이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.
      </Lead>
      <Lead>
        본 개인정보처리방침은 운영자가 제공하는 주짓수 커뮤니티 서비스
        「OSS」(이하 &quot;서비스&quot;)의 개인정보 처리에 관한 사항을
        규정합니다.
      </Lead>

      <Section title="제1조 (수집하는 개인정보 항목)">
        <SubSection title="1. 회원가입 시(소셜 로그인을 통한 수집)">
          <p>
            이용자가 Google, Apple, Kakao 계정을 통해 로그인할 때 각
            제공자로부터 아래 정보를 전달받습니다. 항목은 이용자의 동의 범위 및
            각 제공자의 정책에 따라 다를 수 있습니다.
          </p>
          <UnorderedList>
            <li>
              <strong>공통:</strong> 소셜 계정 고유 식별자(회원 식별용), 가입
              경로(Google/Apple/Kakao)
            </li>
            <li>
              <strong>Google 계정:</strong> 이메일, 이름, 프로필 이미지(제공된
              경우)
            </li>
            <li>
              <strong>Apple 계정:</strong> 이메일(또는 Apple Relay 이메일),
              이름(제공된 경우)
            </li>
            <li>
              <strong>Kakao 계정:</strong> 카카오 계정 이메일, 닉네임, 프로필
              이미지(제공된 경우)
            </li>
          </UnorderedList>
        </SubSection>

        <SubSection title="2. 서비스 이용 중 이용자가 직접 입력·등록하는 정보">
          <UnorderedList>
            <li>
              <strong>필수:</strong> 닉네임
            </li>
            <li>
              <strong>선택(프로필):</strong> 프로필 이미지, 벨트 등급 및 그랄(0~4)
              개수, 성별, 체중(공개 여부 선택 가능), 소속 도장 정보, 대회
              기록(연·월·대회명·순위), 선호 기술·포지션·서브미션, 지도자
              철학·지도 시작일·상세 정보
            </li>
            <li>
              <strong>선택(지도자 인증):</strong> 관장·사범 자격을 증빙하는 사진
              또는 문서
            </li>
            <li>
              <strong>커뮤니티 활동:</strong> 이용자가 작성한 게시글·댓글·좋아요
              등 활동 기록 및 첨부 이미지
            </li>
          </UnorderedList>
        </SubSection>

        <SubSection title="3. 서비스 이용 과정에서 자동으로 수집되는 정보">
          <UnorderedList>
            <li>접속 IP, 접속 일시, 서비스 이용 기록, 오류 로그</li>
            <li>기기 정보(OS 버전, 모델, 앱 버전, 언어 설정)</li>
            <li>푸시 알림 발송용 FCM 토큰</li>
            <li>
              광고 식별자(IDFA 등) — 이용자가 단말 설정에서 거부·재설정할 수
              있습니다.
            </li>
          </UnorderedList>
        </SubSection>

        <Notice>
          운영자는 주민등록번호, 신용카드 정보 등 「개인정보 보호법」상 민감정보
          및 고유식별정보는 원칙적으로 수집하지 않습니다.
          <br />
          <br />
          수집된 개인정보는 <strong>대한민국 내에 위치한 서버</strong>에
          저장·보관되며, 별도의 동의 없이 국외로 이전되지 않습니다.
        </Notice>
      </Section>

      <Section title="제2조 (개인정보의 수집·이용 목적)">
        <p>수집한 개인정보는 다음 목적에 한하여 사용됩니다.</p>
        <OrderedList>
          <li>회원 식별 및 가입·로그인 처리</li>
          <li>주짓수 프로필·대회 기록·소속 도장 정보 등록 및 공개</li>
          <li>관장·사범 지도자 인증 심사 및 인증 마크 부여</li>
          <li>
            커뮤니티 게시판 운영(게시글·댓글·좋아요 등) 및 게시물 관리
          </li>
          <li>이용자 간 분쟁, 신고, 부정 이용 방지 및 제재 처리</li>
          <li>고객 문의 대응</li>
          <li>서비스 안정성 확보, 통계 분석 및 기능 개선</li>
          <li>푸시 알림 발송(서비스 공지 및 커뮤니티 활동 알림)</li>
          <li>마케팅 및 광고 활용 — 이용자가 별도 동의한 경우에 한함</li>
        </OrderedList>
      </Section>

      <Section title="제3조 (개인정보의 보유 및 이용기간)">
        <OrderedList>
          <li>
            <strong>원칙:</strong> 이용자가 회원 탈퇴한 경우 또는 수집·이용
            목적이 달성된 경우 지체 없이 파기합니다.
          </li>
          <li>
            <strong>부정 이용 방지를 위한 예외 보관:</strong> 약관 위반에 따른
            이용 제한·계정 해지 이력은 재가입 및 부정 이용 방지를 위해 탈퇴 후
            최대 1년간 보관할 수 있습니다.
          </li>
          <li>
            <strong>관련 법령에 따른 보관:</strong> 아래 항목은 해당 법령이 정한
            기간 동안 보관 후 파기합니다.
            <UnorderedList>
              <li>
                서비스 이용기록·접속 로그·IP 정보: <strong>3개월</strong>{" "}
                (통신비밀보호법)
              </li>
              <li>
                소비자 불만 또는 분쟁 처리에 관한 기록: <strong>3년</strong>{" "}
                (전자상거래 등에서의 소비자보호에 관한 법률, 해당 시)
              </li>
            </UnorderedList>
          </li>
        </OrderedList>
      </Section>

      <Section title="제4조 (개인정보의 제3자 제공)">
        <OrderedList>
          <li>
            운영자는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
          </li>
          <li>
            다만, 다음의 경우에는 예외로 합니다.
            <UnorderedList>
              <li>이용자가 사전에 동의한 경우</li>
              <li>
                법령에 의하여 제공이 요구되는 경우 또는 수사기관이 법령에 정한
                절차와 방법에 따라 요청한 경우
              </li>
            </UnorderedList>
          </li>
          <li>
            한편, 이용자가 커뮤니티 게시판에 게시한 글·댓글, 공개로 설정한 프로필
            정보는 서비스 내 다른 이용자에게 공개될 수 있습니다. 이는 제3자
            제공이 아닌 서비스 본질에 따른 공개입니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="제5조 (개인정보 처리의 위탁)">
        <OrderedList>
          <li>
            운영자는 서비스의 서버를 외부 호스팅 업체에 위탁하지 않고, 운영자가
            직접 관리하는 <strong>국내 소재 자체 서버</strong>에서 운영합니다.
            따라서 현재 서버 인프라에 대한 개인정보 처리 위탁은 발생하지
            않습니다.
          </li>
          <li>
            서비스 제공에 필요한 일부 기능은 아래와 같이 외부에 위탁할 수 있으며,
            위탁사 및 위탁 항목은 확정되는 대로 본 방침을 갱신하여 공지합니다.
            <PolicyTable
              headers={["위탁 업무", "위탁사", "위탁 항목"]}
              rows={[
                [
                  "푸시 알림 발송",
                  "Google Firebase (FCM)",
                  "FCM 토큰, 디바이스 정보",
                ],
                [
                  "소셜 로그인 인증",
                  "Google LLC, Apple Inc., Kakao Corp.",
                  "소셜 계정 식별자, 인증 토큰",
                ],
                [
                  "통계 분석",
                  "(추후 도입 시 공지, 예: Firebase Analytics)",
                  "서비스 이용기록, 기기 정보",
                ],
              ]}
            />
          </li>
          <li>
            향후 외부 호스팅·클라우드 서비스를 도입할 경우, 도입 전에 본 방침을
            개정하여 위탁사·위탁 항목을 공지한 후 처리를 위탁합니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="제6조 (개인정보의 파기 절차 및 방법)">
        <OrderedList>
          <li>
            보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.
          </li>
          <li>
            <strong>전자적 파일 형태의 정보:</strong> 복구 및 재생이 불가능한
            방법으로 영구 삭제합니다.
          </li>
          <li>
            <strong>종이 문서 형태의 정보:</strong> 분쇄 또는 소각합니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="제7조 (이용자 및 법정대리인의 권리)">
        <OrderedList>
          <li>
            이용자는 언제든 다음 권리를 행사할 수 있습니다.
            <UnorderedList>
              <li>개인정보 열람·정정·삭제 요청</li>
              <li>처리 정지 요구</li>
              <li>수집·이용 등에 대한 동의 철회</li>
              <li>회원 탈퇴</li>
            </UnorderedList>
          </li>
          <li>
            위 권리는 앱 내 [설정] 메뉴 또는 운영자
            이메일(jiujitsulab.team@gmail.com)을 통해 행사할 수 있으며, 운영자는
            지체 없이 조치합니다.
          </li>
          <li>
            운영자는 만 14세 미만 아동의 회원가입을 허용하지 않으며, 가입 후 만
            14세 미만임이 확인된 경우 즉시 해당 계정 및 관련 개인정보를
            파기합니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="제8조 (광고 식별자 및 푸시 알림 운영)">
        <OrderedList>
          <li>
            본 서비스는 모바일 앱으로서 일반적인 의미의 웹 쿠키를 사용하지
            않습니다. 다만 서비스 이용 분석 및 광고 효율 측정을 위해 단말의 광고
            식별자(IDFA 등)를 활용할 수 있습니다.
          </li>
          <li>
            이용자는 단말 설정(예: iOS 「설정 &gt; 개인정보 보호 및 보안 &gt;
            추적」)을 통해 광고 식별자의 추적을 허용하지 않거나 재설정할 수
            있습니다.
          </li>
          <li>
            푸시 알림은 단말 설정 또는 앱 내 [설정 &gt; 알림] 메뉴에서 언제든
            수신을 해제할 수 있습니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="제9조 (개인정보의 안전성 확보 조치)">
        <p>
          운영자는 이용자의 개인정보 보호를 위해 다음과 같은 조치를 취합니다.
        </p>
        <OrderedList>
          <li>
            <strong>관리적 조치:</strong> 내부 관리 계획 수립 및 시행, 개인정보
            취급자 최소화 및 교육
          </li>
          <li>
            <strong>기술적 조치</strong>
            <UnorderedList>
              <li>서비스와 서버 간 통신 구간 암호화(HTTPS/TLS)</li>
              <li>인증 토큰의 단말 Keychain 등 안전한 저장소 사용</li>
              <li>서버 접근 권한 관리 및 접속 기록의 보관·점검</li>
              <li>운영체제 및 주요 소프트웨어에 대한 보안 업데이트 적용</li>
              <li>정기적인 데이터 백업 및 백업본 암호화</li>
            </UnorderedList>
          </li>
          <li>
            <strong>물리적 조치:</strong> 개인정보가 저장되는 서버는 운영자가
            직접 관리하는 국내 사무 공간에 위치하며, 외부인의 물리적 접근을
            통제합니다.
          </li>
        </OrderedList>
      </Section>

      <Section title="제10조 (개인정보 보호책임자)">
        <p>
          운영자는 개인정보 처리에 관한 업무를 총괄하여 책임지며, 개인정보 처리와
          관련한 이용자의 문의·불만·피해 구제 등을 처리하기 위해 아래와 같이
          개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <UnorderedList>
          <li>
            <strong>개인정보 보호책임자:</strong> 박현선
          </li>
          <li>
            <strong>이메일:</strong> suniapps919@gmail.com
          </li>
        </UnorderedList>
      </Section>

      <Section title="제11조 (개인정보처리방침의 변경)">
        <p>
          본 개인정보처리방침은 법령 또는 서비스 정책의 변경에 따라 개정될 수
          있으며, 변경 시 시행일자 7일 전(이용자에게 불리한 변경의 경우 30일
          전)에 서비스 내 공지사항을 통해 고지합니다.
        </p>
      </Section>

      <Section title="부칙">
        <p>본 방침의 시행일은 추후 공지합니다.</p>
      </Section>
    </PolicyDocument>
  );
}
