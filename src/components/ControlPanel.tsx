import { useRef } from 'react'

import type { ControlState, Summary } from '../types'

interface ControlPanelProps {
  control: ControlState
  summary: Summary
  busy: boolean
  onImport: (file: File) => Promise<void>
  onStart: () => Promise<void>
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onRetryFailed: () => Promise<void>
  onConcurrencyChange: (value: number) => Promise<void>
}

export function ControlPanel({
  control,
  summary,
  busy,
  onImport,
  onStart,
  onPause,
  onResume,
  onRetryFailed,
  onConcurrencyChange,
}: ControlPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <aside className="control-panel shell-card">
      <section>
        <p className="eyebrow">任务入口</p>
        <h2>导入表格</h2>
        <p className="muted">支持 CSV / XLSX，字段：image_path、prompt、output_name、enabled。</p>
        <p className="muted">每次导入都会自动创建一个新的 Flow 项目，并把本次任务绑定到这个新项目里。</p>
        <button type="button" className="primary-button" disabled={busy} onClick={() => inputRef.current?.click()}>
          导入任务表格
        </button>
        <input
          ref={inputRef}
          className="hidden-input"
          type="file"
          accept=".csv,.xlsx,.xlsm"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            await onImport(file)
            event.target.value = ''
          }}
        />
      </section>

      <section>
        <p className="eyebrow">运行控制</p>
        <h2>批量队列</h2>
        <div className="button-group">
          <button type="button" className="primary-button" disabled={busy || summary.total === 0} onClick={onStart}>
            开始批量生成
          </button>
          <button type="button" className="secondary-button" disabled={busy} onClick={control.paused ? onResume : onPause}>
            {control.paused ? '继续队列' : '暂停队列'}
          </button>
          <button type="button" className="secondary-button" disabled={busy || summary.failed === 0} onClick={onRetryFailed}>
            重试失败任务
          </button>
        </div>
      </section>

      <section>
        <p className="eyebrow">执行配置</p>
        <h2>并发设置</h2>
        <div className="inline-setting">
          <label htmlFor="concurrency">同时运行任务数</label>
          <select
            id="concurrency"
            value={control.concurrency}
            onChange={async (event) => onConcurrencyChange(Number(event.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <p className="muted">当前策略是稳态并发，适合控制风控和额度消耗。</p>
      </section>

      <section>
        <p className="eyebrow">状态解释</p>
        <ul className="hint-list">
          <li>进度优先展示真实远端百分比，拿不到时显示估算值。</li>
          <li>任务完成后不会自动下载，需在任务列表手动点击下载。</li>
          <li>暂停只会停止继续派发，不会强行中断已运行任务。</li>
        </ul>
      </section>
    </aside>
  )
}
