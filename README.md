# Drink Kiosk

음료 키오스크 웹 프로젝트입니다.

## 목표

- React에서 메뉴를 보여준다.
- Express API가 PostgreSQL에서 데이터를 조회한다.
- 사용자는 장바구니에 메뉴를 담고 전화번호를 입력해 주문한다.
- 실제 결제는 구현하지 않는다.

## 폴더 구조

```text
client/    React 화면
server/    Express API 서버
database/  DB schema와 seed SQL
```

## 첫 개발 목표

첫 번째 목표는 메뉴 조회 흐름을 연결하는 것입니다.

```text
PostgreSQL menus 테이블
  -> Express GET /api/menus
  -> React MenuPage
```

## DB 설정

PostgreSQL 설치와 SQL 적용 방법은 [database/README.md](database/README.md)를 참고합니다.
