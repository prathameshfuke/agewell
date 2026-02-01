import { useState, useEffect } from 'react'
import Card, { CardHeader } from '../ui/Card'
import { Thermometer, Wind, Droplets } from 'lucide-react'

export default function EnvironmentWidget() {
    const [environment, setEnvironment] = useState({
        temp: 24,
        humidity: 45,
        status: 'Optimal',
        mode: 'Normal'
    })

    // Simulated data fetch - in real app would hit /api/automation/devices/{id}
    useEffect(() => {
        // Mock checking "Living Room AC"
        // If we had the backend connected fully via context, we'd use that here.
        // For now, static but ready for integration.
    }, [])

    return (
        <Card className="h-full bg-gradient-to-br from-white to-sage-50">
            <CardHeader
                icon={<Wind className="text-sage-600" />}
                label="Home Comfort"
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-3 border border-sage-100 flex flex-col items-center justify-center text-center shadow-sm min-h-[100px]">
                    <Thermometer className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 mb-1 flex-shrink-0" />
                    <div className="text-2xl sm:text-3xl font-bold text-sage-800 break-all">{environment.temp}°C</div>
                    <div className="text-xs sm:text-sm text-sage-500 font-medium break-words">Temperature</div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-sage-100 flex flex-col items-center justify-center text-center shadow-sm min-h-[100px]">
                    <Droplets className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400 mb-1 flex-shrink-0" />
                    <div className="text-2xl sm:text-3xl font-bold text-sage-800 break-all">{environment.humidity}%</div>
                    <div className="text-xs sm:text-sm text-sage-500 font-medium break-words">Humidity</div>
                </div>
            </div>

            <div className={`mt-3 sm:mt-4 p-3 rounded-xl border flex items-center gap-3 ${environment.mode === 'Arthritis Comfort'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-sage-100 border-sage-200 text-sage-800'
                }`}>
                <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-bold break-words">Room Feels Cozy</div>
                    <div className="text-xs sm:text-sm opacity-80 break-words">Adjusted for your comfort</div>
                </div>
            </div>
        </Card>
    )
}
