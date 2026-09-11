# Database Setup

이 프로젝트는 PostgreSQL을 사용합니다.

## 1. PostgreSQL 설치

로컬 개발용으로 PostgreSQL 17을 추천합니다.

설치 중 비밀번호를 묻는다면 학습 편의를 위해 아래 값으로 설정합니다.

```text
postgres
```

이 비밀번호는 `server/.env`의 `DATABASE_URL` 예시와 맞춰 둔 값입니다.

## 2. DB 생성

PostgreSQL 설치 후 PowerShell에서 아래 명령을 실행합니다.

```powershell
createdb -U postgres drink_kiosk
```

비밀번호를 물으면 설치할 때 정한 비밀번호를 입력합니다.

## 3. 테이블 생성

```powershell
psql -U postgres -d drink_kiosk -f database/schema.sql
```

## 4. 초기 메뉴 데이터 넣기

```powershell
psql -U postgres -d drink_kiosk -f database/seed.sql
```

## 5. 서버 환경변수 설정

`server/.env.example` 파일을 복사해서 `server/.env` 파일을 만듭니다.

```text
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/drink_kiosk
```

## 6. 확인

서버를 켠 뒤 아래 주소를 확인합니다.

```text
http://localhost:4000/api/menus
```

메뉴 JSON 배열이 나오면 DB와 Express 연결이 성공한 것입니다.
