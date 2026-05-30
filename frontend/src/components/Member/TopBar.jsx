function TopBar({ user, onLogout }) {
  return (
    <div className="dashboard-navbar__top">
      <div className="dashboard-navbar__inner dashboard-navbar__inner--top">
        <span className="app-navbar__logo">cin&eacute;polis</span>

        <div className="app-navbar__user dashboard-user">
          <span className="app-navbar__avatar">{user.name.charAt(0)}</span>
          <span className="dashboard-user__name">{user.name}</span>
          <button className="app-navbar__button" type="button" onClick={onLogout}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
