import { Component } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error, info) {
    console.error('AgeWell UI runtime error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const message = this.state.error?.message || 'Unexpected error'

    return (
      <div className="min-h-screen bg-[#F6F2EA] px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white border-2 border-rose-100 rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-sage-900">Something went wrong</h1>
              <p className="text-sage-600 mt-1">The page crashed during load. You can safely retry.</p>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-sage-50 border border-sage-200">
            <p className="text-sm text-sage-700 break-words">{message}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={this.handleReload}
              className="h-12 rounded-xl bg-sage-700 text-white font-semibold inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={this.handleGoHome}
              className="h-12 rounded-xl border border-sage-300 text-sage-800 font-semibold inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </motion.button>
          </div>
        </div>
      </div>
    )
  }
}
