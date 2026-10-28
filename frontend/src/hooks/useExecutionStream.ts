import { useState, useEffect, useRef, useCallback } from 'react'

export type StreamStatus = 'CONNECTED' | 'RECONNECTING' | 'FAILED' | 'POLLING_FALLBACK' | 'IDLE'

export interface LogEntry {
  type: 'stdout' | 'stderr' | 'system' | 'result' | string
  content: string
}

export interface ExecutionResult {
  status: 'success' | 'failed'
  exit_code: number
  duration?: number
}

interface UseExecutionStreamOptions {
  sessionId: string
  onFinish?: (result: ExecutionResult) => void
  onOutput?: (chunk: LogEntry) => void
}

export function useExecutionStream({ sessionId, onFinish, onOutput }: UseExecutionStreamOptions) {
  const [status, setStatus] = useState<StreamStatus>('IDLE')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [result, setResult] = useState<ExecutionResult | null>(null)

  const ws = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  const clearLogs = useCallback(() => {
    setLogs([])
    setResult(null)
  }, [])

  const startPollingFallback = useCallback((submissionId?: number | string) => {
    if (!submissionId || pollingInterval.current) return
    setStatus('POLLING_FALLBACK')
    setLogs((prev) => [
      ...prev,
      { type: 'system', content: '[NETWORK]: Chaveando para polling HTTP de contingência...\n' }
    ])

    pollingInterval.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('synapse_token')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`/api/v1/submissions/${submissionId}/refresh_status/`, { headers })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'success' || data.status === 'failed') {
            if (pollingInterval.current) clearInterval(pollingInterval.current)
            pollingInterval.current = null

            const execResult: ExecutionResult = {
              status: data.status,
              exit_code: data.status === 'success' ? 0 : 1,
            }
            setResult(execResult)
            setLogs((prev) => [
              ...prev,
              { type: 'result', content: `\n[POLL]: Execução finalizada com status ${data.status}.` }
            ])
            if (onFinish) onFinish(execResult)
          }
        }
      } catch (err) {
        console.error('[POLL_ERROR]:', err)
      }
    }, 1500)
  }, [onFinish])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const socket = new WebSocket(`${protocol}//${host}/ws/execute/${sessionId}/`)

    setStatus('RECONNECTING')

    socket.onopen = () => {
      setStatus('CONNECTED')
      retryCount.current = 0
      setLogs((prev) => [...prev, { type: 'system', content: `[INFO]: Conectado ao stream seguro (Sessão: ${sessionId})\n` }])
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const entry: LogEntry = { type: data.type || 'stdout', content: data.content || '' }
        
        setLogs((prev) => [...prev, entry])
        if (onOutput) onOutput(entry)

        if (data.type === 'result') {
          const execResult: ExecutionResult = {
            status: data.status || (data.exit_code === 0 ? 'success' : 'failed'),
            exit_code: data.exit_code ?? 0,
            duration: data.duration,
          }
          setResult(execResult)
          if (onFinish) onFinish(execResult)
        }
      } catch (e) {
        console.error('[WS_ERROR]: Pacote de streaming malformado:', e)
      }
    }

    socket.onclose = () => {
      ws.current = null
      if (retryCount.current < 5) {
        const delay = Math.pow(2, retryCount.current) * 1000
        retryCount.current += 1
        reconnectTimeout.current = setTimeout(() => {
          connect()
        }, delay)
      } else {
        setStatus('FAILED')
      }
    }

    socket.onerror = () => {
      setStatus('FAILED')
    }

    ws.current = socket
  }, [sessionId, onFinish, onOutput])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (pollingInterval.current) clearInterval(pollingInterval.current)
      if (ws.current) ws.current.close()
    }
  }, [connect])

  const execute = useCallback((code: string, language: string = 'python', submissionId?: number | string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      if (submissionId) {
        startPollingFallback(submissionId)
      } else {
        setLogs((prev) => [...prev, { type: 'system', content: '[ERRO]: WebSocket desconectado. Tentando reconectar...\n' }])
        connect()
      }
      return
    }

    ws.current.send(JSON.stringify({ action: 'execute', code, language }))
  }, [connect, startPollingFallback])

  return {
    status,
    logs,
    result,
    execute,
    clearLogs,
    reconnect: connect,
  }
}
