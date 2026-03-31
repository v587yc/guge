import { useEffect, useMemo, useState } from 'react'

import {
  clearJobs,
  fetchJob,
  fetchDownloadUrl,
  fetchJobEvents,
  fetchJobs,
  fetchSessionStatus,
  importJobs,
  pauseJobs,
  resumeJobs,
  retryJobs,
  setConcurrency,
  startJobs,
} from './api'
import { ControlPanel } from './components/ControlPanel'
import { PromptPrepPage } from './components/PromptPrepPage'
import { StatsStrip } from './components/StatsStrip'
import { TaskDetailDrawer } from './components/TaskDetailDrawer'
import { TaskTable } from './components/TaskTable'
import { TopBar } from './components/TopBar'
import type { Job, JobEvent, SessionStatus, SnapshotMessage, SocketMessage, Summary } from './types'

const EMPTY_SUMMARY: Summary = {
  total: 0,
  imported: 0,
  queued: 0,
  running: 0,
  succeeded: 0,
  failed: 0,
  disabled: 0,
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'batch'>('batch')
  const [session, setSession] = useState<SessionStatus | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [control, setControl] = useState({ concurrency: 2, paused: true })
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<JobEvent[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const selectedRowVersion = useMemo(
    () => jobs.find((job) => job.id === selectedJobId)?.updated_at ?? null,
    [jobs, selectedJobId],
  )

  useEffect(() => {
    void refreshAll()
  }, [])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/ws`)

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data) as SocketMessage
      if (payload.type === 'snapshot') {
        const snapshot = payload as SnapshotMessage
        setJobs(snapshot.jobs)
        setSummary(snapshot.summary)
        setControl(snapshot.control)
      }
      if (payload.type === 'job_event' && payload.jobId === selectedJobId) {
        setSelectedEvents((current) => [...current, payload.event])
      }
    }

    return () => ws.close()
  }, [selectedJobId])

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null)
      setSelectedEvents([])
      return
    }
    void (async () => {
      try {
        const [job, events] = await Promise.all([fetchJob(selectedJobId), fetchJobEvents(selectedJobId)])
        setSelectedJob(job)
        setSelectedEvents(events)
      } catch (error) {
        setToast(error instanceof Error ? error.message : String(error))
      }
    })()
  }, [selectedJobId, selectedRowVersion])

  useEffect(() => {
    if (!selectedJobId) {
      if (jobs.length > 0) {
        setSelectedJobId(jobs[0].id)
      }
      return
    }

    if (!jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0]?.id ?? null)
    }
  }, [jobs, selectedJobId])

  async function refreshAll() {
    try {
      const [sessionData, jobsData] = await Promise.all([fetchSessionStatus(), fetchJobs()])
      setSession(sessionData)
      setJobs(jobsData.jobs)
      setSummary(jobsData.summary)
      setControl(jobsData.control)
      if (!selectedJobId && jobsData.jobs.length > 0) {
        setSelectedJobId(jobsData.jobs[0].id)
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : String(error))
    }
  }

  async function wrapAction(action: () => Promise<void>) {
    try {
      setBusy(true)
      setToast(null)
      await action()
    } catch (error) {
      setToast(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleDownload(job: Job) {
    await wrapAction(async () => {
      const response = await fetchDownloadUrl(job.id)
      window.open(response.url, '_blank', 'noopener,noreferrer')
    })
  }

  async function handleCopyLink(job: Job) {
    await wrapAction(async () => {
      const response = await fetchDownloadUrl(job.id)
      await navigator.clipboard.writeText(response.url)
      setToast('下载链接已复制到剪贴板')
    })
  }

  async function handleClear(jobIds?: string[], statuses?: Array<'imported' | 'queued' | 'running' | 'succeeded' | 'failed'>) {
    await wrapAction(async () => {
      await clearJobs(jobIds, statuses)
      if (jobIds && selectedJobId && jobIds.includes(selectedJobId)) {
        setSelectedJobId(null)
      }
    })
  }

  return (
    <div className="app-shell">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} session={session} />

      {toast ? <div className="toast-banner">{toast}</div> : null}

      {activeTab === 'prompt' ? (
        <PromptPrepPage />
      ) : (
        <main className="workspace-grid">
          <ControlPanel
            busy={busy}
            control={control}
            summary={summary}
            onImport={async (file) => wrapAction(async () => importJobs(file))}
            onStart={async () => wrapAction(startJobs)}
            onPause={async () => wrapAction(pauseJobs)}
            onResume={async () => wrapAction(resumeJobs)}
            onRetryFailed={async () => wrapAction(() => retryJobs())}
            onConcurrencyChange={async (value) => wrapAction(() => setConcurrency(value))}
          />

          <section className="center-column">
            <StatsStrip summary={summary} />
            <TaskTable
              busy={busy}
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelect={setSelectedJobId}
              onDownload={handleDownload}
              onRetry={async (jobIds) => wrapAction(() => retryJobs(jobIds))}
              onCopyLink={handleCopyLink}
              onClearJobs={handleClear}
            />
          </section>

          <TaskDetailDrawer
            job={selectedJob}
            events={selectedEvents}
            onDownload={handleDownload}
            onRetry={async (jobIds) => wrapAction(() => retryJobs(jobIds))}
            onCopyLink={handleCopyLink}
            onClear={handleClear}
          />
        </main>
      )}
    </div>
  )
}
