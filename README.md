# e편한세상 분당 퍼스트빌리지 입주예정자 협의회 — 웹사이트 구조 설명

## 개요

단일 HTML 파일 기반의 정적 웹사이트로, **e편한세상 분당 퍼스트빌리지** 입주예정자 협의회 정보를 안내하는 페이지입니다. 외부 라이브러리 없이 순수 HTML/CSS/JavaScript로 작성되었습니다.

---

## 파일 구조

```
e-park-hansang-bundang/
├── index.html          # 메인 페이지 (단일 파일)
├── README.md           # 이 파일
└── img/
    ├── elife_logo.svg  # 협의회 로고 (84×42px, 흰색 fill)
    ├── aerial.png      # 조감도 (2MB)
    ├── perspective.png # 파사드/현황 이미지 (1.4MB)
    ├── siteplan.png    # 부지 계획도 (933KB)
    ├── 51A.png         # 51A형 평면도 (131KB)
    ├── 55A.png         # 55A형 평면도 (142KB)
    ├── 55B.png         # 55B형 평면도 (138KB)
    ├── 59A.png         # 59A형 평면도 (144KB)
    └── 59T.png         # 59T형 평면도 (176KB)
```

---

## 페이지 구조 (HTML 섹션별 설명)

### 1. Header (헤더)
- **로고**: `img/elife_logo.svg` — 흰색 fill, 84×42px
- **페이지 제목**: "e편한세상 분당 퍼스트빌리지 입주예정자 협의회"
- **내비게이션**: 홈, 입주예정자, 평면도, 갤러리, 가입절차, 연락처
- 모바일 햄버거 메뉴 지원

### 2. Hero Section (메인 배너)
- 배경 이미지: `img/aerial.png` (조감도, 2MB)
- **D-Day 카운트다운** — 세 가지 목표일:
  | ID | 목표일 | 의미 |
  |-----|--------|------|
  | `dday1` | 2026-07-03 | 입주 예정일 (추정) |
  | `dday2` | 2026-07-20 | 입주 예정일 (추정) |
  | `dday3` | 2029-02-01 | 완공 예정일 (추정) |
- 매분 자동으로 D-Day 값 갱신

### 3. 입주예정자 안내 섹션
- **분양가 정보**: 8억 3,400만 원 ~ 11억 1,500만 원
- **입주 예정**: 2026년 7월
- **평형별 호수**:
  | 평형 | 호수 수 |
  |------|---------|
  | 51A | 413호 |
  | 55A | 468호 |
  | 55B | 254호 |
  | 59A | 255호 |
  | 59T | 10호 |

### 4. 평면도 섹션
- 5개 평형별 카드 (51A, 55A, 55B, 59A, 59T)
- 각 카드 클릭 시 **모달 팝업**으로 평면도 이미지 표시
- 평면도 파일명 매핑:
  ```
  51A → img/51A.png
  55A → img/55A.png
  55B → img/55B.png
  59A → img/59A.png
  59T → img/59T.png
  ```
- 모달 닫기: X 버튼 / 배경 클릭 / ESC 키

### 5. 갤러리 섹션
- **부지 현황** (`img/siteplan.png`): 부지 계획도
- **조감도** (`img/aerial.png`): 전체 조감도
- **파사드/현황** (`img/perspective.png`): 외관 전망
- 이미지 클릭 시 확대 모달 팝업 (캡션 표시)
- 모달 닫기: X 버튼 / 배경 클릭 / ESC 키

### 6. 가입절차 섹션 (5단계)
| 단계 | 내용 |
|------|------|
| 1 | 가입신청 (가입하기 버튼 → 네이버 카페 링크) |
| 2 | 가입확인 |
| 3 | 회원활동 |
| 4 | 임원선출 |
| 5 | 정식발족 |

각 단계에 설명 텍스트와 아이콘 포함.

