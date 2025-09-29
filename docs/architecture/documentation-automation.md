# 아키텍처 문서 자동화 및 유지보수

## 📋 개요

LinkRadio 프로젝트의 아키텍처 문서를 자동화하고 지속적으로 최신 상태로 유지하기 위한 전략과 도구를 정의합니다.

## 🎯 목표

1. **문서 일관성**: 코드와 문서 간 동기화 유지
2. **자동화**: 반복적인 문서 업데이트 작업 최소화
3. **품질 보장**: 문서 검증 및 리뷰 프로세스 자동화
4. **접근성**: 팀 모든 구성원이 쉽게 문서에 기여할 수 있는 환경

## 🛠️ 자동화 도구 스택

### 1. 다이어그램 자동 생성

#### Mermaid 다이어그램
```yaml
# .github/workflows/docs-update.yml
name: Update Architecture Diagrams

on:
  push:
    paths:
      - 'src/**/*.java'
      - 'docs/architecture/**/*.md'

jobs:
  update-diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate Database Schema Diagram
        run: |
          # JPA 엔티티에서 ERD 자동 생성
          java -jar schemaspy.jar -t mysql -db linkradio \
            -host localhost -u root -p password \
            -o docs/architecture/diagrams/database

      - name: Update Mermaid Diagrams
        uses: mermaid-js/mermaid-cli@v1
        with:
          args: -i docs/architecture/c4-model/*.md -o docs/architecture/images/
```

#### PlantUML 통합
```java
// 코드 내 PlantUML 주석으로 자동 다이어그램 생성
/**
 * @startuml
 * class UserService {
 *   +createUser(UserCreateRequest): User
 *   +getUserById(Long): User
 * }
 * class ContentService {
 *   +analyzeContent(String): Content
 * }
 * UserService --> ContentService
 * @enduml
 */
@Service
public class UserService {
    // 구현...
}
```

### 2. API 문서 자동 생성

#### OpenAPI/Swagger 통합
```java
// Spring Boot에서 자동 API 문서 생성
@RestController
@RequestMapping("/api/v1/content")
@Tag(name = "Content", description = "콘텐츠 관리 API")
public class ContentController {

    @Operation(summary = "콘텐츠 분석", description = "웹 링크에서 콘텐츠를 추출하고 분석합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "분석 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 URL")
    })
    @PostMapping("/analyze")
    public ResponseEntity<ContentResponse> analyzeContent(
        @Valid @RequestBody ContentAnalyzeRequest request) {
        // 구현...
    }
}
```

#### 자동 API 문서 배포
```yaml
# GitHub Actions으로 API 문서 자동 배포
- name: Generate API Documentation
  run: |
    mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=docs" &
    sleep 30
    curl -o docs/api/openapi.json http://localhost:8080/v3/api-docs
    npx @redocly/openapi-cli build-docs docs/api/openapi.json \
      --output docs/api/index.html

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./docs
```

### 3. 코드 분석 기반 문서 업데이트

#### 아키텍처 변경 감지
```bash
#!/bin/bash
# scripts/detect-architecture-changes.sh

# 새로운 서비스 클래스 감지
NEW_SERVICES=$(git diff HEAD~1 --name-only | grep "Service\.java$")
if [ ! -z "$NEW_SERVICES" ]; then
    echo "New services detected: $NEW_SERVICES"
    echo "Please update component diagram in docs/architecture/c4-model/component-diagram.md"
fi

# 새로운 컨트롤러 감지
NEW_CONTROLLERS=$(git diff HEAD~1 --name-only | grep "Controller\.java$")
if [ ! -z "$NEW_CONTROLLERS" ]; then
    echo "New controllers detected: $NEW_CONTROLLERS"
    echo "Please update API documentation"
fi

# 데이터베이스 스키마 변경 감지
SCHEMA_CHANGES=$(git diff HEAD~1 --name-only | grep "entity" | grep "\.java$")
if [ ! -z "$SCHEMA_CHANGES" ]; then
    echo "Database schema changes detected: $SCHEMA_CHANGES"
    echo "Please update data-architecture.md"
fi
```

## 📝 문서 템플릿 시스템

### 1. 자동 템플릿 생성

