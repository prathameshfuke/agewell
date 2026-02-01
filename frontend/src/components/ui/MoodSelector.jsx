import { motion } from 'framer-motion'

export default function MoodSelector({ moods, onSelect, selected }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
      <div className="flex justify-between items-center gap-2">
        {moods.map((mood, index) => (
          <motion.button
            key={mood.value}
            onClick={() => onSelect(mood.value)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex flex-col items-center gap-2 flex-1 p-3 rounded-2xl transition-all
              ${selected === mood.value 
                ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' 
                : 'hover:bg-slate-50'
              }
            `}
          >
            {mood.image ? (
              <img 
                src={mood.image} 
                className="w-16 h-16 object-contain" 
                alt={mood.label} 
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-4xl">
                {mood.emoji}
              </div>
            )}
            <span className="text-sm font-bold text-slate-600">{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
