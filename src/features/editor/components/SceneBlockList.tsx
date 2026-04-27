import type { SceneBlock } from "@/lib/domain/block";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { ConditionBlockMeta } from "../store/conditionBlock";
import type { NoteBlockMeta } from "../store/noteBlock";
import { SceneBlockListItem } from "./SceneBlockListItem";

interface SceneBlockListProps {
  sceneId: string;
  blocks: SceneBlock[];
  scenes: Scene[];
  variables: ProjectVariable[];
  onDeleteBlock: (sceneId: string, blockId: string) => void;
  onMoveBlockUp: (sceneId: string, blockId: string) => void;
  onMoveBlockDown: (sceneId: string, blockId: string) => void;
  onUpdateBlockContent: (
    sceneId: string,
    blockId: string,
    contentText: string,
  ) => void;
  onUpdateChoiceBlock: (
    sceneId: string,
    blockId: string,
    input: {
      label: string;
      targetSceneId: string | null;
      effectVariableId: string | null;
      effectValue: number;
    },
  ) => void;
  onUpdateConditionBlock: (
    sceneId: string,
    blockId: string,
    input: ConditionBlockMeta,
  ) => void;
  onUpdateNoteBlock: (
    sceneId: string,
    blockId: string,
    input: NoteBlockMeta,
  ) => void;
}

export function SceneBlockList({
  sceneId,
  blocks,
  scenes,
  variables,
  onDeleteBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onUpdateBlockContent,
  onUpdateChoiceBlock,
  onUpdateConditionBlock,
  onUpdateNoteBlock,
}: SceneBlockListProps) {
  return (
    <div>
      {blocks.map((block, index) => (
        <SceneBlockListItem
          key={block.id}
          sceneId={sceneId}
          block={block}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
          scenes={scenes}
          variables={variables}
          onDeleteBlock={onDeleteBlock}
          onMoveBlockUp={onMoveBlockUp}
          onMoveBlockDown={onMoveBlockDown}
          onUpdateBlockContent={onUpdateBlockContent}
          onUpdateChoiceBlock={onUpdateChoiceBlock}
          onUpdateConditionBlock={onUpdateConditionBlock}
          onUpdateNoteBlock={onUpdateNoteBlock}
        />
      ))}
    </div>
  );
}
