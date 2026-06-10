# index.html 구조 설명 자료

## 개요

**e편한세상 분당 퍼스트빌리지 입주예정자 협의회** 웹사이트  
단일 HTML 파일 (SPA 형태) — HTML + CSS + JavaScript 모두 인라인 포함

---

## 전체 구조 (섹션 순서)

```
┌─────────────────────────────────────────┐
│  HEADER / NAV (고정 헤더)               │
├─────────────────────────────────────────┤
│  HERO (메인 배너 + 카운트다운)           │
├─────────────────────────────────────────┤
│  ABOUT (협의회 소개)                     │
├─────────────────────────────────────────┤
│  PLANS (평형 안내 - 5개 타입)            │
├─────────────────────────────────────────┤
│  PROCEDURES (가입 절차 - 5단계 타임라인)  │
├─────────────────────────────────────────┤
│  COMMUNITY (커뮤니티 3카드)              │
├─────────────────────────────────────────┤
│  GALLERY (갤러리 - 모달 팝업)            │
├─────────────────────────────────────────┤
│  NEWS (소식)                             │
├─────────────────────────────────────────┤
│  CONTACT (문의하기 - 4카드)              │
├─────────────────────────────────────────┤
│  FOOTER                                  │
└─────────────────────────────────────────┘
```

---

## 1. HEADER / NAV

| 항목 | 내용 |
|------|------|
| **로고** | `img/elife_logo.svg` — 흰색 fill, 84×42px, 배경 투명 |
| **네비게이션** | 소개 · 평형안내 · 절차 · 커뮤니티 · 문의 (5개 링크) |
| **스크롤 효과** | scrollY > 50px 시 `.scrolled` 클래스 추가 (배경 어두워짐 + 그림자) |
| **액티브 링크** | `IntersectionObserver` 기반 — 현재 섹션에 해당하는 nav 링크에 `.active` 적용 |
| **HTML 구조** | `<header id="header">` → `<nav>` → `<ul>` → `<li><a href="#id">` |

---

## 2. HERO 섹션

| 요소 | 설명 |
|------|------|
| **배경** | 그라데이션 오버레이 + 배경 이미지 |
| **타이틀** | "e편한세상 분당 퍼스트빌리지 입주예정자 협의회" |
| **카운트다운** | 2개 — 입주 D-Day / 남양 D-Day |
| **CTA 버튼** | "협의회 가입하기" → `#procedures`로 스크롤 |
| **HTML 구조** | `<section id="hero">` → `.hero-content` → `.hero-title`, `.hero-countdowns` |

---

## 3. ABOUT 섹션 (협의회 소개)

| 항목 | 내용 |
|------|------|
| **레이아웃** | 2컬럼 — 왼쪽 이미지/아이콘, 오른쪽 텍스트 |
| **내용** | 협의회 목적, 활동 방향, 비전 |
| **특징** | `.about-feature` — 아이콘 + 제목 + 설명 리스트 |
| **HTML 구조** | `<section id="about">` → `.about-grid` → `.about-image`, `.about-text` |

---

## 4. PLANS 섹션 (평형 안내)

| 평형 타입 | 호수 수 |
|-----------|---------|
| **51A** | 413호 |
| **55A** | 468호 |
| **55B** | 254호 |
| **59A** | 255호 |
| **59T** | 10호 |

- **레이아웃**: 그리드 (`.plans-grid`) — 반응형 (3컬럼 → 2컬럼 → 1컬럼)
- **카드 구조**: 평형명 → 면적 → 호수 수 → 상세 버튼
- **HTML 구조**: `<section id="plans">` → `.plans-grid` → `.plan-card` × 5

---

## 5. PROCEDURES 섹션 (가입 절차)

| 단계 | 내용 |
|------|------|
| **1단계** | 가입 신청 |
| **2단계** | 회원 확인 |
| **3단계** | 가입비 납부 |
| **4단계** | 활동 시작 |
| **5단계** | 정회원 완료 |

- **레이아웃**: 수직 타임라인 (`.timeline`) — 왼쪽 날짜/단계, 오른쪽 내용
- **연결선**: 중앙에 수직 라인으로 단계 연결
- **HTML 구조**: `<section id="procedures">` → `.timeline` → `.timeline-item` × 5

---

## 6. COMMUNITY 섹션 (커뮤니티)

| 카드 | 아이콘 | 내용 |
|------|--------|------|
| **네트워크** | 사용자 아이콘 | 회원 간 연결 |
| **정보공유** | 문서 아이콘 | 다양한 정보 공유 |
| **소통** | 대화 아이콘 | 활발한 소통 |

