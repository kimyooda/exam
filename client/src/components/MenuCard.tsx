import { Link } from 'react-router-dom';
import type { Menu } from '../types/menu';

type MenuCardProps = {
  menu: Menu;
};

export function MenuCard({ menu }: MenuCardProps) {
  return (
    <article className="menu-card">
      <div className="menu-card__image">
        {menu.imageUrl ? <img src={menu.imageUrl} alt={menu.name} /> : <span>Drink</span>}
      </div>
      <div className="menu-card__body">
        <h2>{menu.name}</h2>
        <strong>{menu.price.toLocaleString()}원</strong>
      </div>
      <Link className="menu-card__link" to={`/menu/${menu.id}`}>
        선택
      </Link>
    </article>
  );
}
