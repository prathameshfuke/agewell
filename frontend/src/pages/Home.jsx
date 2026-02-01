import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Shield, Activity, Leaf } from 'lucide-react'

// Import assets
import landingImage from '../assets/images/landing/landing.jpeg'
import oneSticker from '../assets/images/stickers/one.jpeg'
import twoSticker from '../assets/images/stickers/two.jpeg'

/**
 * Landing Page - Purely informational
 * 
 * Rules (per healthcare-grade spec):
 * - NO authentication checks
 * - NO redirects
 * - NO session inspection
 * - Clicking cards sets intendedRole and navigates to /auth
 */
export default function Home() {
  const navigate = useNavigate()

  const handleElderlyClick = () => {
    sessionStorage.setItem('intendedRole', 'elderly')
    navigate('/auth')
  }

  const handleCaregiverClick = () => {
    sessionStorage.setItem('intendedRole', 'caregiver')
    navigate('/auth')
  }

  return (
    <div className="min-h-screen font-sans overflow-x-hidden relative bg-gradient-to-br from-cream-100 via-cream-50 to-sage-100/40">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-sage-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-cream-300/40 rounded-full blur-3xl"
        />

        {/* Floating leaves */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 10, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-1/4 text-sage-300/50"
        >
          <Leaf className="w-12 h-12" />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 sm:p-6 flex justify-between items-center z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sage-500 to-sage-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-sage-500/30 rounded-xl blur-md"
              />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-bold text-sage-800 tracking-tight">AgeWell</span>
          </motion.div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="text-sage-700 font-bold hover:text-sage-900 transition-colors text-sm sm:text-base hidden xs:block"
            >
              Log In
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-sage-600 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg hover:bg-sage-700 transition-all hover:shadow-xl whitespace-nowrap"
            >
              <span className="hidden xs:inline">Create Account</span>
              <span className="xs:hidden">Sign Up</span>
            </motion.button>
          </div>
        </motion.header>

        <main className="flex-grow flex flex-col items-center justify-center p-6 space-y-10">
          {/* Hero with Landing Image */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* Landing Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-64 h-80 mx-auto mb-6 rounded-3xl overflow-hidden shadow-lg border-4 border-white"
            >
              <img src={landingImage} alt="Family care" className="w-full h-full object-cover" />
            </motion.div>

            <h1 className="font-serif text-4xl md:text-6xl font-black text-sage-900 leading-[1.1] mb-6">
              Care that feels <br />
              <span className="bg-gradient-to-r from-sage-600 to-sage-500 bg-clip-text text-transparent">
                like family.
              </span>
            </h1>

            <p className="text-sage-600 font-medium text-xl leading-relaxed mb-8 max-w-xl mx-auto">
              Comprehensive care management for your loved ones, designed with simplicity and warmth.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sage-600">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-sage-200"
              >
                <Shield className="w-5 h-5 text-status-success" />
                <span className="font-semibold">Private & Secure</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-sage-200"
              >
                <Activity className="w-5 h-5 text-sage-500" />
                <span className="font-semibold">24/7 Monitoring</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Role Selection Cards with stickers */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl mx-auto"
          >
            {/* Elderly Card */}
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleElderlyClick}
              className="group relative bg-white/90 backdrop-blur-md rounded-4xl p-8 text-left shadow-card hover:shadow-card-hover border-2 border-transparent hover:border-sage-200 overflow-hidden transition-all"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-sage-100 to-sage-50 rounded-full blur-2xl opacity-60 -mr-16 -mt-16" />

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <img src={oneSticker} alt="Elderly" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-sage-900 mb-3">I am an Elderly User</h2>
                <p className="text-sage-600 text-base leading-relaxed mb-4">
                  Simple, large buttons and easy access to your medication schedule and vitals.
                </p>
                <div className="flex items-center text-sage-600 font-bold text-sm group-hover:text-sage-500 transition-colors">
                  <span>Get Started</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-2"
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </motion.button>

            {/* Caregiver Card */}
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCaregiverClick}
              className="group relative bg-white/90 backdrop-blur-md rounded-4xl p-8 text-left shadow-card hover:shadow-card-hover border-2 border-transparent hover:border-cream-400 overflow-hidden transition-all"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cream-200 to-cream-100 rounded-full blur-2xl opacity-60 -mr-16 -mt-16" />

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-lg shadow-cream-200 group-hover:scale-110 transition-transform">
                  <img src={twoSticker} alt="Caregiver" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-sage-900 mb-3">I am a Caregiver</h2>
                <p className="text-sage-600 text-base leading-relaxed mb-4">
                  Monitor your loved one's health, receive alerts, and manage care remotely.
                </p>
                <div className="flex items-center text-sage-600 font-bold text-sm group-hover:text-sage-500 transition-colors">
                  <span>Get Started</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-2"
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </motion.button>
          </motion.div>
        </main>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sage-500 text-sm pb-8"
        >
          <p className="font-medium">© 2025 AgeWell · Made with <Heart className="inline w-4 h-4 text-rose-400 fill-current" /> for families</p>
        </motion.footer>
      </div>
    </div>
  )
}
