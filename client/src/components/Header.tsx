import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Header() {
  const navigate = useNavigate();
  const { clearCart, totalQuantity } = useCart();
  const { role, logout } = useAuth();

  function handleLogout() {
    clearCart();
    logout();
    navigate('/');
  }

  function handleLogoClick() {
    if (role === 'guest') {
      clearCart();
    }
  }

  return (
    <header className="app-header">
      <Link className="app-logo" to="/" onClick={handleLogoClick}>
        Drink Kiosk
      </Link>

      <nav className="app-nav" aria-label="주요 메뉴">
        {role === 'guest' && (
          <Link className="secondary-button" to="/login">
            로그인
          </Link>
        )}
        {role === 'user' && (
          <Link className="secondary-button" to="/orders">
            주문 내역
          </Link>
        )}
        {role === 'admin' && (
          <Link className="secondary-button" to="/admin">
            관리자
          </Link>
        )}
        {role !== 'guest' && (
          <button className="secondary-button" type="button" onClick={handleLogout}>
            로그아웃
          </button>
        )}
        <Link className="cart-button" to="/cart">
          장바구니 {totalQuantity > 0 ? totalQuantity : ''}
        </Link>
      </nav>
    </header>
  );
}
