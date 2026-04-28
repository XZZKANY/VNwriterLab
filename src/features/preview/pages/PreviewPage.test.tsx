import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { PreviewPage } from "./PreviewPage";

describe("PreviewPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.getState().resetEditor();
    cleanup();
  });

  it("会显示统一工具栏和预览主区", () => {
    useEditorStore.setState({
      scenes: [],
      links: [],
      variables: [],
      selectedSceneId: null,
      selectedVariableId: null,
    });

    render(<PreviewPage />);

    expect(
      screen.getByRole("toolbar", { name: "预览工具栏" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "预览主区" }),
    ).toBeInTheDocument();
  });

  it("从开头预览后会展示起始场景并允许按选项跳转", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "narration",
              sortOrder: 0,
              characterId: null,
              contentText: "雨夜里传来脚步声。",
              metaJson: null,
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去旧校舍",
                targetSceneId: "s2",
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "旧校舍",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b3",
              sceneId: "s2",
              blockType: "narration",
              sortOrder: 0,
              characterId: null,
              contentText: "门后是一条漆黑的走廊。",
              metaJson: null,
            },
          ],
        },
      ],
      links: [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b2",
          label: "去旧校舍",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s2",
      variables: [],
    });

    render(<PreviewPage />);

    await user.click(screen.getByRole("button", { name: "从开头预览" }));

    expect(screen.getByText("序章")).toBeInTheDocument();
    expect(screen.getByText("雨夜里传来脚步声。")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "去旧校舍" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "去旧校舍" }));

    expect(screen.getByText("旧校舍")).toBeInTheDocument();
    expect(screen.getByText("门后是一条漆黑的走廊。")).toBeInTheDocument();
  });
  it("未满足条件时不会显示受限选项", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "c1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "isTrue",
                compareValue: 1,
              }),
            },
            {
              id: "b1",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "打开仓库门",
                targetSceneId: "s2",
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "仓库",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      links: [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b1",
          label: "打开仓库门",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "拥有钥匙",
          variableType: "flag",
          defaultValue: 0,
        },
      ],
    });

    render(<PreviewPage />);

    await user.click(screen.getByRole("button", { name: "从开头预览" }));

    expect(
      screen.queryByRole("button", { name: "打开仓库门" }),
    ).not.toBeInTheDocument();
  });

  it("选择带副作用的选项后会更新变量并影响后续条件", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "拿起钥匙",
                targetSceneId: "s2",
                effectVariableId: "v1",
                effectValue: 1,
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "仓库门前",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "c1",
              sceneId: "s2",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "isTrue",
                compareValue: 1,
              }),
            },
            {
              id: "b2",
              sceneId: "s2",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "打开仓库门",
                targetSceneId: "s3",
              }),
            },
          ],
        },
        {
          id: "s3",
          projectId: "p1",
          routeId: "r1",
          title: "仓库",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 2,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      links: [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b1",
          label: "拿起钥匙",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "l2",
          projectId: "p1",
          fromSceneId: "s2",
          toSceneId: "s3",
          linkType: "choice",
          sourceBlockId: "b2",
          label: "打开仓库门",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "拥有钥匙",
          variableType: "flag",
          defaultValue: 0,
        },
      ],
    });

    render(<PreviewPage />);

    await user.click(screen.getByRole("button", { name: "从开头预览" }));
    await user.click(screen.getByRole("button", { name: "拿起钥匙" }));

    expect(useEditorStore.getState().variables[0]?.defaultValue).toBe(0);
    expect(screen.getByText("仓库门前")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "打开仓库门" }),
    ).toBeInTheDocument();
  });

  it("起始场景不满足进入条件时会阻止进入", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "受限场景",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "c1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "isTrue",
                compareValue: 1,
              }),
            },
            {
              id: "b1",
              sceneId: "s1",
              blockType: "narration",
              sortOrder: 1,
              characterId: null,
              contentText: "只有满足条件才能看到这段内容。",
              metaJson: null,
            },
          ],
        },
      ],
      links: [],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "通行权限",
          variableType: "flag",
          defaultValue: 0,
        },
      ],
    });

    render(<PreviewPage />);

    await user.click(screen.getByRole("button", { name: "从当前节点预览" }));

    expect(
      screen.getByText("该场景当前无法进入，请先满足进入条件。"),
    ).toBeInTheDocument();
    expect(screen.queryByText("受限场景")).not.toBeInTheDocument();
    expect(
      screen.queryByText("只有满足条件才能看到这段内容。"),
    ).not.toBeInTheDocument();
  });

  it("多个条件同时成立时可以进入并显示选项", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "c1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                conditions: [
                  {
                    variableId: "v1",
                    operator: "isTrue",
                    compareValue: 1,
                  },
                  {
                    variableId: "v2",
                    operator: "gte",
                    compareValue: 3,
                  },
                ],
              }),
            },
            {
              id: "b1",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去旧校舍",
                targetSceneId: "s2",
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "旧校舍",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b2",
              sceneId: "s2",
              blockType: "narration",
              sortOrder: 0,
              characterId: null,
              contentText: "成功进入后的内容。",
              metaJson: null,
            },
          ],
        },
      ],
      links: [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b1",
          label: "去旧校舍",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "拥有钥匙",
          variableType: "flag",
          defaultValue: 1,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "门槛数值",
          variableType: "number",
          defaultValue: 3,
        },
      ],
    });

    render(<PreviewPage />);

    await user.click(screen.getByRole("button", { name: "从开头预览" }));

    expect(
      screen.getByRole("button", { name: "去旧校舍" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "去旧校舍" }));
    expect(screen.getByText("旧校舍")).toBeInTheDocument();
    expect(screen.getByText("成功进入后的内容。")).toBeInTheDocument();
  });

  it("多个条件中有一项不成立时不会进入", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
      scenes: [
        {
          id: "s1",
          projectId: "p1",
          routeId: "r1",
          title: "序章",
          summary: "",
          sceneType: "normal",
          status: "draft",
          chapterLabel: "",
          sortOrder: 0,
          isStartScene: true,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "c1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                conditions: [
                  {
                    variableId: "v1",
                    operator: "isTrue",
                    compareValue: 1,
                  },
                  {
                    variableId: "v2",
                    operator: "gte",
                    compareValue: 3,
                  },
                ],
              }),
            },
            {
              id: "b1",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去旧校舍",
                targetSceneId: "s2",
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "旧校舍",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 1,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [],
        },
      ],
      links: [
        {
          id: "l1",
          projectId: "p1",
          fromSceneId: "s1",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b1",
          label: "去旧校舍",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "拥有钥匙",
          variableType: "flag",
          defaultValue: 1,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "门槛数值",
          variableType: "number",
          defaultValue: 1,
        },
      ],
    });

    render(<PreviewPage />);

    await user.click(screen.getByRole("button", { name: "从开头预览" }));

    expect(
      screen.queryByRole("button", { name: "去旧校舍" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("该场景当前无法进入，请先满足进入条件。"),
    ).toBeInTheDocument();
  });
});
