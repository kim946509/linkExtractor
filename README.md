# LinkRadio Parsing Server

LinkRadio Node.js 파싱 서버는 웹 링크에서 의미있는 콘텐츠를 추출하여 Spring Boot 메인 서버에 비동기적으로 전달하는 특화 서비스입니다.

## 🚀 주요 기능

- 웹 콘텐츠 자동 추출 (Readability.js + Puppeteer)
- 객체지향 설계 기반 확장 가능한 아키텍처
- Spring Boot 서버와의 비동기 통신
- Google Gemini API 연동을 통한 텍스트 개선
- 강력한 에러 처리 및 재시도 메커니즘

## 📁 프로젝트 구조

```
src/
├── controllers/     # API 컨트롤러
├── services/        # 비즈니스 로직
├── parsers/         # 콘텐츠 파싱 엔진
├── utils/           # 유틸리티 함수
├── middleware/      # Express 미들웨어
└── config/          # 설정 파일

tests/
├── unit/           # 단위 테스트
└── integration/    # 통합 테스트
```

## 🛠️ 설치 및 실행

### 사전 요구사항
- Node.js 18.0.0 이상
- npm 8.0.0 이상
- Redis 서버 (옵션)

### 설치
```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값들을 설정하세요
```

### 개발 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

### 테스트 실행
```bash
# 모든 테스트 실행
npm test

# 테스트 watch 모드
npm run test:watch

# 코드 린팅
npm run lint

# 린팅 자동 수정
npm run lint:fix
```

## 🔧 환경 변수

주요 환경 변수는 `.env.example` 파일을 참조하세요:

- `PORT`: 서버 포트 (기본값: 3000)
- `NODE_ENV`: 실행 환경 (development/production)
- `SPRING_SERVER_URL`: Spring Boot 서버 URL
- `REDIS_HOST`: Redis 서버 호스트
- `GEMINI_API_KEY`: Google Gemini API 키

## 📡 API 엔드포인트

### 헬스체크
```
GET /health
```
서버 상태 확인

### 루트
```
GET /
```
기본 서비스 정보

## 🏗️ 아키텍처 설계

이 서버는 다음 설계 원칙을 따릅니다:

- **객체지향 설계**: Strategy 패턴을 통한 파싱 엔진 교체 가능
- **레이어드 아키텍처**: Controller → Service → Repository 분리
- **비동기 처리**: 작업 큐를 통한 안정적인 콘텐츠 처리
- **확장성**: 마이크로서비스 아키텍처로의 확장 준비

## 🔄 개발 워크플로우

1. 코드 작성
2. `npm run lint` - 코드 스타일 검사
3. `npm test` - 테스트 실행
4. `npm run dev` - 로컬 서버 테스트

## 📝 라이센스

ISC

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하면 GitHub Issues를 통해 문의해 주세요.