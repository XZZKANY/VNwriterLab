import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./app/layouts/AppShell";
import { EditorPage } from "./features/editor/pages/EditorPage";
import { GraphPage } from "./features/graph/pages/GraphPage";
import { ProjectHomePage } from "./features/projects/pages/ProjectHomePage";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <ProjectHomePage />,
      },
      {
        path: "editor",
        element: <EditorPage />,
      },
      {
        path: "graph",
        element: <GraphPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RouterProvider router={router} />,
);
