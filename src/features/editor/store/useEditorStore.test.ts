import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "./useEditorStore";

describe("useEditorStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.getState().resetEditor();
  });

  it("更新选项块后会同步写入元数据和跳转连线", () => {
    useEditorStore.getState().createScene();
    const startSceneId = useEditorStore.getState().scenes[0]?.id;

    useEditorStore.getState().createScene();
    const targetSceneId = useEditorStore.getState().scenes[1]?.id;

    useEditorStore.setState({ selectedSceneId: startSceneId ?? null });
    useEditorStore.getState().addBlock("choice");

    const choiceBlock = useEditorStore.getState().scenes[0]?.blocks[0];

    (
      useEditorStore.getState() as unknown as {
        updateChoiceBlock: (
          sceneId: string,
          blockId: string,
          input: { label: string; targetSceneId: string | null },
        ) => void;
      }
    ).updateChoiceBlock(startSceneId!, choiceBlock!.id, {
      label: "去旧校舍",
      targetSceneId: targetSceneId!,
    });

    const updatedBlock = useEditorStore.getState().scenes[0]?.blocks[0];

    expect(updatedBlock?.metaJson).not.toBeNull();
    expect(JSON.parse(updatedBlock!.metaJson!)).toEqual({
      label: "去旧校舍",
      targetSceneId,
    });
    expect(useEditorStore.getState().links).toEqual([
      expect.objectContaining({
        fromSceneId: startSceneId,
        toSceneId: targetSceneId,
        label: "去旧校舍",
        sourceBlockId: choiceBlock?.id,
        linkType: "choice",
      }),
    ]);
  });
});
