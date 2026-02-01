import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Wifi, WifiOff, Plus, Pill, Check, AlertCircle, Settings, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

// Import stickers
import oneSticker from '../assets/images/stickers/one.jpeg'

export default function DispenserSetup() {
    const navigate = useNavigate()
    const { user, profile, loading: authLoading } = useAuth()
    const [devices, setDevices] = useState([])
    const [medications, setMedications] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddDevice, setShowAddDevice] = useState(false)
    const [newDeviceId, setNewDeviceId] = useState('')
    const [newDeviceName, setNewDeviceName] = useState('')
    const [selectedDevice, setSelectedDevice] = useState(null)
    const [slots, setSlots] = useState([])

    const userId = user?.id || profile?.id

    useEffect(() => {
        if (!authLoading && !userId) {
            navigate('/auth')
            return
        }
        if (userId) {
            loadData()
        }
    }, [userId, authLoading, navigate])

    const loadData = async () => {
        setLoading(true)
        try {
            const [devicesResult, medsResult] = await Promise.all([
                api.getDevices(userId),
                api.getMedications(userId)
            ])

            if (devicesResult.success) {
                setDevices(devicesResult.devices || [])
                if (devicesResult.devices?.length > 0 && !selectedDevice) {
                    setSelectedDevice(devicesResult.devices[0])
                }
            }
            if (medsResult.success) {
                setMedications(medsResult.medications || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedDevice) {
            loadSlots(selectedDevice.id)
        }
    }, [selectedDevice])

    const loadSlots = async (deviceId) => {
        const result = await api.getSlots(deviceId)
        if (result.success) {
            setSlots(result.slots || [])
        }
    }

    const handleAddDevice = async () => {
        if (!newDeviceId.trim()) return

        const result = await api.registerDevice(userId, newDeviceId.trim(), newDeviceName || 'My Dispenser')
        if (result.success) {
            setDevices([...devices, result.device])
            setSelectedDevice(result.device)
            setShowAddDevice(false)
            setNewDeviceId('')
            setNewDeviceName('')
        }
    }

    const handleAssignMedication = async (slotId, medicationId) => {
        const result = await api.assignSlot(slotId, medicationId)
        if (result.success) {
            loadSlots(selectedDevice.id)
        }
    }

    const getSlotColor = (slotNumber) => {
        const colors = ['#4CAF50', '#2196F3', '#FF9800']
        return colors[slotNumber - 1] || colors[0]
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-8">
            {/* Header */}
            <header className="px-6 py-5 flex items-center gap-4 bg-cream-50 sticky top-0 z-10">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="p-2 text-sage-500 hover:bg-sage-100 rounded-xl"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div className="flex-1">
                    <h1 className="text-2xl font-serif font-bold text-sage-900">Dispenser Setup</h1>
                    <p className="text-sage-500">Manage your medicine dispenser</p>
                </div>
            </header>

            <main className="px-6 space-y-6">
                {/* Device Selection */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-sage-800">Your Devices</h2>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddDevice(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-sage-500 text-white rounded-xl font-bold"
                        >
                            <Plus className="w-5 h-5" />
                            Add Device
                        </motion.button>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-2xl p-8 border-2 border-sage-100 text-center">
                            <RefreshCw className="w-8 h-8 text-sage-400 animate-spin mx-auto mb-2" />
                            <p className="text-sage-500">Loading devices...</p>
                        </div>
                    ) : devices.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-8 border-2 border-sage-100 text-center"
                        >
                            <img src={oneSticker} alt="Setup" className="w-24 h-24 mx-auto mb-4 rounded-2xl" />
                            <h3 className="text-xl font-bold text-sage-800 mb-2">No Dispenser Connected</h3>
                            <p className="text-sage-500 mb-4">Add your ESP32 dispenser to get started</p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddDevice(true)}
                                className="px-6 py-3 bg-sage-500 text-white rounded-xl font-bold"
                            >
                                Connect Dispenser
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {devices.map((device) => (
                                <motion.button
                                    key={device.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedDevice(device)}
                                    className={`w-full bg-white rounded-2xl p-5 border-2 text-left transition-all ${selectedDevice?.id === device.id
                                        ? 'border-sage-500 bg-sage-50'
                                        : 'border-sage-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${device.wifi_status === 'online' ? 'bg-sage-100' : 'bg-sage-50'
                                            }`}>
                                            {device.wifi_status === 'online' ? (
                                                <Wifi className="w-6 h-6 text-sage-600" />
                                            ) : (
                                                <WifiOff className="w-6 h-6 text-sage-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sage-800 text-lg">{device.name}</div>
                                            <div className="text-sage-500 text-sm">{device.device_id}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${device.wifi_status === 'online'
                                            ? 'bg-sage-100 text-sage-700'
                                            : 'bg-sage-50 text-sage-400'
                                            }`}>
                                            {device.wifi_status === 'online' ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Slot Assignment */}
                {selectedDevice && (
                    <section>
                        <h2 className="text-lg font-bold text-sage-800 mb-4">Medication Slots</h2>
                        <p className="text-sage-500 mb-4">
                            Assign medications to each slot. The LED will guide you during loading.
                        </p>

                        <div className="space-y-4">
                            {[1, 2, 3].map((slotNum) => {
                                const slot = slots.find(s => s.slot_number === slotNum)
                                const assignedMed = slot?.medication_id
                                    ? medications.find(m => m.id === slot.medication_id)
                                    : null

                                return (
                                    <motion.div
                                        key={slotNum}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: slotNum * 0.1 }}
                                        className="bg-white rounded-2xl p-5 border-2 border-sage-100"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* LED Indicator */}
                                            <div
                                                className="w-14 h-14 rounded-xl flex items-center justify-center border-2"
                                                style={{
                                                    backgroundColor: `${getSlotColor(slotNum)}20`,
                                                    borderColor: getSlotColor(slotNum)
                                                }}
                                            >
                                                <div
                                                    className="w-4 h-4 rounded-full animate-pulse"
                                                    style={{ backgroundColor: getSlotColor(slotNum) }}
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="text-sage-500 text-sm font-bold uppercase tracking-wider mb-1">
                                                    Slot {slotNum}
                                                </div>

                                                {assignedMed ? (
                                                    <div className="flex items-center gap-2">
                                                        <Pill className="w-5 h-5 text-sage-600" />
                                                        <span className="font-bold text-sage-800">{assignedMed.name}</span>
                                                        <span className="text-sage-500">{assignedMed.dosage}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sage-400">No medication assigned</p>
                                                )}

                                                {slot && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="text-sm text-sage-500">
                                                            {slot.current_quantity}/{slot.max_quantity} remaining
                                                        </div>
                                                        {slot.current_quantity < 5 && (
                                                            <div className="flex items-center gap-1 text-amber-600 text-sm">
                                                                <AlertCircle className="w-4 h-4" />
                                                                Low stock
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Assign Dropdown */}
                                            <select
                                                value={slot?.medication_id || ''}
                                                onChange={(e) => slot && handleAssignMedication(slot.id, e.target.value || null)}
                                                className="px-4 py-2 bg-sage-50 border-2 border-sage-200 rounded-xl text-sage-700 font-medium"
                                            >
                                                <option value="">Select Medication</option>
                                                {medications.map((med) => (
                                                    <option key={med.id} value={med.id}>
                                                        {med.name} ({med.dosage})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* LED Guidance Info */}
                        <div className="mt-6 bg-sage-50 rounded-2xl p-5 border-2 border-sage-100">
                            <h3 className="font-bold text-sage-800 mb-3 flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                LED Guidance System
                            </h3>
                            <p className="text-sage-600 text-sm mb-3">
                                When loading medications, the corresponding slot LED will illuminate to guide you:
                            </p>
                            <div className="flex gap-4">
                                {[1, 2, 3].map((num) => (
                                    <div key={num} className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: getSlotColor(num) }}
                                        />
                                        <span className="text-sage-600 text-sm">Slot {num}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Add Device Modal */}
            {showAddDevice && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowAddDevice(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white w-full max-w-md rounded-3xl p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-sage-900 mb-6">Add Dispenser</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sage-600 font-bold mb-2">Device ID (MAC Address)</label>
                                <input
                                    type="text"
                                    value={newDeviceId}
                                    onChange={(e) => setNewDeviceId(e.target.value)}
                                    placeholder="e.g., ESP32-ABCD1234"
                                    className="w-full px-4 py-3 border-2 border-sage-200 rounded-xl text-sage-800 focus:border-sage-500 focus:outline-none"
                                />
                                <p className="text-sage-400 text-sm mt-1">
                                    Find this on your dispenser or its packaging
                                </p>
                            </div>

                            <div>
                                <label className="block text-sage-600 font-bold mb-2">Device Name (Optional)</label>
                                <input
                                    type="text"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    placeholder="e.g., Living Room Dispenser"
                                    className="w-full px-4 py-3 border-2 border-sage-200 rounded-xl text-sage-800 focus:border-sage-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddDevice(false)}
                                className="flex-1 py-3 border-2 border-sage-200 text-sage-600 rounded-xl font-bold"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddDevice}
                                disabled={!newDeviceId.trim()}
                                className="flex-1 py-3 bg-sage-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-5 h-5" />
                                Add Device
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}
