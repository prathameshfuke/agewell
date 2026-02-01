import { motion } from 'framer-motion'
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react'
import Card, { CardHeader } from '../ui/Card'

/**
 * EmergencyContactCard - Quick access to emergency contacts
 * 
 * Shows primary contacts with call/message actions
 */
export default function EmergencyContactCard({ 
  contacts = [],
  onCall,
  onMessage,
  onEmergency,
  className = ''
}) {
  // Use mock data if none provided
  const contactList = contacts.length > 0 ? contacts : [
    { id: 1, name: 'Dr. Smith', role: 'Primary Doctor', phone: '+1 555-0123', avatar: '👨‍⚕️' },
    { id: 2, name: 'Sarah', role: 'Daughter', phone: '+1 555-0456', avatar: '👩' },
  ]

  return (
    <Card className={className}>
      <CardHeader 
        icon={<Phone className="w-5 h-5 text-sage-500" />} 
        label="Quick Contacts"
      />

      <div className="space-y-3 mb-4">
        {contactList.map((contact, index) => (
          <motion.div
            key={contact.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 bg-sage-50 rounded-xl border border-sage-100"
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-2xl">
              {contact.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sage-800">{contact.name}</div>
              <div className="text-sage-500 text-sm">{contact.role}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onCall?.(contact)}
                className="w-10 h-10 bg-sage-500 text-white rounded-full flex items-center justify-center hover:bg-sage-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onMessage?.(contact)}
                className="w-10 h-10 bg-white text-sage-600 rounded-full flex items-center justify-center border-2 border-sage-200 hover:bg-sage-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Emergency Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onEmergency}
        className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-rose-100 hover:bg-rose-100 transition-colors"
      >
        <AlertTriangle className="w-5 h-5" />
        Emergency Support
      </motion.button>
    </Card>
  )
}
