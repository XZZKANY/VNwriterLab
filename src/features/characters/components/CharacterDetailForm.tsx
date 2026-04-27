import type { Character } from "@/lib/domain/character";

export type CharacterDetailUpdate = Partial<
  Pick<
    Character,
    | "name"
    | "identity"
    | "appearance"
    | "personality"
    | "goal"
    | "secret"
    | "routeId"
    | "notes"
  >
>;

interface CharacterDetailFormProps {
  character: Character;
  onUpdate: (input: CharacterDetailUpdate) => void;
}

export function CharacterDetailForm({
  character,
  onUpdate,
}: CharacterDetailFormProps) {
  return (
    <>
      <label>
        姓名
        <input
          value={character.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
        />
      </label>
      <label>
        身份
        <input
          value={character.identity}
          onChange={(event) => onUpdate({ identity: event.target.value })}
        />
      </label>
      <label>
        性格
        <textarea
          value={character.personality}
          onChange={(event) => onUpdate({ personality: event.target.value })}
        />
      </label>
      <label>
        目标
        <textarea
          value={character.goal}
          onChange={(event) => onUpdate({ goal: event.target.value })}
        />
      </label>
      <label>
        秘密
        <textarea
          value={character.secret}
          onChange={(event) => onUpdate({ secret: event.target.value })}
        />
      </label>
    </>
  );
}
