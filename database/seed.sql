ALTER TABLE menus
ADD COLUMN IF NOT EXISTS option_groups JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS selected_options JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE admin_order_items
ADD COLUMN IF NOT EXISTS selected_options JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO menus (name, description, category, price, image_url, option_groups, is_available)
SELECT *
FROM (
  VALUES
    ('아메리카노', '진한 에스프레소에 물을 더한 기본 커피입니다.', 'coffee', 3000, '/images/menu/americano.png', '[
      {"id":"temperature","name":"온도","options":[{"id":"hot","label":"HOT","priceDelta":0},{"id":"ice","label":"ICE","priceDelta":0}]},
      {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
    ]'::jsonb, true),
    ('카페라떼', '에스프레소와 우유가 어우러진 부드러운 커피입니다.', 'coffee', 4000, '/images/menu/cafe-latte.png', '[
      {"id":"temperature","name":"온도","options":[{"id":"hot","label":"HOT","priceDelta":0},{"id":"ice","label":"ICE","priceDelta":0}]},
      {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
    ]'::jsonb, true),
    ('바닐라라떼', '바닐라 시럽을 더한 달콤한 라떼입니다.', 'coffee', 4500, '/images/menu/vanilla-latte.png', '[
      {"id":"temperature","name":"온도","options":[{"id":"hot","label":"HOT","priceDelta":0},{"id":"ice","label":"ICE","priceDelta":0}]},
      {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
    ]'::jsonb, true),
    ('초코라떼', '진한 초콜릿과 우유로 만든 음료입니다.', 'non-coffee', 4200, '/images/menu/choco-latte.png', '[
      {"id":"temperature","name":"온도","options":[{"id":"hot","label":"HOT","priceDelta":0},{"id":"ice","label":"ICE","priceDelta":0}]},
      {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
    ]'::jsonb, true),
    ('레몬에이드', '상큼한 레몬 맛의 탄산 음료입니다.', 'ade', 4500, '/images/menu/lemon-ade.png', '[
      {"id":"temperature","name":"온도","options":[{"id":"ice","label":"ICE","priceDelta":0}]},
      {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
    ]'::jsonb, true),
    ('복숭아 아이스티', '복숭아 향이 나는 시원한 티 음료입니다.', 'tea', 3500, '/images/menu/peach-iced-tea.png', '[
      {"id":"temperature","name":"온도","options":[{"id":"ice","label":"ICE","priceDelta":0}]},
      {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
    ]'::jsonb, true)
) AS seed_menus(name, description, category, price, image_url, option_groups, is_available)
WHERE NOT EXISTS (
  SELECT 1
  FROM menus
  WHERE menus.name = seed_menus.name
);

UPDATE menus
SET image_url = CASE name
  WHEN '아메리카노' THEN '/images/menu/americano.png'
  WHEN '카페라떼' THEN '/images/menu/cafe-latte.png'
  WHEN '바닐라라떼' THEN '/images/menu/vanilla-latte.png'
  WHEN '초코라떼' THEN '/images/menu/choco-latte.png'
  WHEN '레몬에이드' THEN '/images/menu/lemon-ade.png'
  WHEN '복숭아 아이스티' THEN '/images/menu/peach-iced-tea.png'
  ELSE image_url
END
WHERE name IN ('아메리카노', '카페라떼', '바닐라라떼', '초코라떼', '레몬에이드', '복숭아 아이스티');

UPDATE menus
SET option_groups = '[
  {"id":"temperature","name":"온도","options":[{"id":"hot","label":"HOT","priceDelta":0},{"id":"ice","label":"ICE","priceDelta":0}]},
  {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
]'::jsonb
WHERE name IN ('아메리카노', '카페라떼', '바닐라라떼', '초코라떼')
  AND option_groups = '[]'::jsonb;

UPDATE menus
SET option_groups = '[
  {"id":"temperature","name":"온도","options":[{"id":"ice","label":"ICE","priceDelta":0}]},
  {"id":"size","name":"사이즈","options":[{"id":"regular","label":"Regular","priceDelta":0},{"id":"large","label":"Large","priceDelta":500}]}
]'::jsonb
WHERE name IN ('레몬에이드', '복숭아 아이스티')
  AND option_groups = '[]'::jsonb;
