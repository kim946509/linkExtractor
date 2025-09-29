# LinkRadio 아키텍처 문서

이 디렉토리는 LinkRadio 시스템의 포괄적인 아키텍처 문서를 포함합니다.

## 📋 문서 구조

```
docs/architecture/
├── README.md                    # 이 파일
├── system-overview.md           # 시스템 전체 개요
├── architecture-principles.md   # 아키텍처 원칙
├── technology-stack.md          # 기술 스택 문서
├── deployment-architecture.md   # 배포 아키텍처
├── security-architecture.md     # 보안 아키텍처
├── data-architecture.md         # 데이터 아키텍처
├── c4-model/                    # C4 모델 다이어그램
│   ├── context-diagram.md       # 시스템 컨텍스트
│   ├── container-diagram.md     # 컨테이너 다이어그램
│   ├── component-diagram.md     # 컴포넌트 다이어그램
│   └── code-diagram.md          # 코드 다이어그램
├── adrs/                        # Architecture Decision Records
│   ├── template.md              # ADR 템플릿
│   ├── 0001-microservice-vs-monolith.md
│   ├── 0002-nodejs-parsing-server.md
│   ├── 0003-database-choice.md
│   └── 0004-tts-service-provider.md
├── diagrams/                    # 기술적 다이어그램
│   ├── data-flow.md             # 데이터 플로우
│   ├── sequence-diagrams.md     # 시퀀스 다이어그램
│   └── infrastructure.md        # 인프라 다이어그램
└── api/                         # API 문서
    ├── api-design.md            # API 설계 원칙
    ├── endpoint-specifications.md # 엔드포인트 명세
    └── data-models.md           # 데이터 모델
```

## 🎯 문서화 목적

1. **시스템 이해**: 새로운 팀원의 빠른 온보딩
2. **의사결정 추적**: 아키텍처 결정의 배경과 근거 기록
3. **설계 일관성**: 일관된 아키텍처 패턴 유지
4. **커뮤니케이션**: 팀 간 효과적인 소통 도구
5. **유지보수**: 시스템 진화와 개선의 가이드

## 📖 읽는 순서

### 새로운 개발자를 위한 권장 순서:
1. [시스템 개요](./system-overview.md) - 전체적인 이해
2. [C4 컨텍스트 다이어그램](./c4-model/context-diagram.md) - 시스템 경계
3. [C4 컨테이너 다이어그램](./c4-model/container-diagram.md) - 주요 구성요소
4. [기술 스택](./technology-stack.md) - 사용 기술 이해
5. [API 설계](./api/api-design.md) - API 구조 파악

### 아키텍트/시니어 개발자를 위한 권장 순서:
1. [아키텍처 원칙](./architecture-principles.md)
2. [ADR 목록](./adrs/) - 주요 결정사항
3. [보안 아키텍처](./security-architecture.md)
4. [데이터 아키텍처](./data-architecture.md)
5. [배포 아키텍처](./deployment-architecture.md)

## 🔄 문서 유지보수

- **책임자**: Backend Architect
- **리뷰 주기**: 분기별 (1주일)
- **업데이트 트리거**:
  - 새로운 ADR 추가 시
  - 주요 아키텍처 변경 시
  - 새로운 서비스/컴포넌트 추가 시

## 🛠️ 도구

- **다이어그램**: Mermaid, PlantUML
- **문서 포맷**: Markdown
- **버전 관리**: Git
- **자동화**: GitHub Actions (계획)

## 📝 기여 가이드

아키텍처 문서에 기여하려면:

1. 변경사항이 있을 때마다 관련 문서 업데이트
2. 새로운 아키텍처 결정 시 ADR 작성
3. 다이어그램은 코드와 동기화 유지
4. 문서 리뷰 프로세스 준수

---

*마지막 업데이트: 2025-09-28*
*문서 버전: 1.0*