import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./app/layouts/AppShell";
import { CharactersPage } from "./features/characters/pages/CharactersPage";
import { EditorPage } from "./features/editor/pages/EditorPage";
import { GraphPage } from "./features/graph/pages/GraphPage";
import { LorePage } from "./features/lore/pages/LorePage";
import { PreviewPage } from "./features/preview/pages/PreviewPage";
import { ProjectHomePage } from "./features/projects/pages/ProjectHomePage";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <>
            <ProjectHomePage />
            <footer style={{ marginTop: "24px", color: "#6b7280" }}>
              当前版本：V1 桌面创作闭环验证版
            </footer>
          </>
        ),
      },
      {
        path: "editor",
        element: <EditorPage />,
      },
      {
        path: "graph",
        element: <GraphPage />,
      },
      {
        path: "characters",
        element: <CharactersPage />,
      },
      {
        path: "lore",
        element: <LorePage />,
      },
      {
        path: "preview",
        element: <PreviewPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RouterProvider router={router} />,
);
