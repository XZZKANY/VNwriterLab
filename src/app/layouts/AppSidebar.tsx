import { NavLink } from "react-router-dom";
import { navigationGroups } from "./appShell.config";

export function AppSidebar() {
  return (
    <aside className="app-shell__sidebar">
      <div className="app-shell__brand">
        <span className="app-shell__brand-mark">VN Writer Lab</span>
        <span className="app-shell__brand-subtitle">Narrative Studio</span>
      </div>
      <nav aria-label="主导航" className="app-shell__nav">
        {navigationGroups.map((group) => (
          <div key={group.label} className="app-shell__nav-group">
            <p className="app-shell__nav-group-label">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  isActive
                    ? "app-shell__nav-link is-active"
                    : "app-shell__nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
