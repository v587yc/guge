import type { SessionStatus } from '../types'

interface TopBarProps {
  session: SessionStatus | null
  activeTab: 'prompt' | 'batch'
  onTabChange: (tab: 'prompt' | 'batch') => void
}

export function TopBar({ session, activeTab, onTabChange }: TopBarProps) {
  return (
    <header className="topbar shell-card">
      <div>
        <p className="eyebrow">Flow Batch Studio</p>
        <h1>专业批量视频生成控制台</h1>
      </div>
      <div className="topbar-status">
        <div className={`status-pill ${session?.connected ? 'online' : 'offline'}`}>
          <span className="status-dot" />
          {session?.connected ? 'Chrome 已连接' : '等待 Chrome 会话'}
        </div>
        <div className="status-meta">
          <span>{session?.projectName ?? '未读取项目'}</span>
          <span>{session?.userEmail ?? '未读取账号'}</span>
        </div>
      </div>
      <div className="tab-switcher">
        <button
          className={activeTab === 'prompt' ? 'active' : ''}
          onClick={() => onTabChange('prompt')}
          type="button"
        >
          提示词表格生成
        </button>
        <button
          className={activeTab === 'batch' ? 'active' : ''}
          onClick={() => onTabChange('batch')}
          type="button"
        >
          批量视频生成
        </button>
      </div>
    </header>
  )
}
