import type { SceneBlock } from "../../../lib/domain/block";

interface SceneBlockListProps {
  blocks: SceneBlock[];
}

export function SceneBlockList({ blocks }: SceneBlockListProps) {
  return (
    <div>
      {blocks.map((block) => (
        <label key={block.id}>
          {block.blockType === "narration" ? "旁白内容" : "内容"}
          <textarea value={block.contentText} readOnly />
        </label>
      ))}
    </div>
  );
}
