export function LorePage() {
  return (
    <section>
      <h2>设定</h2>
      <div role="tablist" aria-label="设定分类">
        <button role="tab">地点</button>
        <button role="tab">术语</button>
        <button role="tab">世界规则</button>
        <button role="tab">事件</button>
      </div>
      <article>
        <h3>设定详情</h3>
        <label>
          名称
          <input />
        </label>
        <label>
          描述
          <textarea />
        </label>
      </article>
    </section>
  );
}
