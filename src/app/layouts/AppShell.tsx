import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

export function AppShell() {
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="app-shell__workspace">
        <AppTopbar />
        <main className="app-shell__content">
          <div className="app-shell__content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
