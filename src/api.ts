import type { ControlState, Job, JobEvent, SessionStatus, Summary } from './types'

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function fetchSessionStatus(): Promise<SessionStatus> {
  return readJson<SessionStatus>('/api/session/status')
}

export async function fetchJobs(): Promise<{ jobs: Job[]; summary: Summary; control: ControlState }> {
  return readJson('/api/jobs')
}

export async function fetchJobEvents(jobId: string): Promise<JobEvent[]> {
  const response = await readJson<{ events: JobEvent[] }>(`/api/jobs/${jobId}/events`)
  return response.events
}

export async function fetchJob(jobId: string): Promise<Job> {
  return readJson<Job>(`/api/jobs/${jobId}`)
}

export async function importJobs(file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)
  await readJson('/api/jobs/import', { method: 'POST', body })
}

export async function startJobs(): Promise<void> {
  await readJson('/api/jobs/start', { method: 'POST' })
}

export async function pauseJobs(): Promise<void> {
  await readJson('/api/jobs/pause', { method: 'POST' })
}

export async function resumeJobs(): Promise<void> {
  await readJson('/api/jobs/resume', { method: 'POST' })
}

export async function retryJobs(jobIds?: string[]): Promise<void> {
  await readJson('/api/jobs/retry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_ids: jobIds ?? null }),
  })
}

export async function clearJobs(jobIds?: string[], statuses?: string[]): Promise<void> {
  await readJson('/api/jobs/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_ids: jobIds ?? null, statuses: statuses ?? null }),
  })
}

export async function setConcurrency(concurrency: number): Promise<void> {
  await readJson('/api/settings/concurrency', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concurrency }),
  })
}

export async function fetchDownloadUrl(jobId: string): Promise<{ url: string; expiresAt: string | null }> {
  return readJson(`/api/jobs/${jobId}/download-url`)
}
