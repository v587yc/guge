export type JobStatus = 'imported' | 'queued' | 'running' | 'succeeded' | 'failed'

export interface Job {
  id: string
  import_batch_id: string | null
  project_id: string | null
  project_url: string | null
  project_title: string | null
  image_path: string
  prompt: string
  output_name: string
  enabled: boolean
  status: JobStatus
  stage: string
  progress_percent: number
  progress_source: string
  progress_note: string | null
  operation_name: string | null
  workflow_id: string | null
  remote_media_id: string | null
  signed_video_url: string | null
  signed_url_expires_at: string | null
  error_message: string | null
  retry_count: number
  result_meta: Record<string, unknown> | null
  sort_index: number
  created_at: string
  updated_at: string
  started_at: string | null
  finished_at: string | null
}

export interface Summary {
  total: number
  imported: number
  queued: number
  running: number
  succeeded: number
  failed: number
  disabled: number
}

export interface ControlState {
  concurrency: number
  paused: boolean
}

export interface SessionStatus {
  connected: boolean
  projectId: string
  projectName: string
  projectUrl?: string
  userEmail: string
  userName: string
  chromeUrl: string
  control: ControlState
  summary: Summary
}

export interface JobEvent {
  id: number
  job_id: string
  event_type: string
  message: string
  payload: Record<string, unknown> | null
  created_at: string
}

export interface SnapshotMessage {
  type: 'snapshot'
  jobs: Job[]
  summary: Summary
  control: ControlState
  activeJobIds: string[]
}

export interface JobEventMessage {
  type: 'job_event'
  jobId: string
  event: JobEvent
}

export type SocketMessage = SnapshotMessage | JobEventMessage
