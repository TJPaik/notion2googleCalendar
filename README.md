# notion2googleCalendar

Notion 데이터베이스의 일정을 **Google Calendar로 단방향 동기화**하는 TypeScript CLI입니다.

현재 v1은 **단순하고 유지보수하기 쉬운 구조**를 목표로 합니다.
- Source of truth: **Notion**
- 방향: **Notion -> Google Calendar**
- 범위: **Notion DB 1개 + Google Calendar 1개**
- 실행 방식: **수동 실행 기본**, 자동 실행은 cron/systemd로 선택 가능

---

## 한눈에 보기

### 현재 지원하는 것
- Notion row -> Google Calendar event 생성
- 기존 event update
- Notion 삭제/아카이브 -> Google event 삭제
- 날짜만 있으면 all-day event
- 시간까지 있으면 timed event
- 날짜가 비어 있으면 **오늘 날짜 all-day event** fallback
- dry-run / write 모드
- local OAuth 초기화

### 현재 가정하는 Notion 속성명
- 제목: `이름`
- 날짜: `날짜`
- 설명: `설명`

---

## 빠른 시작

### 1) 설치
```bash
npm install
cp .env.example .env
mkdir -p credentials
```

### 2) `.env` 채우기
최소한 아래 값이 필요합니다.

```env
# Notion
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_data_source_id
NOTION_TITLE_PROPERTY=이름
NOTION_DATE_PROPERTY=날짜
NOTION_DESCRIPTION_PROPERTY=설명

# Google Calendar auth (local OAuth 권장)
GOOGLE_OAUTH_CREDENTIALS_PATH=credentials/google-oauth-client.json
GOOGLE_OAUTH_TOKEN_PATH=credentials/google-oauth-token.json

# Google Calendar target
GOOGLE_CALENDAR_ID=your_test_calendar_id@group.calendar.google.com

# App
TIMEZONE=Asia/Seoul
```

> `NOTION_DATABASE_ID`에는 Notion database page ID가 아니라, 실제 query 대상인 **data source ID**가 필요할 수 있습니다.

### 3) Google OAuth client JSON 넣기
Google Cloud에서 받은 desktop OAuth JSON 파일을 아래 경로에 둡니다.

```bash
credentials/google-oauth-client.json
```

### 4) Google 로그인 1회 진행
```bash
npm run sync -- --init-auth
```

성공하면 토큰이 여기에 저장됩니다.
```bash
credentials/google-oauth-token.json
```

### 5) 먼저 미리보기
```bash
npm run sync -- --dry-run
```

### 6) 실제 반영
```bash
npm run sync -- --write
```

---

## Notion 설정

### 1) Integration 만들기
Notion 개발자 페이지에서 integration을 만듭니다.
- `NOTION_TOKEN` 은 여기서 받은 secret 값입니다.

### 2) 데이터베이스에 integration 연결
Notion에서 대상 데이터베이스를 열고:
1. 우측 상단 `...`
2. `Add connections`
3. 만든 integration 선택

이걸 하지 않으면 API에서 데이터베이스를 읽을 수 없습니다.

---

## Google 설정

### 권장 방식: local OAuth
개인 PC에서 수동 실행할 때 가장 쉬운 방식입니다.

필요한 것:
- Google Cloud 프로젝트
- Google Calendar API 활성화
- Desktop app OAuth client 생성
- OAuth client JSON 다운로드

그 후:
- JSON 파일을 `credentials/google-oauth-client.json` 으로 저장
- `npm run sync -- --init-auth` 실행

---

## 명령어 모음

```bash
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
npm run test:acceptance
npm run build

npm run sync -- --init-auth
npm run sync -- --dry-run
npm run sync -- --write
npm run sync -- --dry-run --json
```

### CLI 옵션
- `--init-auth`: Google OAuth 로그인/토큰 생성
- `--dry-run`: 실제 쓰기 없이 변경 예정만 출력
- `--write`: 실제 Google Calendar 반영
- `--json`: 결과를 JSON으로 출력

---

## 자동으로 1분마다 동기화하려면

기본은 수동 실행이지만, 원하면 자동화할 수 있습니다.

## 방법 1: cron
가장 빠르게 붙이는 방법입니다.

```bash
crontab -e
```

예시:
```cron
* * * * * cd /path/to/notion2googleCalendar && /home/paiktj/.nvm/versions/node/v24.14.0/bin/npm run sync -- --write >> /path/to/notion2googleCalendar/sync.log 2>&1
```

### 설명
- 매 1분마다 실행
- `sync.log` 에 로그 저장
- nvm 환경이면 `npm` 전체 경로를 쓰는 것이 안전합니다

로그 확인:
```bash
tail -f /path/to/notion2googleCalendar/sync.log
```

## 방법 2: systemd user service + timer
cron보다 관리가 편하고 상태 확인이 좋습니다.

예시 서비스 파일: `~/.config/systemd/user/notion2googlecalendar.service`
```ini
[Unit]
Description=Run notion2googleCalendar sync

[Service]
Type=oneshot
WorkingDirectory=/path/to/notion2googleCalendar
ExecStart=/home/paiktj/.nvm/versions/node/v24.14.0/bin/npm run sync -- --write
```

예시 타이머 파일: `~/.config/systemd/user/notion2googlecalendar.timer`
```ini
[Unit]
Description=Run notion2googleCalendar every minute

[Timer]
OnCalendar=*-*-* *:*:00
Persistent=true

[Install]
WantedBy=timers.target
```

적용:
```bash
systemctl --user daemon-reload
systemctl --user enable --now notion2googlecalendar.timer
systemctl --user list-timers | grep notion2googlecalendar
```

로그 확인:
```bash
journalctl --user -u notion2googlecalendar.service -f
```

---

## 추천 운영 순서

처음에는 이 순서가 제일 안전합니다.

1. `--dry-run`
2. 테스트 캘린더에 `--write`
3. update/delete 동작 확인
4. 그 다음에 cron 또는 systemd 붙이기

---

## 현재 제한 사항
- webhook / 서버 상시 실행은 v1 범위 밖
- 다중 Notion DB, 다중 Calendar 미지원
- 양방향 sync 미지원
- 실제 live auth/permission은 사용자 환경에 따라 추가 설정이 필요할 수 있음

---

## 테스트 철학
이 프로젝트는 **test-first** 를 기본으로 합니다.
- contract/fixture 먼저
- adapter 테스트 먼저
- sync 로직 변경 전에 regression test 먼저
- acceptance 기준이 test 이름으로 추적 가능해야 함

---

## 프로젝트 구조
```txt
src/
  cli/
  config/
  domain/
  adapters/
    notion/
    google/
  sync/
  shared/

tests/
  fixtures/
  unit/
  integration/
  acceptance/
```

---

## 공개 repo 유지보수 원칙
- 한 파일 한 책임
- Notion/Google SDK 세부 사항은 `adapters/` 안에만
- 핵심 sync 규칙은 `sync/` 안에만
- README만 보고 처음 실행 가능해야 함
- `.env.example` 와 실제 코드가 항상 일치해야 함

---

## 안전 주의
- `.env` 는 절대 커밋하지 마세요
- `credentials/` 아래 파일도 절대 커밋하지 마세요
- 먼저 테스트 캘린더로만 검증하세요
