import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!identifier.trim()) {
      setMessage('전화번호 또는 관리자 코드를 입력해주세요.');
      return;
    }

    login(identifier);
    navigate('/');
  }

  return (
    <main className="page">
      <header className="page-title">
        <p>Login</p>
        <h1>로그인</h1>
      </header>

      <section className="login-panel">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier">전화번호 또는 관리자 코드</label>
            <input
              id="identifier"
              name="identifier"
              placeholder="전화번호 또는 knda123"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
            <p>전화번호는 일반 주문 내역 조회에, knda123은 관리자 화면 진입에 사용합니다.</p>
          </div>

          <button className="primary-button" type="submit">
            로그인
          </button>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}
