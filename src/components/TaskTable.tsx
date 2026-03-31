import { useEffect, useMemo, useState } from 'react'

import type { Job, JobStatus } from '../types'

type FilterKey = 'all' | 'pending' | 'running' | 'succeeded' | 'failed' | 'attention'
type SortKey = 'queue' | 'updated' | 'progress' | 'name'

interface TaskTableProps {
  jobs: Job[]
  selectedJobId: string | null
  busy: boolean
  onSelect: (jobId: string) => void
  onDownload: (job: Job) => Promise<void>
  onRetry: (jobIds: string[]) => Promise<void>
  onCopyLink: (job: Job) => Promise<void>
  onClearJobs: (jobIds?: string[], statuses?: JobStatus[]) => Promise<void>
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '全部任务' },
  { key: 'pending', label: '待处理' },
  { key: 'running', label: '运行中' },
  { key: 'succeeded', label: '已完成' },
  { key: 'failed', label: '失败' },
  { key: 'attention', label: '需关注' },
]

function statusLabel(job: Job): string {
  switch (job.status) {
    case 'imported':
      return '已导入'
    case 'queued':
      return '排队中'
    case 'running':
      return '执行中'
    case 'succeeded':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return job.status
  }
}

function sourceLabel(job: Job): string {
  return job.progress_source === 'remote' ? '真实' : '估算'
}

function matchesFilter(job: Job, filter: FilterKey) {
  if (filter === 'all') return true
  if (filter === 'pending') return job.status === 'imported' || job.status === 'queued'
  if (filter === 'attention') return job.status === 'failed' || job.retry_count > 0
  return job.status === filter
}

function compareJobs(a: Job, b: Job, sort: SortKey) {
  if (sort === 'updated') {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }
  if (sort === 'progress') {
    return b.progress_percent - a.progress_percent
  }
  if (sort === 'name') {
    return a.output_name.localeCompare(b.output_name, 'zh-CN')
  }
  return a.sort_index - b.sort_index
}