#### 새로운 ADR 템플릿 생성기
```bash
#!/bin/bash
# scripts/create-adr.sh

ADR_NUMBER=$(printf "%04d" $(($(ls docs/architecture/adrs/ | grep -E "^[0-9]+" | wc -l) + 1)))
ADR_TITLE="$1"
ADR_FILE="docs/architecture/adrs/${ADR_NUMBER}-$(echo $ADR_TITLE | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"

cp docs/architecture/adrs/template.md "$ADR_FILE"

# 템플릿 내 변수 치환
sed -i "s/\[NUMBER\]/$ADR_NUMBER/g" "$ADR_FILE"
sed -i "s/\[간단한 명사구로 결정 내용 설명\]/$ADR_TITLE/g" "$ADR_FILE"
sed -i "s/YYYY-MM-DD/$(date +%Y-%m-%d)/g" "$ADR_FILE"

echo "Created new ADR: $ADR_FILE"
code "$ADR_FILE"  # VS Code로 열기
```

#### 컴포넌트 문서 템플릿
```bash
#!/bin/bash
# scripts/create-component-doc.sh

COMPONENT_NAME="$1"
PACKAGE_PATH="$2"

DOC_FILE="docs/architecture/components/${COMPONENT_NAME}.md"

cat > "$DOC_FILE" << EOF
# ${COMPONENT_NAME} Component

## 📋 개요
[컴포넌트 설명]

## 🎯 책임
- [책임 1]
- [책임 2]

## 🔗 의존성
\`\`\`mermaid
graph LR
    ${COMPONENT_NAME} --> Dependency1
    ${COMPONENT_NAME} --> Dependency2
\`\`\`

## 📊 클래스 다이어그램
\`\`\`mermaid
classDiagram
    class ${COMPONENT_NAME} {
        +method1()
        +method2()
    }
\`\`\`

## 🔧 설정
[설정 방법]

## 🧪 테스트
[테스트 전략]
EOF

echo "Created component documentation: $DOC_FILE"
```

## 🔍 문서 품질 검증

### 1. 자동 문서 검증

#### 링크 체크
```yaml
# .github/workflows/docs-validation.yml
name: Documentation Validation

on:
  pull_request:
    paths:
      - 'docs/**/*.md'

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check Markdown Links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          config-file: '.github/markdown-link-check.json'

      - name: Validate Mermaid Diagrams
        run: |
          npm install -g @mermaid-js/mermaid-cli
          find docs -name "*.md" -exec mmdc -i {} --dry-run \;

      - name: Check Documentation Standards
        run: |
          # ADR 번호 중복 체크
          ./scripts/check-adr-numbers.sh

          # 필수 섹션 존재 확인
          ./scripts/validate-doc-structure.sh
```

#### 문서 구조 검증 스크립트
```bash
#!/bin/bash
# scripts/validate-doc-structure.sh

# ADR 필수 섹션 체크
for adr_file in docs/architecture/adrs/*.md; do
    if [[ ! "$adr_file" =~ template\.md$ ]]; then
        echo "Validating $adr_file"

        required_sections=("컨텍스트" "결정 사항" "고려된 옵션들" "결정 근거")
        for section in "${required_sections[@]}"; do
            if ! grep -q "$section" "$adr_file"; then
                echo "ERROR: Missing required section '$section' in $adr_file"
                exit 1
            fi
        done
    fi
done

echo "All ADRs have required sections"
```

### 2. 코드-문서 동기화 체크

#### API 문서 동기화 검증
```java
// 테스트 코드로 API 문서와 실제 엔드포인트 동기화 확인
@SpringBootTest
@AutoConfigureTestDatabase
class ApiDocumentationTest {

    @Test
    void shouldHaveDocumentationForAllEndpoints() {
        // OpenAPI 스펙에서 모든 엔드포인트 추출
        Set<String> documentedEndpoints = extractEndpointsFromOpenApiSpec();

        // 실제 컨트롤러에서 엔드포인트 추출
        Set<String> actualEndpoints = extractEndpointsFromControllers();

        // 동기화 확인
        assertThat(documentedEndpoints).containsAll(actualEndpoints);
        assertThat(actualEndpoints).containsAll(documentedEndpoints);
    }
}
```

## 📊 문서 메트릭 및 모니터링

### 1. 문서 건강도 지표

