import { motion } from 'framer-motion'
import { Pill, CheckCircle, Clock } from 'lucide-react'
import DemoElderNav from './DemoElderNav'
import { Card } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'

// Import stickers
import doneSticker from '../../assets/images/stickers/done.jpeg'
import dineSticker from '../../assets/images/stickers/dine.jpeg'
import sleepSticker from '../../assets/images/stickers/sleep.jpeg'

export default function DemoElderMeds({ onNavigate, onImOk, medications = [] }) {

    // Filter meds by status/time for demo purposes
    // In a real app, we'd parse the time strings properly
    const getPeriod = (time) => {
        if (time.includes('AM') || parseInt(time) < 12) return 'morning'
        if (time.includes('PM')) {
            const hour = parseInt(time)
            if (hour === 12 || hour < 5) return 'afternoon'
            return 'evening'
        }
        return 'morning'
    }

    const periods = [
        {
            key: 'morning',
            label: 'Morning',
            time: 'Before 12 PM',
            icon: '🌅',
            sticker: dineSticker,
            items: medications.filter(m => getPeriod(m.time) === 'morning')
        },
        {
            key: 'afternoon',
            label: 'Afternoon',
            time: '12 PM - 5 PM',
            icon: '☀️',
            sticker: null,
            items: medications.filter(m => getPeriod(m.time) === 'afternoon')
        },
        {
            key: 'evening',
            label: 'Evening',
            time: 'After 5 PM',
            icon: '🌙',
            sticker: sleepSticker,
            items: medications.filter(m => getPeriod(m.time) === 'evening')
        },
    ]

    const completedCount = medications.filter(m => m.status === 'taken').length
    const totalCount = medications.length

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'taken':
                return { label: 'Taken', color: 'bg-sage-100 text-sage-700', icon: <CheckCircle className="w-5 h-5" /> }
            case 'missed':
                return { label: 'Skipped', color: 'bg-cream-100 text-sage-500', icon: null }
            default:
                return { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-5 h-5" /> }
        }
    }

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="text-sage-500 text-sm font-bold uppercase tracking-wider mb-1">AgeWell+</div>
                    <h1 className="text-3xl font-serif font-bold text-sage-900">Today's Medicines</h1>
                    <p className="text-sage-500 text-lg mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </PageHeader>
            }
            nav={<DemoElderNav activeTab="elder-meds" onNavigate={onNavigate} onImOk={onImOk} />}
        >
            <PageMain>
                {/* Progress Summary */}
                <PageSection>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                                <div className="w-full h-full bg-sage-100 flex items-center justify-center">
                                    <Pill className="w-8 h-8 text-sage-600" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-2xl font-bold text-sage-800">
                                    {completedCount} of {totalCount} taken
                                </div>
                                <div className="text-sage-500 text-lg">
                                    {totalCount - completedCount} remaining
                                </div>
                            </div>
                        </div>
                    </Card>
                </PageSection>

                {/* Timeline */}
                {periods.map((period, periodIdx) => (
                    <PageSection key={period.key} delay={periodIdx * 0.1}>
                        <div className="relative">
                            {/* Time Period Header */}
                            <div className="flex items-center gap-3 mb-4">
                                {period.sticker ? (
                                    <img src={period.sticker} alt={period.label} className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">{period.icon}</span>
                                    </div>
                                )}
                                <div>
                                    <div className="text-xl font-bold text-sage-800">{period.label}</div>
                                    <div className="text-sage-500">{period.time}</div>
                                </div>
                            </div>

                            {/* Timeline Line */}
                            <div className="absolute left-6 top-16 bottom-4 w-0.5 bg-sage-200" />

                            {/* Medicine Cards */}
                            <div className="space-y-4 pl-14 relative">
                                {period.items.map((item, i) => {
                                    const status = getStatusDisplay(item.status)

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="relative"
                                            onClick={() => {
                                                if (item.status === 'pending') alert("In the full app, this would mark the medication as taken!")
                                            }}
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`absolute -left-14 top-6 w-4 h-4 rounded-full border-4 border-cream-50 ${item.status === 'taken' ? 'bg-sage-500' : 'bg-amber-400'
                                                }`} />

                                            {/* Medicine Card */}
                                            <Card className={`p-5 ${item.status === 'taken' ? 'bg-sage-50/50' : ''}`}>
                                                <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
                                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${item.status === 'taken' ? 'bg-sage-200' : 'bg-sage-100'
                                                        }`}>
                                                        <Pill className={`w-7 h-7 ${item.status === 'taken' ? 'text-sage-600' : 'text-sage-500'}`} />
                                                    </div>
                                                    <div className="flex-1" style={{ minWidth: '120px' }}>
                                                        <div className="text-xl font-bold text-sage-800 break-words" style={{ wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'auto' }}>{item.name}</div>
                                                        <div className="text-sage-500 text-lg break-words">{item.dosage}</div>
                                                        <div className="text-sage-400 mt-1 break-words">{item.time}</div>
                                                    </div>
                                                    <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${status.color}`}>
                                                        {status.icon && <span className="w-4 h-4 sm:w-5 sm:h-5">{status.icon}</span>}
                                                        <span className="font-bold text-sm sm:text-base whitespace-nowrap">{status.label}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </PageSection>
                ))}
            </PageMain>
        </PageLayout>
    )
}
