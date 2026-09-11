INSERT INTO menus (name, description, category, price, image_url, is_available)
VALUES
  ('아메리카노', '진한 에스프레소에 물을 더한 기본 커피입니다.', 'coffee', 3000, NULL, true),
  ('카페라떼', '에스프레소와 우유가 어우러진 부드러운 커피입니다.', 'coffee', 4000, NULL, true),
  ('바닐라라떼', '바닐라 시럽을 더한 달콤한 라떼입니다.', 'coffee', 4500, NULL, true),
  ('초코라떼', '진한 초콜릿과 우유로 만든 음료입니다.', 'non-coffee', 4200, NULL, true),
  ('레몬에이드', '상큼한 레몬 맛의 탄산 음료입니다.', 'ade', 4500, NULL, true),
  ('복숭아 아이스티', '복숭아 향이 나는 시원한 티 음료입니다.', 'tea', 3500, NULL, true)
ON CONFLICT DO NOTHING;
