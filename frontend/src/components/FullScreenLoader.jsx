import { motion } from 'framer-motion'

export default function FullScreenLoader({ message = 'Loading AgeWell...' }) {
  return (
    <div className="min-h-screen bg-[#F6F2EA] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-16 h-16 rounded-2xl bg-[#173A63] shadow-[0_16px_32px_rgba(23,58,99,0.25)] flex items-center justify-center"
        >
          <motion.span
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="text-white text-2xl font-black leading-none"
          >
            A
          </motion.span>
        </motion.div>

        <p className="text-[#173A63] font-semibold tracking-wide">{message}</p>
      </div>
    </div>
  )
}