import Card, { CardHeader } from '../ui/Card'
import { Clock, Zap, Thermometer, Wind, Moon } from 'lucide-react'

export default function DemoAutomationTimeline() {
    const events = [
        { time: '08:15', title: 'Temperature Increased', reason: 'Arthritis support rule', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-100' },
        { time: '11:40', title: 'Humidity Adjusted', reason: 'Breathing comfort rule', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-100' },
        { time: '21:30', title: 'Sleep Mode Enabled', reason: 'Night routine schedule', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-100' },
    ]

    return (
        <Card>
            <CardHeader icon={<Clock className="text-sage-600" />} label="Automation Timeline" />

            <div className="relative pl-4 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-sage-100">
                {events.map((event, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                        <div className={`relative z-10 w-10 h-10 rounded-full ${event.bg} flex items-center justify-center border-4 border-white shadow-sm flex-shrink-0`}>
                            <event.icon className={`w-5 h-5 ${event.color}`} />
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sage-900">{event.title}</span>
                                <span className="text-xs font-bold text-sage-400 bg-sage-50 px-2 py-1 rounded-full">{event.time}</span>
                            </div>
                            <p className="text-sm text-sage-500 mt-0.5">{event.reason}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <button className="text-sm font-bold text-sage-600 hover:text-sage-800">View Full History</button>
            </div>
        </Card>
    )
}
