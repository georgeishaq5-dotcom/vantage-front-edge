import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type State =
  | { status: 'loading' }
  | { status: 'valid' }
  | { status: 'already' }
  | { status: 'invalid' }
  | { status: 'submitting' }
  | { status: 'done' }
  | { status: 'error' }

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    setToken(t)
    if (!t) {
      setState({ status: 'invalid' })
      return
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setState({ status: 'valid' })
        else if (data.reason === 'already_unsubscribed') setState({ status: 'already' })
        else setState({ status: 'invalid' })
      })
      .catch(() => setState({ status: 'error' }))
  }, [])

  const confirm = async () => {
    if (!token) return
    setState({ status: 'submitting' })
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) setState({ status: 'done' })
      else if (data.reason === 'already_unsubscribed') setState({ status: 'already' })
      else setState({ status: 'error' })
    } catch {
      setState({ status: 'error' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Email preferences</h1>

        {state.status === 'loading' && (
          <p className="mt-3 text-sm text-muted-foreground">Checking your request…</p>
        )}

        {state.status === 'valid' && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Click below to unsubscribe from Vantage emails. You can re-subscribe
              anytime by contacting us.
            </p>
            <button
              onClick={confirm}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Confirm unsubscribe
            </button>
          </>
        )}

        {state.status === 'submitting' && (
          <p className="mt-3 text-sm text-muted-foreground">Processing…</p>
        )}

        {state.status === 'done' && (
          <p className="mt-3 text-sm text-foreground">
            You've been unsubscribed. You will no longer receive these emails.
          </p>
        )}

        {state.status === 'already' && (
          <p className="mt-3 text-sm text-muted-foreground">
            You're already unsubscribed — no further action is needed.
          </p>
        )}

        {state.status === 'invalid' && (
          <p className="mt-3 text-sm text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        )}

        {state.status === 'error' && (
          <p className="mt-3 text-sm text-destructive">
            Something went wrong. Please try again later.
          </p>
        )}
      </div>
    </div>
  )
}
