# e편한세상 분당 퍼스트빌리지 — 웹사이트 구조 설명서

> 단일 HTML 파일 기반 랜딩 페이지. CSS·JS 모두 인라인 임베딩.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | e편한세상 분당 퍼스트빌리지 입주예정자 협의회 |
| **유형** | 단일 페이지 랜딩 사이트 (HTML/CSS/JS) |
| **빌드 도구** | 없음 — 정적 파일 직접 서빙 |
| **배포** | Docker (nginx:alpine) / GitHub Pages (ebunfirvil.github.io) |
| **스타일** | Google Fonts `Pretendard` (variable), CSS variables, Flexbox/Grid |
| **브라우저 대상** | Chrome 90+, Safari 14+, Firefox 88+ |

---

## 2. 파일 구조

```
e-park-hansang-bundang/
├── index.html                    # 메인 페이지 (HTML+CSS+JS 통합)
├── index.html.backup             # 백업 파일
├── index 복사본.html             # 백업 파일
├── structure.md                  # 이 파일
├── docker-compose.yml            # Docker Compose (nginx)
├── img/
│   ├── elife_logo.svg            # 로고 (흰색 fill, 84×42px)
│   ├── perspective.png           # 메인 비주얼 (파사드 원근)
│   ├── aerial.png                # 조감도
│   ├── siteplan.png              # 부지 평면도
│   ├── 51A.png                   # 51A 평면도 (413호)
│   ├── 55A.png                   # 55A 평면도 (468호)
│   ├── 55B.png                   # 55B 평면도 (254호)
│   ├── 59A.png                   # 59A 평면도 (255호)
│   └── 59T.png                   # 59T 평면도 (10호)
├── fix_names.py                  # 이미지 이름 수정 스크립트
├── download_files.py             # 파일 다운로드 스크립트
├── (팸플릿)e편한세상분당퍼스트빌리지팸플릿.pdf  # 팸플릿 원본
└── .git/                         # Git 저장소
```

---

## 3. HTML 구조 (index.html)

전체 **2030줄**, 단일 파일에 HTML + `<style>` + `<script>` 통합.

### 3.1 문서 구조 다이어그램

```
<!DOCTYPE html>
└── <html lang="ko">
     ├── <head>                          # 메타, 폰트, 인라인 CSS (~1150줄)
     │    ├── meta charset, viewport
     │    ├── title: e편한세상 분당 퍼스트빌리지
     │    ├── Google Fonts: Pretendard Variable
     │    └── <style>                     # 전체 스타일 정의
     │
     └── <body>
          ├── <header>                    # 헤더 (로고 + 네비게이션)
          │    ├── 로고 (elife_logo.svg)
          │    ├── nav (7개 메뉴 링크)
          │    └── 햄버거 메뉴 버튼
          │
          ├── <main>
          │    ├── <section id="hero">    # 히어로 섹션
          │    │    └── perspective.png
          │    │
          │    ├── <section id="about">   # 프로젝트 소개
          │    │    ├── 위치 문구
          │    │    ├── aerial.png (조감도)
          │    │    └── siteplan.png (부지 평면도)
          │    │
          │    ├── <section id="type">    # 평형 정보
          │    │    ├── Type 51A (413호)
          │    │    ├── Type 55A (468호)
          │    │    ├── Type 55B (254호)
          │    │    ├── Type 59A (255호)
          │    │    └── Type 59T (10호)
          │    │    └── 모달 팝업 (평면도 상세)
          │    │
          │    ├── <section id="gallery"> # 갤러리
          │    │    ├── 3개 썸네일
          │    │    │    ├── perspective.png
          │    │    │    ├── aerial.png
          │    │    │    └── siteplan.png
          │    │    └── 모달 팝업
          │    │
          │    ├── <section id="procedure"># 입주 절차 (5단계)
          │    │    ├── 1. 입주 신청
          │    │    ├── 2. 계약
          │    │    ├── 3. 입주시기 안내
          │    │    ├── 4. 입주일정 확인
          │    │    └── 5. 입주 준비
          │    │
          │    └── <section id="location"> # 위치 정보
          │         ├── 주소 문구
          │         ├── YouTube 지도 임베드
          │         └── 카페 링크
          │
          ├── <footer>                     # 푸터
          │    ├── 로고
          │    ├── 연락처
          │    ├── 링크 (카페, 회칙)
          │    └── 저작권
          │
          └── <div id="backToTop">         # 뒤로가기 버튼
```

### 3.2 섹션 상세

#### 헤더 (`<header>`)
- 고정 위치 (`position: fixed`, `z-index: 1000`)
- 스크롤 시 배경색 변경 (스크롤 이벤트 리스너)
- 로고: `img/elife_logo.svg` — 흰색 `fill="white"`, 84×42px
- 네비게이션: 7개 항목 → `#hero`, `#about`, `#type`, `#gallery`, `#procedure`, `#location`, `#footer`
- 모바일: 햄버거 메뉴 (3줄 아이콘 → X 아이콘 토글)