- **레이아웃**: 3컬럼 그리드 (`.community-grid`)
- **HTML 구조**: `<section id="community">` → `.community-grid` → `.community-card` × 3

---

## 7. GALLERY 섹션 (갤러리)

- **레이아웃**: 이미지 그리드 (`.gallery-grid`)
- **팝업 기능**: 이미지 클릭 시 모달 팝업 (`.modal`)
- **닫기 방법**: X 버튼 / ESC 키 / 배경 클릭
- **HTML 구조**: `<section id="gallery">` → `.gallery-grid` → `.gallery-item` → `.modal`

---

## 8. NEWS 섹션 (소식)

- **레이아웃**: 뉴스 리스트 (`.news-list`)
- **구조**: 각 항목 — 날짜 + 제목 + 요약
- **현재 상태**: 플레이스홀더 (실제 연동 전)
- **HTML 구조**: `<section id="news">` → `.news-list` → `.news-item`

---

## 9. CONTACT 섹션 (문의하기)

| 카드 | 내용 |
|------|------|
| **전화** | 연락처 정보 |
| **이메일** | 이메일 주소 |
| **카카오톡** | 카카오톡 오픈채팅 링크 |
| **네이버 카페** | https://cafe.naver.com/naksangheemang |

- **레이아웃**: 2×2 그리드 (`.contact-grid`)
- **HTML 구조**: `<section id="contact">` → `.contact-grid` → `.contact-card` × 4

---

## 10. FOOTER

- **배경**: 남색 그라데이션
- **내용**: 저작권 고지, 링크 모음
- **하단 라인**: 상단 테두리로 구분

---

## CSS 아키텍처

### CSS 변수 (Design Tokens)

```css
/* 색상 시스템 */
--navy:          남색 (주색상)
--navy-dark:     진한 남색
--navy-light:    연한 남색
--orange:        주황색 (강조색)
--orange-dark:   진한 주황
--orange-light:  연한 주황
--orange-warm:   따뜻한 주황
--white:         흰색
--shadow:        그림자
--shadow-lg:     큰 그림자

/* 폰트 */
--font-main:     메인 폰트
--font-heading:  제목 폰트
```

### 레이아웃 시스템

| 클래스 | 용도 |
|--------|------|
| `.container` | 전체 너비 제한 + 중앙 정렬 |
| `.section-header` | 섹션 타이틀 + 서브타이틀 |
| `.fade-in` | 스크롤 시 페이드인 애니메이션 |
| `grid` 레이아웃 | 카드 그리드 (반응형) |

### 반응형 breakpoints

| 크기 | 조건 |
|------|------|
| **Desktop** | 기본 (3~4 컬럼) |
| **Tablet** | `max-width: 1024px` (2 컬럼) |
| **Mobile** | `max-width: 768px` (1 컬럼, 햄버거 메뉴) |

---

## JavaScript 기능

### 1. 헤더 스크롤 효과
```javascript
window.addEventListener('scroll', () => {
  // scrollY > 50 → header.scrolled = true
});
```

### 2. 액티브 네비게이션 링크
```javascript
// sections.forEach → scrollY 기준 현재 섹션 확인 → navLinks.active 토글
```

### 3. 스크롤 페이드인 애니메이션
```javascript
// IntersectionObserver → .fade-in 요소가 뷰포트 진입 시 .visible 추가
```

### 4. 모달 팝업 (갤러리)
```javascript
// 이미지 클릭 → .modal.show → X/ESC/배클릭으로 닫기
```

### 5. 카운트다운 타이머
```javascript
// targetDate - now → 일/시간/분/초 계산 → 업데이트
```

---

## 파일 구조

```
e-park-hansang-bundang/
├── index.html          # 메인 페이지 (모든 CSS/JS 인라인)
├── INDEX_STRUCTURE.md  # 이 파일
└── img/
    └── elife_logo.svg  # 로고
```

---

## 주요 디자인 컨벤션

| 항목 | 컨벤션 |
|------|--------|
| **섹션 구분** | 남색/주황색/베이지 배경 교차 사용 |
| **카드 스타일** | 흰색 배경 + 둥근 모서리 + 그림자 |
| **버튼** | 남색 배경 + 흰색 텍스트 (기본), 흰색 배경 + 남색 테두리 (보조) |
| **아이콘** | Font Awesome ( CDN ) |
| **폰트** | Google Fonts (Noto Sans KR) |
| **애니메이션** | CSS transition + IntersectionObserver |
