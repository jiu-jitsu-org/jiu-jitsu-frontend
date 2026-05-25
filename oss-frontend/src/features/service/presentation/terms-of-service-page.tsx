/**
 * Presentation page for the OSS service terms of service.
 *
 * Intentionally text-only and static — the document is plain prose
 * structured by article headings. Kept in the feature layer alongside
 * other service-related presentation pages.
 */
export function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <article className="mx-auto w-full max-w-3xl leading-7">
        <header className="border-b border-zinc-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            서비스 이용약관
          </h1>
          <p className="mt-3 text-sm text-zinc-600">서비스명: OSS</p>
        </header>

        <p className="mt-6 text-sm leading-7 text-zinc-700">
          본 약관은 「JiuJitsuLab」(이메일: jiujitsulab.team@gmail.com, 이하
          &quot;운영자&quot;)이 제공하는 주짓수 커뮤니티 서비스 「OSS」(이하
          &quot;서비스&quot;)의 이용과 관련하여 운영자와 이용자 간의
          권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>

        <Section title="제1조 (목적)">
          <p>
            본 약관은 이용자가 서비스 이용 시 준수해야 할 사항 및 운영자와
            이용자의 권리·의무를 규정합니다.
          </p>
        </Section>

        <Section title="제2조 (정의)">
          <OrderedList>
            <li>
              &quot;서비스&quot;란 이용자가 주짓수 관련 커뮤니티 활동(게시글·댓글
              등), 프로필·대회 기록·소속 도장 정보 관리, 지도자 인증, 운영자가
              제공하는 콘텐츠 열람 등을 이용할 수 있는 모바일 플랫폼을
              의미합니다.
            </li>
            <li>
              &quot;이용자&quot;란 본 약관에 동의하고 서비스에 가입하여 이용하는
              회원을 말합니다.
            </li>
            <li>
              &quot;이용자 콘텐츠&quot;란 게시글, 댓글, 이미지, 닉네임, 프로필
              이미지, 벨트·그랄, 체중, 성별, 소속 도장, 대회 기록, 선호
              기술·포지션, 지도자 인증 자료 등 이용자가 서비스에 등록·게시한
              정보 일체를 의미합니다.
            </li>
            <li>
              &quot;운영자 콘텐츠&quot;란 운영자가 서비스 내에서 직접
              제작·편집하여 제공하는 게시물, 영상, 이미지, 가이드 등 일체의
              정보를 의미합니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <OrderedList>
            <li>본 약관은 서비스 화면 또는 앱 내에 게시함으로써 효력이 발생합니다.</li>
            <li>
              운영자는 관련 법령을 준수하는 범위 내에서 약관을 변경할 수
              있으며, 변경 시 최소 7일(이용자에게 불리한 변경의 경우 30일) 전에
              서비스 내에 공지합니다.
            </li>
            <li>
              이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고
              회원 탈퇴할 수 있습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제4조 (회원가입)">
          <OrderedList>
            <li>
              이용자는 Google, Apple, Kakao 계정을 통한 소셜 로그인으로
              회원가입할 수 있으며, 가입 절차는 약관 동의 및 닉네임 설정으로
              완료됩니다.
            </li>
            <li>만 14세 미만은 회원가입을 할 수 없습니다.</li>
            <li>
              운영자는 회원가입 신청이 다음에 해당하는 경우 승낙을 거절하거나
              사후에 회원 자격을 제한·박탈할 수 있습니다.
              <UnorderedList>
                <li>타인의 정보(소셜 계정 포함)를 도용한 경우</li>
                <li>
                  허위 정보를 제공한 경우(벨트, 대회 기록, 도장 소속, 지도자
                  자격 등)
                </li>
                <li>커뮤니티 질서를 해칠 우려가 있다고 판단되는 경우</li>
              </UnorderedList>
            </li>
          </OrderedList>
        </Section>

        <Section title="제5조 (서비스 제공)">
          <p>
            서비스는 주짓수 커뮤니티를 중심으로 다음과 같은 기능을 제공합니다.
          </p>
          <OrderedList>
            <li>
              <strong>주짓수 커뮤니티 게시판</strong> — 이용자 간 게시글·댓글
              작성, 좋아요·공유 등 소통 기능
            </li>
            <li>
              <strong>운영자 제공 콘텐츠</strong> — 운영자가 제작·큐레이션한
              주짓수 관련 게시물·영상·가이드 등의 열람
            </li>
            <li>
              <strong>프로필 관리</strong> — 닉네임, 프로필 이미지, 벨트·그랄,
              체중, 성별 등 등록 및 공개 수준 설정
            </li>
            <li>
              <strong>소속 도장 정보 등록 및 공유</strong>
            </li>
            <li>
              <strong>대회 기록 등록 및 공유</strong>
            </li>
            <li>
              <strong>선호 기술·포지션·서브미션 등 스타일 정보 관리</strong>
            </li>
            <li>
              <strong>관장·사범(지도자) 인증</strong> 신청 및 인증 프로필 노출
            </li>
            <li>
              <strong>푸시 알림 발송</strong> (서비스 공지·커뮤니티 활동 알림 등)
            </li>
            <li>그 밖에 운영자가 추가로 제공하는 부가 기능</li>
          </OrderedList>
        </Section>

        <Section title="제6조 (서비스의 변경 및 중단)">
          <OrderedList>
            <li>운영자는 서비스 개선을 위해 기능을 추가·변경할 수 있습니다.</li>
            <li>
              천재지변, 시스템 점검, 외부 인증 제공자(Google, Apple, Kakao) 장애
              등 부득이한 사유로 서비스 제공이 일시 중단될 수 있습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제7조 (이용자의 의무)">
          <OrderedList>
            <li>
              이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다.
              <UnorderedList>
                <li>법령 또는 본 약관을 위반하는 행위</li>
                <li>타인의 개인정보 또는 소셜 계정 도용</li>
                <li>
                  허위 사실 등록·유포(벨트, 대회 기록, 지도자 자격 등 포함)
                </li>
                <li>
                  본인이 소속되지 않은 도장 또는 타인의 도장을 무단으로 자신의
                  소속으로 등록하는 행위
                </li>
                <li>지도자 인증 시 위·변조된 자료를 제출하는 행위</li>
                <li>
                  게시글·댓글·닉네임·프로필 텍스트 등에서의 욕설·비방·모욕·차별
                  표현
                </li>
                <li>저작권·초상권 침해(프로필 이미지 및 게시물 포함)</li>
                <li>음란물, 폭력물 게시</li>
                <li>과도한 광고 또는 상업적 홍보, 스팸성 게시·댓글</li>
                <li>운영자 콘텐츠를 무단으로 복제·배포·2차 가공하는 행위</li>
              </UnorderedList>
            </li>
            <li>
              이용자의 위반 행위로 인해 발생한 모든 책임은 이용자 본인에게
              있으며, 운영자는 해당 책임을 부담하지 않습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제8조 (콘텐츠 및 프로필 관리)">
          <OrderedList>
            <li>
              이용자가 등록한 이용자 콘텐츠가 법령, 본 약관 또는 커뮤니티
              가이드라인에 위반될 경우 운영자는 사전 통지 없이 해당
              게시물·항목을 비공개 처리·삭제하거나 이용을 제한할 수 있습니다.
            </li>
            <li>
              운영자는 지도자 인증 자료가 위·변조되었거나 자격이 더 이상
              유효하지 않은 것으로 확인된 경우 인증을 회수할 수 있습니다.
            </li>
            <li>
              삭제·제한·인증 회수 기준은 운영자가 별도로 고지하는 커뮤니티
              가이드라인에 따릅니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제9조 (저작권)">
          <OrderedList>
            <li>이용자 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다.</li>
            <li>
              운영자는 서비스 운영, 화면 노출, 검색·추천 기능 제공 및 서비스
              홍보 범위 내에서 이용자 콘텐츠를 별도의 대가 없이 사용할 수
              있습니다. 단, 상업적 2차 가공 또는 제3자에 대한 별도 제공은
              이용자의 동의를 받습니다.
            </li>
            <li>
              운영자 콘텐츠의 저작권 및 기타 일체의 권리는 운영자에게
              귀속되며, 이용자는 개인적·비상업적 열람 목적 외에 이를
              복제·배포·전송·2차 가공할 수 없습니다.
            </li>
            <li>
              저작권 침해 등 분쟁이 발생할 경우 1차적인 책임은 해당 콘텐츠를
              등록한 이용자에게 있습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제10조 (회원 탈퇴 및 이용 제한)">
          <OrderedList>
            <li>
              이용자는 앱 내 [설정] 메뉴를 통해 언제든 회원 탈퇴할 수 있습니다.
            </li>
            <li>
              탈퇴 시 개인정보 및 등록 정보는 개인정보처리방침이 정하는 바에
              따라 즉시 파기되며, 다만 부정 이용 방지 및 관련 법령에 따른 보존
              의무가 있는 항목은 일정 기간 보관될 수 있습니다.
            </li>
            <li>
              운영자는 이용자가 본 약관을 위반한 경우 사전 통지 후(긴급한 경우
              즉시) 이용을 정지하거나 계정을 해지할 수 있습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제11조 (푸시 알림 및 마케팅 정보)">
          <OrderedList>
            <li>
              운영자는 서비스 공지, 커뮤니티 활동(댓글·좋아요 등) 관련 알림 등
              운영상 필요한 알림을 푸시로 발송할 수 있습니다.
            </li>
            <li>
              마케팅 및 광고성 정보의 수신은 이용자의 별도 동의를 받아
              발송되며, 이용자는 언제든 앱 내 알림 설정에서 수신을 해제할 수
              있습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제12조 (면책조항)">
          <OrderedList>
            <li>
              운영자는 이용자 간 분쟁(커뮤니티 게시판 내 분쟁 포함)에 개입하지
              않으며, 그에 따른 책임을 지지 않습니다.
            </li>
            <li>
              이용자가 서비스를 통해 알게 된 다른 이용자, 도장, 지도자와의
              오프라인 만남, 스파링, 세미나, 대회 참가 등에서 발생한 부상·사고에
              대해 운영자는 일체 책임을 지지 않습니다.
            </li>
            <li>
              등록된 도장·지도자 정보의 최종 검증 책임은 이를 이용하는
              이용자에게 있으며, 지도자 인증 마크는 제출된 자료에 대한 운영자의
              확인을 의미할 뿐 해당 지도자의 자격 유효성·도장의 운영 품질을
              보증하지 않습니다.
            </li>
            <li>
              운영자 콘텐츠는 일반적인 정보 제공을 목적으로 하며, 이를 실제
              훈련에 적용함에 따라 발생하는 부상·사고에 대해 운영자는 책임지지
              않습니다.
            </li>
            <li>
              운영자는 Google, Apple, Kakao 등 외부 인증 제공자의 장애로 인한
              로그인 불가 등에 대해 책임지지 않습니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="제13조 (준거법 및 관할)">
          <OrderedList>
            <li>본 약관은 대한민국 법령에 따라 해석됩니다.</li>
            <li>
              본 약관 또는 서비스 이용과 관련한 분쟁의 관할법원은 민사소송법에
              따른 관할법원으로 합니다.
            </li>
          </OrderedList>
        </Section>

        <Section title="부칙">
          <p>본 약관의 시행일은 추후 공지합니다.</p>
        </Section>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 marker:text-zinc-500">
      {children}
    </ol>
  );
}

function UnorderedList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-zinc-400">
      {children}
    </ul>
  );
}