#### 히어로 (`#hero`)
- 전체 화면 (`min-height: 100vh`)
- 배경: `perspective.png` (파사드 원근 사진)
- 오버레이: 어두운 그라데이션 (`rgba(0,0,0,0.4)`)
- 중앙 정렬 텍스트: 프로젝트명 + 슬로건

#### 프로젝트 소개 (`#about`)
- 제목: "프로젝트 소개"
- 왼쪽: 위치 설명 텍스트
- 오른쪽: `aerial.png` (조감도) + `siteplan.png` (부지 평면도) — 스크롤 시 페이드인 애니메이션

#### 평형 정보 (`#type`)
- **5개 평형 타입** — 각 카드 클릭 시 모달 팝업:

| 타입 | 호수 수 | 특징 |
|------|---------|------|
| 51A | 413호 | 가장 많은 호수 |
| 55A | 468호 | 최대 호수 |
| 55B | 254호 | |
| 59A | 255호 | |
| 59T | 10호 | |

- 모달 내용: 타입명 + 평면도 이미지 (`img/{type}.png`)
- 모달 닫기: X 버튼 / ESC 키 / 배경 클릭

#### 갤러리 (`#gallery`)
- 3개 썸네일 (perspective, aerial, siteplan)
- CSS Grid 3열 (모바일 1열)
- 클릭 시 모달 팝업 (전체 화면 이미지)

#### 입주 절차 (`#procedure`)
- **5단계** — 번호 뱃지 + 설명:

| 단계 | 내용 |
|------|------|
| 1 | 입주 신청 |
| 2 | 계약 |
| 3 | 입주시기 안내 |
| 4 | 입주일정 확인 |
| 5 | 입주 준비 |

- 스크롤 시 순차적 페이드인 애니메이션

#### 위치 (`#location`)
- 주소 텍스트
- YouTube 지도 임베드 (iframe)
- Naver Cafe 링크: `https://cafe.naver.com/naksangheemang`
- 회칙 링크: `https://cafe.naver.com/f-e/cafes/30587172/articles/432`

#### 푸터 (`#footer`)
- 로고 + 연락처
- 외부 링크 (카페, 회칙)
- 저작권 문구

---

## 4. CSS 구조

### 4.1 CSS Variables (전역)

```css
:root {
  --primary: #0056b3;          /* 메인 블루 */
  --primary-dark: #003d80;     /* 진한 블루 */
  --accent: #e63946;           /* 강조 레드 */
  --bg-dark: #1a1a2e;          /* 어두운 배경 */
  --bg-darker: #0f0f1a;        /* 더 어두운 배경 */
  --text-light: #ffffff;       /* 밝은 텍스트 */
  --text-muted: #a0a0b0;      /* 희미한 텍스트 */
  --card-bg: rgba(255,255,255,0.05);  /* 카드 배경 */
  --border-color: rgba(255,255,255,0.1); /* 테두리 */
  --header-height: 70px;      /* 헤더 높이 */
}
```

### 4.2 주요 레이아웃

| 요소 | 방법 |
|------|------|
| 전체 컨테이너 | `max-width: 1200px`, `margin: 0 auto` |
| 섹션 | `padding: 80px 20px`, `min-height: 100vh` |
| 그리드 | `display: grid`, `gap: 30px` |
| 반응형 | 미디어 쿼리 (768px, 480px 기준) |
| 카드 | `border-radius: 16px`, `backdrop-filter: blur(10px)` |

### 4.3 애니메이션

| 애니메이션 | 트리거 | 효과 |
|-----------|--------|------|
| `fadeInUp` | 스크롤 진입 | 아래에서 위로 페이드인 |
| `fadeInLeft` | 스크롤 진입 | 왼쪽에서 오른쪽으로 |
| `fadeInRight` | 스크롤 진입 | 오른쪽에서 왼쪽으로 |
| `pulse` | hover | 부드럽게 확대/축소 |
| `slideDown` | 모바일 메뉴 | 위에서 아래 슬라이드 |

### 4.4 반응형 breakpoint

| 크기 | 대상 | 주요 변경 |
|------|------|----------|
| `> 768px` | 데스크탑 | 2~3열 그리드, 풀 네비게이션 |
| `768px 이하` | 태블릿 | 2열 그리드 |
| `480px 이하` | 모바일 | 1열, 햄버거 메뉴, 패딩 축소 |

---

## 5. JavaScript 구조

전체 약 **450줄** — `<script>` 태그에 인라인 임베딩.

### 5.1 함수 목록

