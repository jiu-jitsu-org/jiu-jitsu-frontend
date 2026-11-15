import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import * as Icons from "@/shared/ui/icons";

import {
  Anatomy,
  Code,
  DocPage,
  DocTable,
  Dot,
  Fold,
  H,
  MarkerLegend,
  Measure,
  P,
  Pair,
  Stage,
  Sub,
  USAGE_DATE,
} from "../doc-kit";

const D = "icon-button";

export function IconButtonDoc() {
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `18개 파일 · 23번 (${USAGE_DATE})` },
        { label: "색", value: 2 },
        { label: "크기", value: 3 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        아이콘 하나만 든 버튼. 아이콘만 보여 뜻을 글로 말해 줄 이름(<Code>aria-label</Code>)이 꼭
        필요하다 — 빼면 타입 검사에서 막힌다. 기본값은 <Code>ghost</Code> · <Code>m</Code>.
      </P>
      <Stage>
        <IconButton aria-label="뒤로 가기">
          <Icons.BackArrowIcon />
        </IconButton>
        <IconButton aria-label="알림">
          <Icons.BellIcon />
        </IconButton>
        <IconButton aria-label="더보기">
          <Icons.MoreVerticalIcon />
        </IconButton>
      </Stage>

      <H doc={D} id="anatomy">해부도</H>
      <Stage className="gap-16">
        <Anatomy
          marks={[
            { top: "0%", left: "50%" },
            { top: "50%", left: "100%" },
          ]}
        >
          <IconButton variant="tint" size="l" aria-label="닫기">
            <Icons.CloseIcon />
          </IconButton>
        </Anatomy>
        <Anatomy start={3} marks={[{ top: "100%", left: "50%" }]}>
          <IconButton aria-label="뒤로 가기" className="bg-surface-container-pressed">
            <Icons.BackArrowIcon />
          </IconButton>
        </Anatomy>
      </Stage>
      <MarkerLegend
        items={[
          { name: "아이콘", note: "24가 기본. 호출부가 children으로 넣는다." },
          { name: "누를 자리(바탕)", note: "tint는 늘 옅은 파랑 네모(모서리 10)." },
          { name: "누르는 동안 면", note: "ghost는 평소 바탕이 없고 누를 때만 둥근 면." },
        ]}
      />

      <H doc={D} id="variants">변형</H>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-20 bg-surface-field-subtle p-4">
          <div className="flex h-14 items-center justify-center gap-2">
            <IconButton aria-label="뒤로 가기">
              <Icons.BackArrowIcon />
            </IconButton>
            <IconButton aria-label="공유">
              <Icons.ShareIcon />
            </IconButton>
          </div>
          <div>
            <p className="font-mono text-label-m text-text-primary">
              ghost <span className="ml-1 text-text-tertiary">18번</span>
            </p>
            <p className="text-label-m text-text-tertiary">앱바 뒤로·⋮·알림, 댓글 입력 바</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-20 bg-surface-field-subtle p-4">
          <div className="flex h-14 items-center justify-center gap-2">
            <IconButton variant="tint" aria-label="뒤로 가기">
              <Icons.BackArrowIcon />
            </IconButton>
            <IconButton variant="tint" aria-label="닫기">
              <Icons.CloseIcon />
            </IconButton>
          </div>
          <div>
            <p className="font-mono text-label-m text-text-primary">
              tint <span className="ml-1 text-text-tertiary">5번</span>
            </p>
            <p className="text-label-m text-text-tertiary">글쓰기·사진 편집 앱바, 사진 보기 닫기</p>
          </div>
        </div>
      </div>

      <H doc={D} id="sizes">크기</H>
      <P>잰 값(px). 아이콘은 크기와 상관없이 24 그대로다.</P>
      <Stage className="gap-10">
        <Measure label="s · 3번" pick={["폭", "높이", "모서리"]}>
          <IconButton variant="tint" size="s" aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
        </Measure>
        <Measure label="m · 16번" pick={["폭", "높이", "모서리"]}>
          <IconButton variant="tint" size="m" aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
        </Measure>
        <Measure label="l · 4번" pick={["폭", "높이", "모서리"]}>
          <IconButton variant="tint" size="l" aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
        </Measure>
      </Stage>

      <H doc={D} id="states">상태</H>
      <DocTable
        cols="100px repeat(3, minmax(0, 1fr))"
        head={["", "기본", "누르는 동안(고정 표시)", "비활성"]}
        rows={[
          [
            <span key="n" className="font-mono text-label-m">
              ghost
            </span>,
            <IconButton key="d" aria-label="알림">
              <Icons.BellIcon />
            </IconButton>,
            <IconButton key="p" aria-label="알림" className="bg-surface-container-pressed">
              <Icons.BellIcon />
            </IconButton>,
            <span key="x" className="text-label-m text-text-tertiary">
              비활성 모양 없음
            </span>,
          ],
          [
            <span key="n" className="font-mono text-label-m">
              tint
            </span>,
            <IconButton key="d" variant="tint" aria-label="닫기">
              <Icons.CloseIcon />
            </IconButton>,
            <IconButton
              key="p"
              variant="tint"
              aria-label="닫기"
              style={{ background: "var(--button-tint-pressed-bg)" }}
            >
              <Icons.CloseIcon />
            </IconButton>,
            <IconButton key="x" variant="tint" aria-label="닫기" disabled>
              <Icons.CloseIcon />
            </IconButton>,
          ],
        ]}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <Sub>뜻이 하나로 읽히는 아이콘만</Sub>
      <Pair
        good={
          <IconButton aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
        }
        goodNote="뒤로·닫기·더보기처럼 어디서나 같은 뜻인 아이콘."
        bad={
          <IconButton aria-label="태그">
            <Icons.HashIcon />
          </IconButton>
        }
        badNote="# 하나만 보고는 태그인지 카테고리인지 모른다 — 글자 버튼으로."
      />
      <Sub>한 줄에 한 가지 색</Sub>
      <Pair
        good={
          <div className="flex gap-1">
            <IconButton aria-label="공유">
              <Icons.ShareIcon />
            </IconButton>
            <IconButton aria-label="더보기">
              <Icons.MoreVerticalIcon />
            </IconButton>
          </div>
        }
        goodNote="앱바 오른쪽 아이콘은 모두 ghost."
        bad={
          <div className="flex gap-1">
            <IconButton variant="tint" aria-label="공유">
              <Icons.ShareIcon />
            </IconButton>
            <IconButton aria-label="더보기">
              <Icons.MoreVerticalIcon />
            </IconButton>
          </div>
        }
        badNote="하나만 tint면 그 버튼만 튄다."
      />

      <H doc={D} id="related">비슷한 부품</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["부품", "언제"]}
        rows={[
          ["IconButton", "아이콘만으로 뜻이 통하는 자리 — 앱바, 입력 바"],
          ["Button", "동작을 글로 말해야 할 때"],
          ["BackButton", "개발용 화면 왼쪽 위 뒤로(앱 화면 앱바에는 쓰지 않는다)"],
          [
            <Code key="r">REACTION_PRESS_MOTION</Code>,
            "좋아요·저장처럼 켜고 끄는 반응 버튼 — 커뮤니티 안에 따로 있다",
          ],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="80px repeat(3, minmax(0, 1fr))"
        head={["variant", "아이콘", "바탕", "누름"]}
        rows={[
          [
            "ghost",
            <Dot key="i" token="icon-primary" withName />,
            <span key="b" className="text-label-m text-text-tertiary">
              없음
            </span>,
            <Dot key="p" token="surface-container-pressed" withName />,
          ],
          [
            "tint",
            <Dot key="i" token="button-tint-default-text" withName />,
            <Dot key="b" token="button-tint-default-bg" withName />,
            <Dot key="p" token="button-tint-pressed-bg" withName />,
          ],
        ]}
      />
      <DocTable
        cols="80px repeat(3, minmax(0, 1fr))"
        head={["크기", "칸", "모서리 ghost", "모서리 tint"]}
        rows={[
          ["s", "36 (size-9)", "둥글게", "10"],
          ["m", "40 (size-10)", "둥글게", "10"],
          ["l", "44 (size-11)", "둥글게", "10"],
        ]}
      />

      <H doc={D} id="oss">오스에서</H>
      <P>
        앱 웹뷰의 앱바는 네이티브 앱바와 나란히 보인다. 그래서 ghost의 누름 면은 iOS처럼 둥근 옅은 면이
        아이콘 뒤에만 깔린다. 누를 자리는 최소 36 — 손가락이 닿는 크기를 지키려고 아이콘보다 크게 둔다.
      </P>
      <Stage>
        <div className="flex w-full max-w-sm items-center justify-between rounded-15 bg-surface-container px-1 py-1">
          <IconButton aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
          <p className="text-title-3 text-text-primary">글쓰기</p>
          <Button variant="tint" size="s">
            등록
          </Button>
        </div>
      </Stage>

      <Fold title="예전 /ds의 IconButton 견본 — 크기 s 36 · m 40 · l 44">
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <IconButton variant="tint" size="s" aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
          <IconButton variant="tint" size="m" aria-label="뒤로 가기">
            <Icons.BackArrowIcon />
          </IconButton>
          <IconButton variant="tint" size="l" aria-label="닫기">
            <Icons.CloseIcon />
          </IconButton>
        </div>
      </Fold>
    </DocPage>
  );
}
