import Card, { CardHeader } from '../ui/Card'
import { Server, Activity, Power, Wifi, Cpu } from 'lucide-react'

export default function DemoSmartHubCard({ lastTrigger = "System operating normally" }) {
    return (
        <Card className="bg-white border-2 border-cream-300 shadow-soft">
            <CardHeader
                icon={<Server className="text-cream-600" />}
                label="Smart Hub Overview"
                action={
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-sage-600">ONLINE (DEMO)</span>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-sage-900 mb-2">
                        <Cpu className="w-4 h-4 text-sage-500" />
                        Automation Mode: <span className="text-green-600">Adaptive</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge label="AC" active />
                        <Badge label="Airflow" active />
                        <Badge label="Lights" active />
                        <Badge label="Security" active />
                    </div>
                </div>

                <div className="bg-cream-50 rounded-xl p-3 border border-cream-100">
                    <div className="text-xs font-bold text-cream-700 uppercase mb-1">Last Trigger Reason</div>
                    <div className="text-sm font-medium text-sage-800">
                        {lastTrigger}
                    </div>
                </div>
            </div>
        </Card>
    )
}

function Badge({ label, active }) {
    return (
        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${active ? 'bg-sage-50 text-sage-700 border-sage-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {label}
        </span>
    )
}
