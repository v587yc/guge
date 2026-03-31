export function PromptPrepPage() {
  return (
    <section className="placeholder-grid">
      <article className="shell-card placeholder-hero">
        <p className="eyebrow">步骤 1</p>
        <h2>图片生成视频提示词</h2>
        <p>
          这里已为后续脚本整合预留完整页面区域。后面接入你的现有脚本后，这一页会负责：导入图片、调用 AI 生成视频提示词、预览结果并导出到标准任务表格。
        </p>
      </article>

      <article className="shell-card placeholder-card">
        <p className="eyebrow">预留接口</p>
        <h3>任务入口</h3>
        <ul className="hint-list">
          <li>POST /api/prompt-jobs/import</li>
          <li>POST /api/prompt-jobs/run</li>
          <li>GET /api/prompt-jobs/{'{jobId}'}</li>
        </ul>
      </article>

      <article className="shell-card placeholder-card">
        <p className="eyebrow">下游对接</p>
        <h3>导出字段标准</h3>
        <ul className="hint-list">
          <li>image_path</li>
          <li>prompt</li>
          <li>output_name</li>
          <li>enabled</li>
        </ul>
      </article>
    </section>
  )
}