export function TaskTable({
  jobs,
  selectedJobId,
  busy,
  onSelect,
  onDownload,
  onRetry,
  onCopyLink,
  onClearJobs,
}: TaskTableProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('queue')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => jobs.some((job) => job.id === id)))
  }, [jobs])

  const visibleJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return jobs
      .filter((job) => matchesFilter(job, filter))
      .filter((job) => {
        if (!keyword) return true
        const haystack = [
          job.image_path,
          job.prompt,
          job.output_name,
          job.operation_name ?? '',
          job.progress_note ?? '',
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(keyword)
      })
      .slice()
      .sort((a, b) => compareJobs(a, b, sort))
  }, [filter, jobs, search, sort])

  const visibleIds = visibleJobs.map((job) => job.id)
  const selectedCount = selectedIds.length
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const visibleCounts = visibleJobs.reduce(
    (acc, job) => {
      acc[job.status] += 1
      return acc
    },
    { imported: 0, queued: 0, running: 0, succeeded: 0, failed: 0 },
  )

  function toggleRow(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id))
      }
      const merged = new Set([...current, ...visibleIds])
      return Array.from(merged)
    })
  }

  return (
    <section className="queue-panel shell-card">
      <div className="queue-hero">
        <div className="queue-hero-copy">
          <p className="eyebrow">Batch Queue</p>
          <h2>任务队列工作台</h2>
          <p className="muted">按批次管理、筛选、清空和复盘任务，像真正的视频生产控制室一样工作。</p>
        </div>
        <div className="queue-kpis">
          <div className="queue-kpi">
            <span>当前视图</span>
            <strong>{visibleJobs.length}</strong>
          </div>
          <div className="queue-kpi">
            <span>运行中</span>
            <strong>{visibleCounts.running}</strong>
          </div>
          <div className="queue-kpi">
            <span>失败/关注</span>
            <strong>{visibleCounts.failed + visibleJobs.filter((job) => job.retry_count > 0).length}</strong>
          </div>
        </div>
      </div>

      <div className="toolbar-band">
        <label className="toolbar-search">
          <span>搜索任务</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="按文件名、Prompt、输出名、operation 检索"
            type="search"
          />
        </label>

        <div className="toolbar-right">
          <div className="filter-chips">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`filter-chip ${filter === item.key ? 'active' : ''}`}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <label className="sort-select">
              <span>排序</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                <option value="queue">按队列顺序</option>
                <option value="updated">按更新时间</option>
                <option value="progress">按进度</option>
                <option value="name">按输出名</option>
              </select>
            </label>
            <button type="button" className="secondary-button compact" disabled={busy} onClick={() => void onClearJobs(undefined, ['imported', 'queued'])}>
              清空待处理
            </button>
            <button type="button" className="secondary-button compact" disabled={busy} onClick={() => void onClearJobs(undefined, ['failed'])}>
              清空失败
            </button>
            <button type="button" className="secondary-button compact" disabled={busy} onClick={() => void onClearJobs(undefined, ['succeeded'])}>
              清空已完成
            </button>
          </div>
        </div>
      </div>

      <div className="bulk-band">
        <label className="bulk-select-toggle">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
          <span>{allVisibleSelected ? '取消全选当前视图' : '全选当前视图'}</span>
        </label>
        <div className="bulk-summary">已选 {selectedCount} 条任务</div>
        <div className="bulk-actions">
          <button type="button" className="secondary-button compact" disabled={busy || selectedCount === 0} onClick={() => void onRetry(selectedIds)}>
            重试选中
          </button>
          <button type="button" className="danger-button compact" disabled={busy || selectedCount === 0} onClick={() => void onClearJobs(selectedIds)}>
            清空选中
          </button>
        </div>
      </div>

      <div className="queue-head table-grid">
        <div />
        <div>任务</div>
        <div>状态 / 阶段</div>
        <div>进度</div>
        <div>追踪信息</div>
        <div>操作</div>
      </div>

      <div className="queue-body">
        {visibleJobs.length === 0 ? (
          <div className="empty-queue">
            <strong>当前筛选条件下没有任务</strong>
            <p className="muted">你可以调整筛选条件，或者导入新的任务表。</p>
          </div>
        ) : null}

        {visibleJobs.map((job) => (
          <article
            key={job.id}
            className={`queue-row table-grid status-${job.status} ${selectedJobId === job.id ? 'focus' : ''}`}
            onClick={() => onSelect(job.id)}
          >
            <div className="queue-select" onClick={(event) => event.stopPropagation()}>
              <input type="checkbox" checked={selectedIds.includes(job.id)} onChange={() => toggleRow(job.id)} />
            </div>

            <div className="queue-row-main">
              <div className="task-thumb large">{job.image_path.split(/[\\/]/).pop()?.slice(0, 2) ?? 'IM'}</div>
              <div className="queue-row-copy">
                <strong>{job.output_name}</strong>
                <p>{job.prompt}</p>
                <span className="path-text">{job.image_path}</span>
              </div>
            </div>

            <div className="tag-stack">
              <span className={`status-chip ${job.status}`}>{statusLabel(job)}</span>
              <strong>{job.stage}</strong>
              <p className="muted stage-note">{job.progress_note ?? '暂无备注'}</p>
            </div>

            <div className="metric-stack">
              <div className="progress-header">
                <strong>{Math.round(job.progress_percent)}%</strong>
                <span>{sourceLabel(job)}</span>
              </div>
              <div className="progress-bar prominent">
                <span style={{ width: `${job.progress_percent}%` }} />
              </div>
              <div className="mini-meta">
                <span>重试 {job.retry_count}</span>
                <span>{new Date(job.updated_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="queue-telemetry">
              <div>
                <span className="mono-label">Operation</span>
                <strong className="mono">{job.operation_name ?? '等待生成'}</strong>
              </div>
              <div>
                <span className="mono-label">Workflow</span>
                <strong className="mono">{job.workflow_id ?? '-'}</strong>
              </div>
            </div>

            <div className="queue-actions" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="secondary-button compact" disabled={job.status !== 'succeeded'} onClick={() => void onDownload(job)}>
                下载
              </button>
              <button type="button" className="secondary-button compact" disabled={job.status !== 'succeeded'} onClick={() => void onCopyLink(job)}>
                复制链接
              </button>
              <button type="button" className="secondary-button compact" disabled={job.status !== 'failed'} onClick={() => void onRetry([job.id])}>
                重试
              </button>
              <button type="button" className="danger-button compact" disabled={busy || job.status === 'running'} onClick={() => void onClearJobs([job.id])}>
                清空
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
