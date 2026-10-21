import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defense: if anything in the tree throws during render, show a
 * recoverable screen instead of a blank page. Offers a plain reload and, for
 * the case where persisted data is what's broken, a reset of local storage.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('psv-'))
    keys.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md space-y-4 border border-gray-700 rounded-lg p-6 bg-gray-900">
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="text-sm text-gray-400">
            The visualizer hit an error it couldn't recover from. Reloading usually fixes it.
            If it keeps happening, reset the saved copedents and snapshots.
          </p>
          <pre className="text-xs text-red-400 bg-gray-950 rounded p-2 overflow-x-auto">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={this.handleReload}
              className="px-3 py-1.5 text-sm rounded bg-cyan-400 text-gray-950 font-bold hover:bg-cyan-300"
            >
              Reload
            </button>
            <button
              onClick={this.handleReset}
              className="px-3 py-1.5 text-sm rounded bg-gray-800 text-gray-300 border border-gray-600 hover:bg-red-900 hover:text-red-200 hover:border-red-700"
            >
              Reset saved data and reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
