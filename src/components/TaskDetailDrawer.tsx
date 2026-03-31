import type { Job, JobEvent } from '../types'

interface TaskDetailDrawerProps {
  job: Job | null
  events: JobEvent[]
  onDownload: (job: Job) => Promise<void>
  onRetry: (jobIds: string[]) => Promise<void>
  onCopyLink: (job: Job) => Promise<void>
  onClear: (jobIds: string[]) => Promise<void>
}

const STAGES = [
  { key: 'preparing', label: '会话准备' },
  { key: 'uploading', label: '素材上传' },
  { key: 'submitting', label: '请求提交' },
  { key: 'generating', label: '远端生成' },
  { key: 'complete', label: '待手动下载' },
]

function stageState(current: string, index: number): 'done' | 'active' | 'idle' {
  const currentIndex = STAGES.findIndex((stage) => stage.key === current)
  if (currentIndex === -1 && current === 'failed') {
    return index < 4 ? 'done' : 'idle'
  }
  if (index < currentIndex) return 'done'
  if (index === currentIndex) return 'active'
  return 'idle'
}

function eventTone(event: JobEvent): string {
  if (event.event_type === 'failed' || event.event_type === 'transient_error') return 'danger'
  if (event.event_type === 'completed' || event.event_type === 'download_ready') return 'success'
  if (event.event_type === 'api_call') return 'neutral'
  return 'accent'
}

function eventPayloadHint(event: JobEvent): string | null {
  if (!event.payload) return null
  const url = typeof event.payload.url === 'string' ? event.payload.url : null
  const status = typeof event.payload.status === 'number' ? event.payload.status : null
  if (url) {
    return `${status ?? ''} ${url}`.trim()
  }
  return null
}

export function TaskDetailDrawer({ job, events, onDownload, onRetry, onCopyLink, onClear }: TaskDetailDrawerProps) {
  if (!job) {
    return (
      <aside className="detail-shell shell-card empty-drawer">
        <p className="eyebrow">Task Inspector</p>
        <h2>选择一条任务进入诊断视图</h2>
        <p className="muted">这里会展示远端生成轨迹、失败诊断、交付链接和完整时间线。</p>
      </aside>
    )
  }

  return (
    <aside className="detail-shell shell-card">
      <div className="detail-hero">
        <div className="detail-title-block">
          <p className="eyebrow">Task Inspector</p>
          <h2>{job.output_name}</h2>
          <div className="detail-status-line">
            <span className={`status-chip ${job.status}`}>{job.status}</span>
            <span className="detail-pill">{Math.round(job.progress_percent)}% {job.progress_source === 'remote' ? '真实进度' : '估算进度'}</span>
            <span className="detail-pill">重试 {job.retry_count}</span>
          </div>
        </div>

        <div className="detail-actions">
          <button type="button" className="primary-button compact" disabled={job.status !== 'succeeded'} onClick={() => void onDownload(job)}>
            手动下载
          </button>
          <button type="button" className="secondary-button compact" disabled={job.status !== 'succeeded'} onClick={() => void onCopyLink(job)}>
            复制链接
          </button>
          <button type="button" className="secondary-button compact" disabled={job.status !== 'failed'} onClick={() => void onRetry([job.id])}>
            重试任务
          </button>
          <button type="button" className="danger-button compact" disabled={job.status === 'running'} onClick={() => void onClear([job.id])}>
            清空任务
          </button>
        </div>
      </div>

      <div className="detail-preview shell-subcard">
        <img alt={job.output_name} src={`/api/jobs/${job.id}/image`} />
        <div className="detail-preview-overlay">
          <span>{job.image_path.split(/[\\/]/).pop()}</span>
          <strong>{job.progress_note ?? job.stage}</strong>
        </div>
      </div>

      <section className="stage-rail shell-subcard">
        {STAGES.map((stage, index) => (
          <div className={`stage-node ${stageState(job.stage, index)}`} key={stage.key}>
            <span>{stage.label}</span>
          </div>
        ))}
      </section>

      <section className="detail-metrics">
        <article className="metric-card shell-subcard">
          <span>源文件</span>
          <strong>{job.image_path.split(/[\\/]/).pop()}</strong>
          <p>{job.image_path}</p>
        </article>
        <article className="metric-card shell-subcard">
          <span>Operation</span>
          <strong className="mono">{job.operation_name ?? '未创建'}</strong>
          <p>{job.workflow_id ?? '暂无 workflow'}</p>
        </article>
        <article className="metric-card shell-subcard">
          <span>最后更新时间</span>
          <strong>{new Date(job.updated_at).toLocaleString()}</strong>
          <p>阶段：{job.stage}</p>
        </article>
      </section>

      <div className="detail-section-grid">
        <section className="detail-block shell-subcard">
          <p className="section-title">Prompt Brief</p>
          <div className="prompt-block">{job.prompt}</div>
        </section>

        <section className="detail-block shell-subcard">
          <p className="section-title">交付与回收</p>
          <div className="meta-grid">
            <div>
              <span>素材 Media</span>
              <strong className="mono">{job.remote_media_id ?? '-'}</strong>
            </div>
            <div>
              <span>链接过期</span>
              <strong>{job.signed_url_expires_at ? new Date(job.signed_url_expires_at).toLocaleString() : '未生成'}</strong>
            </div>
            <div>
              <span>开始时间</span>
              <strong>{job.started_at ? new Date(job.started_at).toLocaleString() : '-'}</strong>
            </div>
            <div>
              <span>结束时间</span>
              <strong>{job.finished_at ? new Date(job.finished_at).toLocaleString() : '-'}</strong>
            </div>
            <div>
              <span>归属项目</span>
              <strong>{job.project_title ?? '未绑定项目'}</strong>
            </div>
            <div>
              <span>项目 ID</span>
              <strong className="mono">{job.project_id ?? '-'}</strong>
            </div>
            <div>
              <span>项目链接</span>
              <strong className="mono">{job.project_url ?? '-'}</strong>
            </div>
            <div>
              <span>批次 ID</span>
              <strong className="mono">{job.import_batch_id ?? '-'}</strong>
            </div>
          </div>
        </section>
      </div>

      {job.error_message ? (
        <section className="detail-block shell-subcard diagnostic-block">
          <p className="section-title">失败诊断</p>
          <div className="error-box">{job.error_message}</div>
        </section>
      ) : null}

      <section className="detail-block shell-subcard timeline-block">
        <div className="detail-block-header">
          <p className="section-title">事件时间线</p>
          <span className="muted">{events.length} 条事件</span>
        </div>
        <div className="timeline">
          {events.map((event) => (
            <article className={`timeline-item ${eventTone(event)}`} key={event.id}>
              <div className="timeline-meta">
                <span className={`timeline-chip ${eventTone(event)}`}>{event.event_type}</span>
                <time>{new Date(event.created_at).toLocaleString()}</time>
              </div>
              <strong>{event.message}</strong>
              {eventPayloadHint(event) ? <code className="payload-snippet">{eventPayloadHint(event)}</code> : null}
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}
