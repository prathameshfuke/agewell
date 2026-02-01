import { useState, useEffect } from 'react'
import Card, { CardHeader, CardSection } from '../ui/Card'
import { Wind, Thermometer, Lock, Lightbulb, Power } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'

// Mock Data for Initial State (would come from API)
const INITIAL_DEVICES = [
    { id: 1, name: 'Living Room AC', type: 'ac', room: 'Living Room', active: true, setting: '24°C', icon: Wind },
    { id: 3, name: 'Humidifier', type: 'humidifier', room: 'Bedroom', active: true, setting: '45%', icon: DropletsIcon },
    { id: 5, name: 'Front Door', type: 'lock', room: 'Entrance', active: true, setting: 'Locked', icon: Lock },
    { id: 6, name: 'Main Lights', type: 'light', room: 'Living Room', active: true, setting: 'Warm White', icon: Lightbulb },
]

function DropletsIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.8-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
            <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
        </svg>
    )
}

export default function SmartControlPanel() {
    const [devices, setDevices] = useState(INITIAL_DEVICES)
    const [loading, setLoading] = useState(false)

    const toggleDevice = (id) => {
        setDevices(devices.map(d => {
            if (d.id === id) {
                // Toggle logic
                const newState = !d.active
                let newSetting = d.setting
                if (d.type === 'lock') newSetting = newState ? 'Locked' : 'Unlocked'
                if (d.type === 'light') newSetting = newState ? 'Warm White' : 'Off'
                if (d.type === 'ac') newSetting = newState ? '24°C' : 'Off'

                return { ...d, active: newState, setting: newSetting }
            }
            return d
        }))
    }

    return (
        <Card className="h-full">
            <CardHeader
                icon={<Power className="text-sage-600" />}
                label="Home Environment Control"
                action={
                    <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Connected</span>
                    </div>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {devices.map((device) => {
                    const Icon = device.icon
                    const isActive = device.active

                    return (
                        <div
                            key={device.id}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isActive
                                    ? 'bg-sage-50 border-sage-200'
                                    : 'bg-gray-50 border-gray-100 opacity-70'
                                }`}
                            onClick={() => toggleDevice(device.id)}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive
                                    ? 'bg-sage-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sage-900 truncate">{device.name}</div>
                                <div className="text-sm text-sage-500">{device.setting}</div>
                            </div>

                            <motion.div
                                className={`w-10 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-sage-500' : 'bg-gray-300'}`}
                                layout
                            >
                                <motion.div
                                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                                    layout
                                    animate={{ x: isActive ? 16 : 0 }}
                                />
                            </motion.div>
                        </div>
                    )
                })}
            </div>

            <CardSection className="mt-6">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Thermometer className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-sage-900">Adaptive Comfort Active</div>
                        <div className="text-xs text-sage-600 mt-1">
                            System is automatically adjusting temperature for <strong>Arthritis Care</strong> templates.
                            Morning target: 26°C.
                        </div>
                    </div>
                </div>
            </CardSection>
        </Card>
    )
}
