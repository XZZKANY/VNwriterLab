import type { LoreCategory, LoreEntry } from "@/lib/domain/lore";

export type LoreDetailUpdate = Partial<
  Pick<LoreEntry, "name" | "category" | "description" | "tags">
>;

interface LoreDetailFormProps {
  entry: LoreEntry;
  onUpdate: (input: LoreDetailUpdate) => void;
}

export function LoreDetailForm({ entry, onUpdate }: LoreDetailFormProps) {
  return (
    <>
      <label>
        名称
        <input
          value={entry.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
        />
      </label>
      <label>
        分类
        <select
          aria-label="分类"
          value={entry.category}
          onChange={(event) =>
            onUpdate({ category: event.target.value as LoreCategory })
          }
        >
          <option value="location">地点</option>
          <option value="term">术语</option>
          <option value="world_rule">世界规则</option>
          <option value="event">事件</option>
        </select>
      </label>
      <label>
        描述
        <textarea
          value={entry.description}
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </label>
    </>
  );
}
