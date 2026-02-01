import { useState, useEffect } from 'react'
import Card, { CardHeader } from '../ui/Card'
import { Box, Wind, Thermometer, Lightbulb, Activity, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DemoMedicineHub({ status = 'Active', lastInteraction = '12 min ago', nextDose = '3h' }) {
    return (
        <Card className="bg-gradient-to-br from-white to-sage-50 border-sage-200">
            <CardHeader
                icon={<Box className="text-sage-600" />}
                label="Medicine Box Hub"
                action={
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-sage-600 uppercase tracking-wider">{status} (DEMO)</span>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-xl border border-sage-100 shadow-sm">
                    <div className="text-xs text-sage-500 font-bold uppercase mb-1">Last Interaction</div>
                    <div className="text-lg font-bold text-sage-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-sage-400" />
                        {lastInteraction}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-sage-100 shadow-sm">
                    <div className="text-xs text-sage-500 font-bold uppercase mb-1">Next Dose</div>
                    <div className="text-lg font-bold text-sage-900 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-sage-400" />
                        {nextDose}
                    </div>
                </div>
            </div>

            <div className="border-t border-sage-100 pt-4">
                <div className="text-xs font-bold text-sage-400 uppercase mb-3 text-center">Linked Home Status</div>
                <div className="grid grid-cols-3 gap-2">
                    <StatusItem icon={Thermometer} label="Comfort" value="Optimal" color="text-amber-500" bg="bg-amber-50" />
                    <StatusItem icon={Wind} label="Air Quality" value="Good" color="text-blue-500" bg="bg-blue-50" />
                    <StatusItem icon={Lightbulb} label="Lights" value="Auto" color="text-purple-500" bg="bg-purple-50" />
                </div>
            </div>
        </Card>
    )
}

function StatusItem({ icon: Icon, label, value, color, bg }) {
    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded-xl border border-transparent ${bg} bg-opacity-50`}>
            <Icon className={`w-5 h-5 ${color} mb-1`} />
            <div className="text-xs text-sage-500 font-medium">{label}</div>
            <div className="text-sm font-bold text-sage-800">{value}</div>
        </div>
    )
}

function ClockIcon(props) {
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
