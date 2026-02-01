import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Crown, Mail, Phone, Trash2, ArrowRight } from 'lucide-react'
import FamilyNav from '../components/FamilyNav'
import CareTeamAvatars from '../components/dashboard/CareTeamAvatars'

const members = [
    { name: 'Shura', role: 'Primary', email: 'shura@example.com', phone: '555-0101', isMe: true },
    { name: 'Aarav', role: 'Viewer', email: 'aarav@example.com', phone: '555-0102', isMe: false },
    { name: 'Dr. Smith', role: 'Viewer', email: 'dr.smith@clinic.com', phone: '555-0199', isMe: false }
]

export default function FamilyMembers() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-sage-50 to-cream-100 font-sans pb-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sage-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <header className="px-6 py-6 sticky top-0 bg-cream-50/80 backdrop-blur-md z-10 border-b border-sage-100/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="text-sage-500 text-xs font-bold uppercase tracking-wider mb-1">Access</div>
                        <h1 className="font-serif text-3xl text-sage-900 tracking-tight">Care Team</h1>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <CareTeamAvatars size="default" maxDisplay={4} />
                    </motion.div>
                </div>
            </header>

            <main className="px-6 space-y-5 mt-2">
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white/60 backdrop-blur-sm p-4 rounded-3xl shadow-soft flex items-center justify-center gap-3 text-sage-700 font-bold hover:bg-white hover:shadow-card-hover transition-all duration-300 border border-sage-200/50 border-dashed"
                >
                    <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-600">
                        <UserPlus className="w-4 h-4" />
                    </div>
                    <span>Invite Member</span>
                </motion.button>

                <div className="space-y-4">
                    {members.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/80 backdrop-blur-sm p-5 rounded-[2rem] shadow-card border border-white/50 hover:shadow-card-hover transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-serif font-bold ${m.role === 'Primary'
                                    ? 'bg-gradient-sage text-white shadow-lg shadow-sage-200'
                                    : 'bg-sage-50 text-sage-600'
                                    }`}>
                                    {m.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sage-900 text-lg flex items-center gap-2">
                                        {m.name}
                                        {m.role === 'Primary' && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block tracking-wide uppercase ${m.role === 'Primary' ? 'bg-sage-100 text-sage-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {m.role}
                                        </div>
                                    </div>
                                </div>
                                {!m.isMe && (
                                    <button className="p-3 text-sage-300 hover:text-rose-400 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => navigate('/family/permissions')}
                    className="w-full py-4 text-sage-500 font-medium text-sm hover:text-sage-700 transition-colors flex items-center justify-center gap-1 group"
                >
                    Manage Permissions
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </main>

            <FamilyNav />
        </div>
    )
}