### 7. 연락처 섹션
- **카페**: [네이버 카페](https://cafe.naver.com/naksangheemang)
- **회칙**: [네이버 카페 회칙](https://cafe.naver.com/f-e/cafes/30587172/articles/432)
- 아이콘 + 텍스트로 표시

### 8. Footer (푸터)
- 저작권 표시: "© 2026 e편한세상 분당 퍼스트빌리지 입주예정자 협의회. All rights reserved."

---

## CSS 스타일 특징

### 디자인 시스템
- **메인 컬러**: `#1a5276` (진한 남색)
- **두 번째 컬러**: `#2980b9` (밝은 남색)
- **그라데이션**: `linear-gradient(135deg, #1a5276, #2980b9)`
- **서체**: `system-ui, -apple-system, sans-serif` (네이티브 폰트)
- **반응형**: 모바일(768px 이하) 대응

### 주요 CSS 클래스
| 클래스 | 용도 |
|--------|------|
| `.container` | 중앙 정렬 컨테이너 (max-width: 1200px) |
| `.section` | 섹션 공통 스타일 (padding, background) |
| `.section-title` | 섹션 제목 (하단 테두리 장식) |
| `.fade-in` | 스크롤 시 페이드인 애니메이션 요소 |
| `.modal` | 모달 팝업 배경 |
| `.modal-content` | 모달 내용 박스 |
| `.close-btn` | 모달 닫기 버튼 (×) |
| `.floor-card` | 평면도 카드 |
| `.gallery-item` | 갤러리 이미지 아이템 |
| `.step-card` | 가입절차 단계 카드 |
| `.contact-card` | 연락처 카드 |

---

## JavaScript 기능

### 1. 모바일 네비게이션 토글
```js
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('mainNav').classList.toggle('active');
});
```
- 햄버거 버튼 클릭 시 네비게이션 펼침/접음
- 링크 클릭 시 자동 접힘

### 2. 스크롤 페이드인 애니메이션
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
```
- `.fade-in` 요소가 뷰포트에 진입 시 `.visible` 클래스 추가
- `threshold: 0.1` — 10% 보임 기준

### 3. D-Day 카운트다운
```js
function updateDDay() {
  const now = new Date();
  // 2026-07-03, 2026-07-20, 2029-02-01 기준 계산
  // "X일" 또는 "D-Day" 반환
}
setInterval(updateDDay, 60000); // 매분 갱신
```

### 4. 평면도 모달
```js
function openFloorPlan(type) {
  // img/{type}.png 로드, 모달 표시, 스크롤 잠금
}
function closeFloorPlan() {
  // 모달 숨김, 스크롤 해제
}
```
- ESC 키, 배경 클릭, × 버튼으로 닫기 지원

### 5. 갤러리 모달
```js
function openGalleryModal(src, caption) {
  // 이미지 + 캡션 표시, 모달 활성화
}
function closeGalleryModal() {
  // 모달 비활성화
}
```

### 6. 전역 ESC 키 처리
```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // 평면도 모달 + 갤러리 모달 동시 닫기
  }
});
```

---

## 반응형 breakpoints

| 장치 | 최대 너비 | 주요 변경사항 |
|------|-----------|---------------|
| 모바일 | ≤768px | 햄버거 메뉴, 세로 레이아웃, 그리드 1열 |
| 태블릿/데스크톱 | >768px | 전체 네비게이션, 가로 그리드 |

---

## 외부 링크

| 항목 | URL |
|------|-----|
| 네이버 카페 | https://cafe.naver.com/naksangheemang |
| 회칙 | https://cafe.naver.com/f-e/cafes/30587172/articles/432 |

---

## 기술 스택 요약

| 항목 | 사용 기술 |
|------|-----------|
| 마크업 | HTML5 (시맨틱 태그: header, nav, section, footer) |
| 스타일 | CSS3 (Flexbox, Grid, CSS Variables, Gradients) |
| 인터랙션 | Vanilla JavaScript (ES6+, IntersectionObserver API) |
| 외부 의존성 | **없음** — CDN 또는 프레임워크 미사용 |
| 배포 | 정적 파일 호스팅 (GitHub Pages 등) |
