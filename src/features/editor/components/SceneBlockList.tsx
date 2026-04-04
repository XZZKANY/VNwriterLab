import { ChoiceBlockEditor } from "./ChoiceBlockEditor";
import { ConditionBlockEditor } from "./ConditionBlockEditor";
import type { SceneBlock } from "../../../lib/domain/block";

interface SceneBlockListProps {
  blocks: SceneBlock[];
}

export function SceneBlockList({ blocks }: SceneBlockListProps) {
  return (
    <div>
      {blocks.map((block) => {
        if (block.blockType === "choice") {
          return <ChoiceBlockEditor key={block.id} />;
        }

        if (block.blockType === "condition") {
          return <ConditionBlockEditor key={block.id} />;
        }

        return (
          <label key={block.id}>
            {block.blockType === "narration" ? "旁白内容" : "内容"}
            <textarea value={block.contentText} readOnly />
          </label>
        );
      })}
    </div>
  );
}
