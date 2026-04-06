import { describe, expect, it } from "vitest";
import { buildProjectStats } from "./projectStats";

describe("buildProjectStats", () => {
  it("会统计项目首页所需的核心数量并复用问题场景数", () => {
    const stats = buildProjectStats({
      project: {
        id: "p1",
        name: "雨夜回响",
        summary: "",
        projectType: "route_based",
        routes: [
          {
            id: "r1",
            projectId: "p1",
            name: "共通线",
            routeType: "common",
            description: "",
            sortOrder: 0,
          },
        ],
        scenes: [
          {
            id: "s1",
            projectId: "p1",
            routeId: "r1",
            title: "起点",
            summary: "",
            sceneType: "normal",
            status: "draft",
            chapterLabel: "",
            sortOrder: 0,
            isStartScene: true,
            isEndingScene: false,
            notes: "",
            blocks: [],
          },
          {
            id: "s2",
            projectId: "p1",
            routeId: "r1",
            title: "结局",
            summary: "",
            sceneType: "ending",
            status: "completed",
            chapterLabel: "",
            sortOrder: 1,
            isStartScene: false,
            isEndingScene: true,
            notes: "",
            blocks: [],
          },
        ],
      },
      editorScenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "起点",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "结局",
          summary: "",
          sceneType: "ending",
          status: "completed",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: true,
          notes: "",
          blocks: [],
        },
      ],
      links: [],
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气",
          variableType: "number",
          defaultValue: 0,
        },
      ],
      characters: [
        {
          id: "c1",
          projectId: "p1",
          name: "林夏",
          identity: "",
          appearance: "",
          personality: "",
          goal: "",
          secret: "",
          routeId: null,
          notes: "",
        },
      ],
      loreEntries: [
        {
          id: "l1",
          projectId: "p1",
          name: "旧校舍",
          category: "location",
          description: "",
          tags: [],
        },
      ],
    });

    expect(stats).toEqual({
      routeCount: 1,
      sceneCount: 2,
      endingSceneCount: 1,
      variableCount: 1,
      characterCount: 1,
      loreCount: 1,
      issueSceneCount: 2,
    });
  });

  it("只统计当前项目的数据，不会把其他项目的内容算进去", () => {
    const stats = buildProjectStats({
      project: {
        id: "p1",
        name: "雨夜回响",
        summary: "",
        projectType: "route_based",
        routes: [
          {
            id: "r1",
            projectId: "p1",
            name: "共通线",
            routeType: "common",
            description: "",
            sortOrder: 0,
          },
        ],
        scenes: [],
      },
      editorScenes: [
        {
          id: "s1",
          projectId: "p2",
          routeId: "r2",
          title: "其他项目场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      links: [],
      variables: [
        {
          id: "v1",
          projectId: "p2",
          name: "勇气",
          variableType: "number",
          defaultValue: 0,
        },
      ],
      characters: [
        {
          id: "c1",
          projectId: "p2",
          name: "林夏",
          identity: "",
          appearance: "",
          personality: "",
          goal: "",
          secret: "",
          routeId: null,
          notes: "",
        },
      ],
      loreEntries: [
        {
          id: "l1",
          projectId: "p2",
          name: "旧校舍",
          category: "location",
          description: "",
          tags: [],
        },
      ],
    });

    expect(stats).toEqual({
      routeCount: 1,
      sceneCount: 0,
      endingSceneCount: 0,
      variableCount: 0,
      characterCount: 0,
      loreCount: 0,
      issueSceneCount: 0,
    });
  });

  it("会把编辑态里新增但项目快照里还没有的当前项目场景算进去", () => {
    const stats = buildProjectStats({
      project: {
        id: "p1",
        name: "雨夜回响",
        summary: "",
        projectType: "route_based",
        routes: [
          {
            id: "r1",
            projectId: "p1",
            name: "共通线",
            routeType: "common",
            description: "",
            sortOrder: 0,
          },
        ],
        scenes: [],
      },
      editorScenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "起点",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      links: [],
      variables: [],
      characters: [],
      loreEntries: [],
    });

    expect(stats).toEqual({
      routeCount: 1,
      sceneCount: 1,
      endingSceneCount: 0,
      variableCount: 0,
      characterCount: 0,
      loreCount: 0,
      issueSceneCount: 1,
    });
  });
});
