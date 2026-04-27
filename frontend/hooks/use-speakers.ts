'use client'

import { useState, useEffect } from 'react'

export interface Speaker {
  id:             number
  name:           string
  dialect:        string
  region:         string | null
  birth_year:     number | null
  title:          string | null
  bio:            string | null
  portrait_url:   string
  audio_url:      string
  audio_duration: number
  media_timestamps: string
  media_script:   string
  video_url:      string
  video_script:   string
  has_video:      boolean
  sort_order:     number
}

interface SpeakerListResponse {
  total: number
  items: Speaker[]
}

export function useSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/speakers?limit=20')
      .then(r => r.json())
      .then((data: SpeakerListResponse) => setSpeakers(data.items ?? []))
      .catch(() => setError('無法載入人物資料'))
      .finally(() => setLoading(false))
  }, [])

  return { speakers, loading, error }
}
