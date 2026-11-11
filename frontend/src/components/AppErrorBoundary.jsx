import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('AgeWell UI runtime error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const message = this.state.error?.message || 'Unexpected error'

    return (
      <main className="min-h-screen bg-cream-50 px-6 py-10 flex items-center justify-center">
        <div role="alert" className="w-full max-w-md bg-white border border-sage-200 rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl font-serif text-sage-900">Something went wrong</h1>
          <p className="text-sage-600 mt-2">This page failed to load. Your data is safe. Reloading usually fixes it.</p>
          <p className="mt-4 text-sm text-sage-600 break-words rounded-xl bg-sage-50 border border-sage-200 p-3">{message}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => window.location.reload()} className="btn-primary">Reload</button>
            <button type="button" onClick={() => window.location.assign('/')} className="btn-secondary">Go to home</button>
          </div>
        </div>
      </main>
    )
  }
}
