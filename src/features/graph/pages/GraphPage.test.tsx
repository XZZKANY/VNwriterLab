import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { useEditorStore } from "../../editor/store/useEditorStore";
import { GraphPage } from "./GraphPage";

function EditorProbe() {
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);

  return <div>编辑器场景：{selectedSceneId ?? "未选择"}</div>;
}

describe("GraphPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({ currentProject: null });
    useEditorStore.getState().resetEditor();
    cleanup();
  });

  function renderGraphPage() {
    return render(
      <MemoryRouter initialEntries={["/graph"]}>
        <Routes>
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/editor" element={<EditorProbe />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("显示分支图页标题与筛选入口", () => {
    renderGraphPage();

    expect(
      screen.getByRole("heading", { name: "分支图" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("路线筛选")).toBeInTheDocument();
    expect(screen.getByLabelText("只看问题节点")).toBeInTheDocument();
  });

  it("显示条件摘要并提供返回编辑入口", async () => {
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
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去问题节点",
                targetSceneId: "s2",
                effectVariableId: null,
                effectValue: 0,
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
          sourceBlockId: "b2",
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
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
      ],
    });

    renderGraphPage();

    const conditionSummary = screen.getByRole("region", {
      name: "条件摘要",
    });

    expect(within(conditionSummary).getByText("序章")).toBeInTheDocument();
    expect(within(conditionSummary).getByText("旧校舍")).toBeInTheDocument();
    expect(
      within(conditionSummary).getByText(/去旧校舍：勇气值 ≥ 3/),
    ).toBeInTheDocument();

    await user.click(
      within(conditionSummary).getByRole("button", { name: "返回编辑：序章" }),
    );

    expect(screen.getByText("编辑器场景：s1")).toBeInTheDocument();
  });

  it("切换到单条路线后只显示该路线的节点、连线和摘要", async () => {
    const user = userEvent.setup();

    useProjectStore.setState({
      currentProject: {
        id: "p1",
        name: "测试项目",
        summary: "",
        projectType: "route_based",
        routes: [
          {
            id: "r1",
            projectId: "p1",
            name: "路线一",
            routeType: "character",
            description: "",
            sortOrder: 0,
          },
          {
            id: "r2",
            projectId: "p1",
            name: "路线二",
            routeType: "character",
            description: "",
            sortOrder: 1,
          },
        ],
        scenes: [],
      },
    });

    useEditorStore.setState({
      scenes: [
        {
          id: "r1-s1",
          projectId: "p1",
          routeId: "r1",
          title: "路线一开端",
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
              id: "r1-b1",
              sceneId: "r1-s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "r1-b2",
              sceneId: "r1-s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: null,
            },
          ],
        },
        {
          id: "r1-s2",
          projectId: "p1",
          routeId: "r1",
          title: "路线一节点",
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
        {
          id: "r2-s1",
          projectId: "p1",
          routeId: "r2",
          title: "路线二开端",
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
              id: "r2-b1",
              sceneId: "r2-s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v2",
                operator: "gte",
                compareValue: 5,
              }),
            },
            {
              id: "r2-b2",
              sceneId: "r2-s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: null,
            },
          ],
        },
        {
          id: "r2-s2",
          projectId: "p1",
          routeId: "r2",
          title: "路线二节点",
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
          id: "r1-l1",
          projectId: "p1",
          fromSceneId: "r1-s1",
          toSceneId: "r1-s2",
          linkType: "choice",
          sourceBlockId: "r1-b2",
          label: "前往路线一节点",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "r2-l1",
          projectId: "p1",
          fromSceneId: "r2-s1",
          toSceneId: "r2-s2",
          linkType: "choice",
          sourceBlockId: "r2-b2",
          label: "前往路线二节点",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "r1-s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "信赖值",
          variableType: "number",
          defaultValue: 1,
        },
      ],
    });

    renderGraphPage();

    await user.selectOptions(screen.getByLabelText("路线筛选"), "single");
    await user.selectOptions(screen.getByLabelText("单条路线"), "r1");

    const conditionSummary = screen.getByRole("region", {
      name: "条件摘要",
    });

    expect(within(conditionSummary).getByText("路线一开端")).toBeInTheDocument();
    expect(within(conditionSummary).getByText("路线一节点")).toBeInTheDocument();
    expect(
      within(conditionSummary).getByText(/前往路线一节点：勇气值 ≥ 3/),
    ).toBeInTheDocument();
    expect(
      within(conditionSummary).queryByText("路线二开端"),
    ).not.toBeInTheDocument();
    expect(
      within(conditionSummary).queryByText("路线二节点"),
    ).not.toBeInTheDocument();
    expect(
      within(conditionSummary).queryByText(/前往路线二节点：信赖值 ≥ 5/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("前往路线二节点")).not.toBeInTheDocument();
  });

  it("切换到只看问题节点后只显示问题节点子图", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
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
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v1",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去问题节点",
                targetSceneId: "s2",
                effectVariableId: null,
                effectValue: 0,
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "问题节点",
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
        {
          id: "s3",
          projectId: "p1",
          routeId: "r1",
          title: "前置节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 2,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b3",
              sceneId: "s3",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "v2",
                operator: "gte",
                compareValue: 5,
              }),
            },
            {
              id: "b4",
              sceneId: "s3",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
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
          label: "去问题节点",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "l2",
          projectId: "p1",
          fromSceneId: "s3",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b4",
          label: "从前置节点进入",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
        {
          id: "v2",
          projectId: "p1",
          name: "信赖值",
          variableType: "number",
          defaultValue: 1,
        },
      ],
    });

    renderGraphPage();

    await user.click(screen.getByLabelText("只看问题节点"));

    const conditionSummary = screen.getByRole("region", {
      name: "条件摘要",
    });

    expect(within(conditionSummary).queryByText("起点")).not.toBeInTheDocument();
    expect(
      within(conditionSummary).getByText("问题节点"),
    ).toBeInTheDocument();
    expect(
      within(conditionSummary).getByText("前置节点"),
    ).toBeInTheDocument();
    expect(
      within(conditionSummary).getByText(/从前置节点进入：信赖值 ≥ 5/),
    ).toBeInTheDocument();
    expect(
      within(conditionSummary).queryByText(/去问题节点：勇气值 ≥ 3/),
    ).not.toBeInTheDocument();
  });

  it("显示问题明细并在只看问题节点时跟随当前子图收缩", async () => {
    const user = userEvent.setup();

    useEditorStore.setState({
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
          blocks: [
            {
              id: "b1",
              sceneId: "s1",
              blockType: "condition",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                variableId: "deleted-variable",
                operator: "gte",
                compareValue: 3,
              }),
            },
            {
              id: "b2",
              sceneId: "s1",
              blockType: "choice",
              sortOrder: 1,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "去问题节点",
                targetSceneId: "s2",
              }),
            },
          ],
        },
        {
          id: "s2",
          projectId: "p1",
          routeId: "r1",
          title: "问题节点",
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
        {
          id: "s3",
          projectId: "p1",
          routeId: "r1",
          title: "前置节点",
          summary: "",
          sceneType: "branch",
          status: "draft",
          chapterLabel: "",
          sortOrder: 2,
          isStartScene: false,
          isEndingScene: false,
          notes: "",
          blocks: [
            {
              id: "b3",
              sceneId: "s3",
              blockType: "choice",
              sortOrder: 0,
              characterId: null,
              contentText: "",
              metaJson: JSON.stringify({
                label: "从前置节点进入",
                targetSceneId: "missing-scene",
                effectVariableId: "deleted-effect-variable",
                effectValue: 1,
              }),
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
          label: "去问题节点",
          conditionId: null,
          priorityOrder: 0,
        },
        {
          id: "l2",
          projectId: "p1",
          fromSceneId: "s3",
          toSceneId: "s2",
          linkType: "choice",
          sourceBlockId: "b3",
          label: "从前置节点进入",
          conditionId: null,
          priorityOrder: 0,
        },
      ],
      selectedSceneId: "s1",
      variables: [
        {
          id: "v1",
          projectId: "p1",
          name: "勇气值",
          variableType: "number",
          defaultValue: 2,
        },
      ],
    });

    renderGraphPage();

    const issueSummary = screen.getByRole("region", {
      name: "问题明细",
    });

    expect(within(issueSummary).getByText("起点")).toBeInTheDocument();
    expect(within(issueSummary).getByText("问题分类：条件异常")).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("条件块引用了已删除变量"),
    ).toBeInTheDocument();
    expect(within(issueSummary).getByText("前置节点")).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("问题分类：空场景、无出口"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("问题分类：无入边、跳转异常、副作用异常"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("选项块跳转到不存在的场景"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("选项块副作用引用了已删除变量"),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("只看问题节点"));

    expect(within(issueSummary).getByText("起点")).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("前置节点"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("问题节点"),
    ).toBeInTheDocument();
    expect(
      within(issueSummary).getByText("选项块副作用引用了已删除变量"),
    ).toBeInTheDocument();
  });
});
