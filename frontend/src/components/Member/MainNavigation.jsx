import { useState } from "react";

const navigationItems = [
  { label: "Cartelera", href: "/" },
  { label: "Peliculas", href: "/" },
  { label: "Club Cinepolis", href: "/dashboard", active: true },
  { label: "Promociones", href: "/" },
  { label: "Beneficios", href: "#beneficios" },
];

function MainNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dashboard-navbar__navigation">
      <div className="dashboard-navbar__inner dashboard-navbar__inner--navigation">
        <button
          className="dashboard-navbar__toggle"
          type="button"
          aria-label="Abrir navegacion"
          aria-expanded={isOpen}
          aria-controls="dashboard-main-navigation"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="dashboard-main-navigation"
          className={`app-navbar__links dashboard-navbar__links ${isOpen ? "is-open" : ""}`}
        >
          {navigationItems.map((item) => (
            <a
              className={item.active ? "is-active" : undefined}
              href={item.href}
              key={item.label}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MainNavigation;
