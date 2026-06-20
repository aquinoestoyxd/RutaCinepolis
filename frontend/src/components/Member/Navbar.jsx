import MainNavigation from "./MainNavigation";
import TopBar from "./TopBar";

function Navbar({ user, onLogout }) {
  return (
    <header className="dashboard-navbar">
      <TopBar user={user} onLogout={onLogout} />
      <MainNavigation />
    </header>
  );
}

export default Navbar;