#### 문서 메트릭 수집
```bash
#!/bin/bash
# scripts/docs-metrics.sh

echo "=== Documentation Health Report ==="
echo "Generated on: $(date)"
echo ""

# 문서 개수
echo "📄 Document Count:"
echo "  Total MD files: $(find docs -name "*.md" | wc -l)"
echo "  ADRs: $(ls docs/architecture/adrs/*.md | grep -v template | wc -l)"
echo "  Architecture docs: $(find docs/architecture -name "*.md" | wc -l)"
echo ""

# 최근 업데이트
echo "🔄 Recent Updates:"
echo "  Last modified: $(find docs -name "*.md" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)"
echo "  Updates this month: $(find docs -name "*.md" -newermt "$(date -d '1 month ago' +%Y-%m-%d)" | wc -l)"
echo ""

# 깨진 링크 체크
echo "🔗 Link Health:"
BROKEN_LINKS=$(markdown-link-check docs/**/*.md 2>&1 | grep -c "✖")
echo "  Broken links: $BROKEN_LINKS"
echo ""

# 다이어그램 유효성
echo "📊 Diagram Validation:"
INVALID_DIAGRAMS=$(find docs -name "*.md" -exec grep -l "```mermaid" {} \; | xargs mmdc --dry-run 2>&1 | grep -c "Error")
echo "  Invalid diagrams: $INVALID_DIAGRAMS"
```

### 2. 문서 사용량 추적

#### GitHub Pages 분석
```yaml
# .github/workflows/docs-analytics.yml
name: Documentation Analytics

on:
  schedule:
    - cron: '0 9 * * 1'  # 매주 월요일 오전 9시

jobs:
  analytics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Page Views
        run: |
          # Google Analytics API 또는 GitHub Pages 로그 분석
          echo "Most viewed pages this week:"
          # curl -H "Authorization: Bearer $ANALYTICS_TOKEN" \
          #      "https://analyticsdata.googleapis.com/v1beta/properties/PROPERTY_ID:runReport"

      - name: Update Documentation Dashboard
        run: |
          # 문서 사용량 대시보드 업데이트
          python scripts/update-docs-dashboard.py
```

## 🔄 리뷰 및 승인 프로세스

### 1. 자동 리뷰 할당

#### GitHub Actions로 리뷰어 자동 할당
```yaml
# .github/workflows/assign-reviewers.yml
name: Auto Assign Reviewers

on:
  pull_request:
    paths:
      - 'docs/architecture/**'

jobs:
  assign-reviewers:
    runs-on: ubuntu-latest
    steps:
      - name: Assign Architecture Reviewers
        uses: kentaro-m/auto-assign-action@v1.2.0
        with:
          configuration-path: '.github/auto-assign.yml'
```

#### 리뷰어 설정
```yaml
# .github/auto-assign.yml
addReviewers: true
addAssignees: false

reviewers:
  - backend-architect
  - tech-lead
  - senior-developer

filePatterns:
  'docs/architecture/adrs/**':
    - backend-architect
    - tech-lead
  'docs/architecture/c4-model/**':
    - backend-architect
  'docs/api/**':
    - api-specialist
```

### 2. 승인 체크리스트

#### PR 템플릿
```markdown
<!-- .github/pull_request_template.md -->
## 📝 Documentation Changes

### Type of Change
- [ ] New documentation
- [ ] Update existing documentation
- [ ] Architecture Decision Record (ADR)
- [ ] Diagram update
- [ ] API documentation

### Checklist
- [ ] All links are working
- [ ] Diagrams render correctly
- [ ] Follows documentation standards
- [ ] Reviewed by architecture team (for ADRs)
- [ ] Updated table of contents (if needed)

### Impact Assessment
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)
- [ ] Related documentation updated

### Testing
- [ ] Documentation builds successfully
- [ ] All automated checks pass
- [ ] Manual review completed
```

## 📅 유지보수 일정

### 정기 리뷰 주기

| 문서 유형 | 리뷰 주기 | 담당자 | 체크 항목 |
|-----------|-----------|--------|-----------|
| **ADRs** | 분기별 | Backend Architect | 결정 유효성, 상태 업데이트 |
| **C4 Diagrams** | 월별 | System Architect | 시스템 변경사항 반영 |
| **API Docs** | 스프린트별 | API Team | 엔드포인트 동기화 |
| **Infrastructure** | 월별 | DevOps | 배포 환경 변경사항 |

### 자동 알림 설정
```bash
#!/bin/bash
# scripts/schedule-doc-reviews.sh

