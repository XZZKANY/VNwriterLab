import { Suspense, lazy, type ReactElement } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./app/layouts/AppShell";
import "./styles.css";

const LazyProjectHomePage = lazy(() =>
  import("./features/projects/pages/ProjectHomePage").then((module) => ({
    default: module.ProjectHomePage,
  })),
);
const LazyEditorPage = lazy(() =>
  import("./features/editor/pages/EditorPage").then((module) => ({
    default: module.EditorPage,
  })),
);
const LazyGraphPage = lazy(() =>
  import("./features/graph/pages/GraphPage").then((module) => ({
    default: module.GraphPage,
  })),
);
const LazyViewsPage = lazy(() =>
  import("./features/views/pages/ViewsPage").then((module) => ({
    default: module.ViewsPage,
  })),
);
const LazyCharactersPage = lazy(() =>
  import("./features/characters/pages/CharactersPage").then((module) => ({
    default: module.CharactersPage,
  })),
);
const LazyLorePage = lazy(() =>
  import("./features/lore/pages/LorePage").then((module) => ({
    default: module.LorePage,
  })),
);
const LazyPreviewPage = lazy(() =>
  import("./features/preview/pages/PreviewPage").then((module) => ({
    default: module.PreviewPage,
  })),
);

function withRouteSuspense(element: ReactElement) {
  return (
    <Suspense fallback={<p role="status">页面加载中...</p>}>{element}</Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: withRouteSuspense(
          <>
            <LazyProjectHomePage />
            <footer className="app-version">
              当前版本：V1 桌面创作闭环验证版
            </footer>
          </>,
        ),
      },
      {
        path: "editor",
        element: withRouteSuspense(<LazyEditorPage />),
      },
      {
        path: "graph",
        element: withRouteSuspense(<LazyGraphPage />),
      },
      {
        path: "views",
        element: withRouteSuspense(<LazyViewsPage />),
      },
      {
        path: "characters",
        element: withRouteSuspense(<LazyCharactersPage />),
      },
      {
        path: "lore",
        element: withRouteSuspense(<LazyLorePage />),
      },
      {
        path: "preview",
        element: withRouteSuspense(<LazyPreviewPage />),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RouterProvider router={router} />,
);
