import type { Summary } from '../types'

const CARDS: Array<{ key: keyof Summary; label: string }> = [
  { key: 'total', label: '总任务' },
  { key: 'queued', label: '排队中' },
  { key: 'running', label: '运行中' },
  { key: 'succeeded', label: '已完成' },
  { key: 'failed', label: '失败' },
]

export function StatsStrip({ summary }: { summary: Summary }) {
  return (
    <section className="stats-strip">
      {CARDS.map((card) => (
        <article className="stat-card shell-card" key={card.key}>
          <span>{card.label}</span>
          <strong>{summary[card.key]}</strong>
        </article>
      ))}
    </section>
  )
}
