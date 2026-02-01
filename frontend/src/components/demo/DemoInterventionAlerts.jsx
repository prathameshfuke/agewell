import Card, { CardHeader } from '../ui/Card'
import { ShieldAlert, TrendingDown, Activity, Battery } from 'lucide-react'

export default function DemoInterventionAlerts() {
    return (
        <Card className="border-l-4 border-l-amber-400">
            <CardHeader
                icon={<ShieldAlert className="text-amber-500" />}
                label="Preventive Health Alerts"
                action={<span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">2 Active</span>}
            />

            <div className="space-y-3">
                <AlertItem
                    icon={TrendingDown}
                    title="Early fatigue pattern detected"
                    reason="Sleep quality dropped 15% over 3 days"
                    confidence="Medium"
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <AlertItem
                    icon={Battery}
                    title="Medication adherence declining"
                    reason="Missed evening dose 2x this week"
                    confidence="High"
                    color="text-rose-600"
                    bg="bg-rose-50"
                />
            </div>
        </Card>
    )
}

function AlertItem({ icon: Icon, title, reason, confidence, color, bg }) {
    return (
        <div className={`p-3 rounded-xl border border-transparent ${bg} flex items-start gap-3`}>
            <div className={`mt-1 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <div className={`font-bold text-sm ${color}`}>{title}</div>
                <div className="text-xs text-sage-600 mt-0.5">{reason}</div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-sage-400 uppercase">Confidence</span>
                <span className="text-xs font-bold text-sage-700">{confidence}</span>
            </div>
        </div>
    )
}
