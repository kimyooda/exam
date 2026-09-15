import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

export async function getMenus(_request: Request, response: Response) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        category,
        price,
        image_url AS "imageUrl",
        option_groups AS "optionGroups",
        is_available AS "isAvailable"
      FROM menus
      WHERE is_available = true
      ORDER BY id ASC
    `);

    response.json(result.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '메뉴 목록을 불러오지 못했습니다.' });
  }
}

export async function getMenuById(request: Request, response: Response) {
  const menuId = Number(request.params.id);

  if (Number.isNaN(menuId)) {
    response.status(400).json({ message: '메뉴 ID가 올바르지 않습니다.' });
    return;
  }

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          description,
          category,
          price,
          image_url AS "imageUrl",
          option_groups AS "optionGroups",
          is_available AS "isAvailable"
        FROM menus
        WHERE id = $1 AND is_available = true
      `,
      [menuId]
    );

    if (result.rowCount === 0) {
      response.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
      return;
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '메뉴를 불러오지 못했습니다.' });
  }
}
