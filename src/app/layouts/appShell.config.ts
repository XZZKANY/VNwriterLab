export interface NavigationItem {
  to: string;
  label: string;
  end?: boolean;
}

export interface NavigationGroup {
  label: string;
  items: ReadonlyArray<NavigationItem>;
}

export const navigationGroups: ReadonlyArray<NavigationGroup> = [
  {
    label: "工作台",
    items: [{ to: "/", label: "项目首页", end: true }],
  },
  {
    label: "创作",
    items: [
      { to: "/editor", label: "剧情编辑" },
      { to: "/graph", label: "分支图" },
      { to: "/views", label: "多视图" },
    ],
  },
  {
    label: "资料",
    items: [
      { to: "/characters", label: "角色" },
      { to: "/lore", label: "设定" },
    ],
  },
  {
    label: "输出",
    items: [{ to: "/preview", label: "预览" }],
  },
];

export interface RouteMeta {
  title: string;
  primaryActionLabel: string;
}

export const routeMeta: Record<string, RouteMeta> = {
  "/": { title: "项目首页", primaryActionLabel: "继续写作" },
  "/editor": { title: "剧情编辑", primaryActionLabel: "新建场景" },
  "/graph": { title: "分支图", primaryActionLabel: "继续写作" },
  "/views": { title: "多视图", primaryActionLabel: "继续写作" },
  "/characters": { title: "角色", primaryActionLabel: "新增角色" },
  "/lore": { title: "设定", primaryActionLabel: "新建设定" },
  "/preview": { title: "预览", primaryActionLabel: "从开头预览" },
};

const DEFAULT_ROUTE_META: RouteMeta = {
  title: "VN Writer Lab",
  primaryActionLabel: "继续写作",
};

export function resolveRouteMeta(pathname: string): RouteMeta {
  if (routeMeta[pathname]) {
    return routeMeta[pathname];
  }
  const matchedKey = Object.keys(routeMeta).find(
    (key) => key !== "/" && pathname.startsWith(key),
  );
  return matchedKey ? routeMeta[matchedKey] : DEFAULT_ROUTE_META;
}
