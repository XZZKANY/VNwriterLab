import { NavLink, Outlet } from "react-router-dom";

const navigationItems: Array<{
  to: string;
  label: string;
  end?: boolean;
}> = [
  { to: "/", label: "项目首页", end: true },
  { to: "/editor", label: "剧情编辑" },
  { to: "/graph", label: "分支图" },
  { to: "/views", label: "多视图" },
  { to: "/characters", label: "角色" },
  { to: "/lore", label: "设定" },
  { to: "/preview", label: "预览" },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">VN Writer Lab</div>
        <nav aria-label="主导航" className="app-shell__nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                isActive ? "app-shell__nav-link is-active" : "app-shell__nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
