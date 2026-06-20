import "./Login.css";
import "../../styles/global.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const benefits = [
  {
    title: "Compra tus entradas",
    text: "Rapido y facil",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5 9.5 4l10.5 10.5-5.5 5.5L4 9.5Z" />
        <path d="M8 8h.01M16 16h.01" />
      </svg>
    ),
  },
  {
    title: "Acumula puntos",
    text: "Con Club Cinepolis",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 14.7 8.5l6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    ),
  },
  {
    title: "Beneficios exclusivos",
    text: "Promociones y mas",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 10h5M7 14h3M16 14h1" />
      </svg>
    ),
  },
  {
    title: "Todo desde la app",
    text: "Descargala ahora",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="2.8" width="10" height="18.4" rx="2" />
        <path d="M10 18h4" />
      </svg>
    ),
  },
];

function Login() {
  const [cardNumber, setCardNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginByCard } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    const cleanCardNumber = cardNumber.replace(/\D/g, "");

    try {
      const result = await loginByCard(cleanCardNumber);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      navigate("/member/dashboard");
    } catch {
      setError("Error al conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-header">
        <div className="login-header__brand">
          <span className="cinepolis-logo">cin&eacute;polis</span>
          <span className="login-header__country">PER&Uacute;</span>
        </div>

        <div className="login-header__help">
          <span>&iquest;Necesitas ayuda?</span>
          <a href="/">Centro de ayuda</a>
        </div>
      </header>

      <section className="login-hero">
        <form className="login-card" onSubmit={handleSubmit}>
          <span className="login-card__logo">cin&eacute;polis</span>
          <h1>Inicia sesi&oacute;n con tu tarjeta</h1>
          <p className="login-card__subtitle">
            Ingresa tu n&uacute;mero de tarjeta Club Cin&eacute;polis.
          </p>

          <div className="login-field">
            <label htmlFor="cardNumber">N&uacute;mero de tarjeta</label>
            <div className="login-input">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18M7 15h2" />
              </svg>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="Ingresa los 16 digitos de tu tarjeta"
                maxLength="19"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
              />
            </div>
            {error && <p className="login-error">{error}</p>}
          </div>

          <button type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verificando tarjeta...' : 'Continuar'}
          </button>

          <p className="login-card__secure">
            <span aria-hidden="true">LOCK</span>
            Tu informaci&oacute;n esta segura con nosotros.
          </p>
        </form>
      </section>

      <section className="login-benefits" aria-label="Beneficios de Club Cinepolis">
        {benefits.map((benefit) => (
          <article className="login-benefit" key={benefit.title}>
            <span className="login-benefit__icon">{benefit.icon}</span>
            <div>
              <h2>{benefit.title}</h2>
              <p>{benefit.text}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Login;