# Cron job으로 정기 리뷰 알림 설정
# 0 9 1 */3 * - 분기별 ADR 리뷰
# 0 9 1 * * - 월별 다이어그램 리뷰

echo "Setting up documentation review schedules..."

# Slack 알림 예시
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"📋 Monthly architecture documentation review is due!"}' \
  $SLACK_WEBHOOK_URL
```

## 🎓 팀 교육 및 가이드

### 1. 문서 작성 가이드

#### 스타일 가이드
```markdown
# LinkRadio 문서 작성 스타일 가이드

## 제목 규칙
- H1: 문서 제목 (한 개만)
- H2: 주요 섹션
- H3: 하위 섹션
- 이모지 사용: 섹션별 아이콘으로 가독성 향상

## 다이어그램 규칙
- Mermaid 우선 사용
- 한글 노드명 사용
- 일관된 색상 테마 적용

## 링크 규칙
- 상대 경로 사용
- 문서 간 참조 시 명확한 섹션 링크
```

### 2. 도구 사용법 교육

#### VS Code 확장 설정
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bierner.markdown-mermaid",
    "davidanson.vscode-markdownlint",
    "yzhang.markdown-all-in-one",
    "redhat.vscode-yaml"
  ]
}
```

#### 개발 환경 설정
```json
// .vscode/settings.json
{
  "markdownlint.config": {
    "MD033": false,  // HTML 허용
    "MD041": false   // 첫 줄 제목 강제 안함
  },
  "markdown.mermaid.theme": "dark",
  "files.associations": {
    "*.md": "markdown"
  }
}
```

---

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "LinkRadio \uc544\ud0a4\ud14d\ucc98 \ubd84\uc11d \ubc0f \ud604\ud669 \ud30c\uc545", "status": "completed", "activeForm": "LinkRadio \uc544\ud0a4\ud14d\ucc98\ub97c \ubd84\uc11d\ud558\uace0 \ud604\ud669\uc744 \ud30c\uc545\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4"}, {"content": "C4 \ubaa8\ub378 \uae30\ubc18 \uc544\ud0a4\ud14d\ucc98 \ubb38\uc11c \uad6c\uc870 \uc124\uacc4", "status": "completed", "activeForm": "C4 \ubaa8\ub378 \uae30\ubc18 \uc544\ud0a4\ud14d\ucc98 \ubb38\uc11c \uad6c\uc870\ub97c \uc124\uacc4\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4"}, {"content": "\uc2dc\uc2a4\ud15c \ucee8\ud14d\uc2a4\ud2b8 \ubc0f \ucee8\ud14c\uc774\ub108 \ub2e4\uc774\uc5b4\uadf8\ub7a8 \uc0dd\uc131", "status": "completed", "activeForm": "\uc2dc\uc2a4\ud15c \ucee8\ud14d\uc2a4\ud2b8 \ubc0f \ucee8\ud14c\uc774\ub108 \ub2e4\uc774\uc5b4\uadf8\ub7a8\uc744 \uc0dd\uc131\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4"}, {"content": "ADR \ud15c\ud50c\ub9bf \ubc0f \uc544\ud0a4\ud14d\ucc98 \uacb0\uc815 \ubb38\uc11c\ud654", "status": "completed", "activeForm": "ADR \ud15c\ud50c\ub9bf \ubc0f \uc544\ud0a4\ud14d\ucc98 \uacb0\uc815\uc744 \ubb38\uc11c\ud654\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4"}, {"content": "\ubb38\uc11c \uc790\ub3d9\ud654 \ubc0f \uc720\uc9c0\ubcf4\uc218 \ud504\ub85c\uc138\uc2a4 \uad6c\ucd95", "status": "completed", "activeForm": "\ubb38\uc11c \uc790\ub3d9\ud654 \ubc0f \uc720\uc9c0\ubcf4\uc218 \ud504\ub85c\uc138\uc2a4\ub97c \uad6c\ucd95\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4"}]