| 함수 | 역할 | 호출 시점 |
|------|------|----------|
| `openGalleryModal(index)` | 갤러리 모달 열기 | 썸네일 클릭 |
| `closeGalleryModal()` | 갤러리 모달 닫기 | X/ESC/배경 클릭 |
| `changeGalleryImage(direction)` | 이미지 전/후切换 | 화살표 버튼 |
| `openFloorPlanModal(type)` | 평면도 모달 열기 | 평형 카드 클릭 |
| `closeFloorPlanModal()` | 평면도 모달 닫기 | X/ESC/배경 클릭 |
| `toggleMobileMenu()` | 모바일 메뉴 토글 | 햄버거 버튼 클릭 |
| `handleScroll()` | 스크롤 이벤트 처리 | 스크롤 중 (requestAnimationFrame) |
| `handleResize()` | 리사이즈 이벤트 | 윈도우 리사이즈 |
| `init()` | 초기화 | DOMContentLoaded |

### 5.2 주요 동작 흐름

```
DOMContentLoaded
  └── init()
       ├── 모달 관련 이벤트 리스너 설정
       ├── 스크롤 애니메이션 (IntersectionObserver)
       ├── 스크롤 헤더 효과 (scroll event)
       ├── 모바일 메뉴 (click event)
       └── 리사이즈 핸들러

IntersectionObserver
  └── .animate-on-scroll 요소 감지
       └── .visible 클래스 추가 → CSS 애니메이션 발동

스크롤 핸들러
  ├── 헤더 배경색 변경 (스크롤 > 50px)
  └── 활성 네비게이션 하이라이팅 (scrollIntoView)
```

### 5.3 모달 시스템

**갤러리 모달:**
- 3개 이미지 순환 (인덱스 0~2)
- 좌우 화살표로 이미지 변경
- 배경 클릭, ESC, X 버튼으로 닫기

**평면도 모달:**
- 5개 타입별 평면도
- `img/{type}.png` 로드 (51A, 55A, 55B, 59A, 59T)
- 모달 닫기: X 버튼 / ESC / 배경 클릭

---

## 6. 외부 의존성

| 의존성 | 용도 | CDN |
|--------|------|-----|
| **Pretendard Variable** | 본문 폰트 | `https://fastly.jsdelivr.net/gh/Project-Noonnu/noonfonts_2107@1.1/Pretendard VARIABLE.woff2` |
| **YouTube iframe** | 위치 지도 | `https://www.youtube.com/embed/{videoId}` |

---

## 7. Docker 배포

### docker-compose.yml

```yaml
version: '3'
services:
  web:
    image: nginx:alpine
    ports:
      - "6443:80"
    volumes:
      - .:/usr/share/nginx/html   # 현재 디렉토리 마운트
    restart: unless-stopped
```

### 빌드 및 실행

```bash
# Docker 직접 빌드 (nginx 이미지 사용)
sudo docker run -d --name epark-bundang --restart unless-stopped -p 6443:80 -v $(pwd):/usr/share/nginx/html nginx:alpine

# 또는 docker-compose
docker-compose up -d
```

### GitHub Pages

- Repository: `ebunfirvil.github.io`
- URL: `https://ebunfirvil.github.io`
- 자동 배포: main 브랜치 푸시 시

---

## 8. 주요 링크

| 항목 | URL |
|------|-----|
| Naver Cafe | https://cafe.naver.com/naksangheemang |
| 회칙 | https://cafe.naver.com/f-e/cafes/30587172/articles/432 |
| GitHub Pages | https://ebunfirvil.github.io |
| Docker (NAS) | http://192.168.1.168:6443 |

---

## 9. 수정 시 주의사항

1. **단일 파일 구조** — CSS/JS 모두 `index.html` 내 인라인. 외부 파일 분리 시 `<link>`/`<script src>` 변경 필요.
2. **이미지 경로** — 상대 경로 (`img/...`) 사용. Docker 볼륨 마운트 시 경로 일치 확인.
3. **Naver Finance API** — 외부 API 호출 없음. 정적 데이터만 사용.
4. **CORS** — 브라우저에서 외부 API 호출 시 CORS 제한. 서버 사이드 프록시 필요.
5. **폰트** — Pretendard CDN. 오프라인 환경에서는 로컬 폰트 파일로 대체 필요.
6. **모달** — `aria-label`, `role="dialog"` 등 접근성 속성 일부 적용됨. 보완 가능.
7. **스크롤 애니메이션** — `IntersectionObserver` 사용. 구형 브라우저 폴백 필요 시 `scroll` 이벤트로 변경.

---

## 10. 평형 데이터 요약

| 타입 | 호수 수 | 평면도 파일 |
|------|---------|------------|
| 51A | 413호 | `img/51A.png` |
| 55A | 468호 | `img/55A.png` |
| 55B | 254호 | `img/55B.png` |
| 59A | 255호 | `img/59A.png` |
| 59T | 10호 | `img/59T.png` |

총 **1400호** (413 + 468 + 254 + 255 + 10)
