import { describe, expect, it } from "vitest";
import {
  navigationGroups,
  resolveRouteMeta,
  routeMeta,
} from "./appShell.config";

describe("appShell.config", () => {
  describe("navigationGroups", () => {
    it("包含工作台 / 创作 / 资料 / 输出 四个分组", () => {
      const labels = navigationGroups.map((group) => group.label);
      expect(labels).toEqual(["工作台", "创作", "资料", "输出"]);
    });

    it("V1 七个核心页面都被收录", () => {
      const allHrefs = navigationGroups.flatMap((group) =>
        group.items.map((item) => item.to),
      );
      expect(allHrefs).toEqual(
        expect.arrayContaining([
          "/",
          "/editor",
          "/graph",
          "/views",
          "/characters",
          "/lore",
          "/preview",
        ]),
      );
    });

    it("项目首页 item 必须设置 end:true 以避免子路由匹配", () => {
      const homeItem = navigationGroups
        .flatMap((group) => group.items)
        .find((item) => item.to === "/");
      expect(homeItem?.end).toBe(true);
    });
  });

  describe("routeMeta", () => {
    it("覆盖所有 navigation 路径", () => {
      const allHrefs = navigationGroups.flatMap((group) =>
        group.items.map((item) => item.to),
      );
      for (const href of allHrefs) {
        expect(routeMeta[href]).toBeDefined();
      }
    });
  });

  describe("resolveRouteMeta", () => {
    it("精确匹配根路径 /", () => {
      expect(resolveRouteMeta("/").title).toBe("项目首页");
      expect(resolveRouteMeta("/").primaryActionLabel).toBe("继续写作");
    });

    it("精确匹配各级页面", () => {
      expect(resolveRouteMeta("/editor").title).toBe("剧情编辑");
      expect(resolveRouteMeta("/editor").primaryActionLabel).toBe("新建场景");
      expect(resolveRouteMeta("/graph").title).toBe("分支图");
      expect(resolveRouteMeta("/preview").primaryActionLabel).toBe(
        "从开头预览",
      );
    });

    it("子路径前缀匹配父级 meta（例如 /editor/scene-1 → /editor）", () => {
      expect(resolveRouteMeta("/editor/scene-1").title).toBe("剧情编辑");
      expect(resolveRouteMeta("/characters/abc").title).toBe("角色");
    });

    it("/ 不会被当成前缀匹配任意未知路径", () => {
      // 未知路径不应该误匹配到 "/" 而被当作"项目首页"——
      // 应回退到默认 meta
      expect(resolveRouteMeta("/some-unknown").title).toBe("VN Writer Lab");
    });

    it("空字符串和未定义路径回退到默认 meta", () => {
      expect(resolveRouteMeta("").title).toBe("VN Writer Lab");
      expect(resolveRouteMeta("/totally-not-a-route").primaryActionLabel).toBe(
        "继续写作",
      );
    });
  });
});
