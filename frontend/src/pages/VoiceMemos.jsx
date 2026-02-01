import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, Square, Play, Pause, Trash2, Send, Clock, User } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Import stickers
import twoSticker from '../assets/images/stickers/two.jpeg'
import goodmoodSticker from '../assets/images/stickers/goodmood.jpeg'

export default function VoiceMemos() {
    const navigate = useNavigate()
    const { user, profile } = useAuth()
    const [memos, setMemos] = useState([])
    const [loading, setLoading] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)
    const [playingId, setPlayingId] = useState(null)

    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const timerRef = useRef(null)
    const audioRef = useRef(null)

    const isCaregiver = profile?.role === 'caregiver'
    const userId = user?.id || (isCaregiver ? 'mock-caregiver-1' : 'mock-elderly-1')
    const linkedElderlyId = profile?.linked_elderly_id || 'mock-elderly-1'

    useEffect(() => {
        loadMemos()
    }, [userId])

    const loadMemos = async () => {
        setLoading(true)
        try {
            const result = await api.getVoiceMemos(isCaregiver ? linkedElderlyId : userId)
            if (result.success) {
                setMemos(result.memos || [])
            }
        } catch (error) {
            console.error('Error loading memos:', error)
        } finally {
            setLoading(false)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setRecordingTime(0)

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('Error starting recording:', error)
            alert('Could not access microphone. Please allow microphone access.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        stopRecording()
        setAudioBlob(null)
        setAudioUrl(null)
        setRecordingTime(0)
    }

    const sendMemo = async () => {
        if (!audioBlob) return

        try {
            // In production, upload to Supabase Storage
            let uploadedUrl = audioUrl

            if (supabase) {
                const filename = `voice-memo-${Date.now()}.webm`
                const { data, error } = await supabase.storage
                    .from('voice-memos')
                    .upload(filename, audioBlob)

                if (error) throw error

                const { data: { publicUrl } } = supabase.storage
                    .from('voice-memos')
                    .getPublicUrl(filename)

                uploadedUrl = publicUrl
            }

            // Create memo record
            const memo = {
                from_user_id: userId,
                to_user_id: linkedElderlyId,
                audio_url: uploadedUrl,
                duration_seconds: recordingTime
            }

            const result = await api.createVoiceMemo(memo)
            if (result.success) {
                setAudioBlob(null)
                setAudioUrl(null)
                setRecordingTime(0)
                loadMemos()
                alert('Voice memo sent!')
            }
        } catch (error) {
            console.error('Error sending memo:', error)
            alert('Failed to send voice memo')
        }
    }

    const playMemo = (memo) => {
        if (playingId === memo.id) {
            audioRef.current?.pause()
            setPlayingId(null)
        } else {
            if (audioRef.current) {
                audioRef.current.src = memo.audio_url
                audioRef.current.play()
                setPlayingId(memo.id)
            }
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        return date.toLocaleDateString()
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-8">
            {/* Hidden audio element for playback */}
            <audio
                ref={audioRef}
                onEnded={() => setPlayingId(null)}
                className="hidden"
            />

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
                    <h1 className="text-2xl font-serif font-bold text-sage-900">Voice Memos</h1>
                    <p className="text-sage-500">
                        {isCaregiver ? 'Send loving messages' : 'Messages from family'}
                    </p>
                </div>
            </header>

            <main className="px-6 space-y-6">
                {/* Recording Section (Caregiver Only) */}
                {isCaregiver && (
                    <section>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 border-2 border-sage-100"
                        >
                            <h2 className="text-lg font-bold text-sage-800 mb-4">Record a Message</h2>
                            <p className="text-sage-500 mb-6">
                                Record a voice memo to be played during your loved one's medication time.
                            </p>

                            {!audioUrl ? (
                                <div className="text-center">
                                    {!isRecording ? (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startRecording}
                                            className="w-24 h-24 rounded-full bg-sage-500 text-white flex items-center justify-center mx-auto shadow-lg"
                                        >
                                            <Mic className="w-10 h-10" />
                                        </motion.button>
                                    ) : (
                                        <div>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={stopRecording}
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="w-24 h-24 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg"
                                            >
                                                <Square className="w-8 h-8" />
                                            </motion.button>
                                            <div className="mt-4 text-2xl font-bold text-sage-800">
                                                {formatTime(recordingTime)}
                                            </div>
                                            <p className="text-sage-500">Recording...</p>
                                        </div>
                                    )}
                                    <p className="text-sage-400 mt-4 text-sm">
                                        {isRecording ? 'Tap to stop' : 'Tap to start recording'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Preview */}
                                    <div className="bg-sage-50 rounded-2xl p-4 flex items-center gap-4">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const audio = new Audio(audioUrl)
                                                audio.play()
                                            }}
                                            className="w-12 h-12 rounded-full bg-sage-500 text-white flex items-center justify-center"
                                        >
                                            <Play className="w-6 h-6" />
                                        </motion.button>
                                        <div className="flex-1">
                                            <div className="font-bold text-sage-800">Voice Memo</div>
                                            <div className="text-sage-500">{formatTime(recordingTime)}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={cancelRecording}
                                            className="flex-1 py-3 border-2 border-sage-200 text-sage-600 rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            Discard
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={sendMemo}
                                            className="flex-1 py-3 bg-sage-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-5 h-5" />
                                            Send
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </section>
                )}

                {/* Memos List */}
                <section>
                    <h2 className="text-lg font-bold text-sage-800 mb-4">
                        {isCaregiver ? 'Sent Messages' : 'Messages from Family'}
                    </h2>

                    {loading ? (
                        <div className="bg-white rounded-2xl p-8 border-2 border-sage-100 text-center">
                            <p className="text-sage-500">Loading messages...</p>
                        </div>
                    ) : memos.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-8 border-2 border-sage-100 text-center"
                        >
                            <img
                                src={isCaregiver ? twoSticker : goodmoodSticker}
                                alt="No messages"
                                className="w-24 h-24 mx-auto mb-4 rounded-2xl"
                            />
                            <h3 className="text-xl font-bold text-sage-800 mb-2">No Messages Yet</h3>
                            <p className="text-sage-500">
                                {isCaregiver
                                    ? 'Record a voice memo to send to your loved one'
                                    : 'Your family hasn\'t sent any voice memos yet'}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {memos.map((memo, index) => (
                                <motion.div
                                    key={memo.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white rounded-2xl p-4 border-2 ${!memo.is_played && !isCaregiver ? 'border-sage-300 bg-sage-50' : 'border-sage-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => playMemo(memo)}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center ${playingId === memo.id
                                                    ? 'bg-sage-600 text-white'
                                                    : 'bg-sage-100 text-sage-600'
                                                }`}
                                        >
                                            {playingId === memo.id ? (
                                                <Pause className="w-6 h-6" />
                                            ) : (
                                                <Play className="w-6 h-6 ml-1" />
                                            )}
                                        </motion.button>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-sage-400" />
                                                <span className="font-bold text-sage-800">
                                                    {memo.from_user?.full_name || 'Family Member'}
                                                </span>
                                                {!memo.is_played && !isCaregiver && (
                                                    <span className="px-2 py-0.5 bg-sage-500 text-white text-xs rounded-full font-bold">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sage-500 text-sm mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(memo.duration_seconds || 0)}
                                                </span>
                                                <span>{formatDate(memo.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Info */}
                <div className="bg-sage-50 rounded-2xl p-5 border-2 border-sage-100">
                    <h3 className="font-bold text-sage-800 mb-2">💝 Emotional Wellness</h3>
                    <p className="text-sage-600 text-sm">
                        Voice memos help maintain emotional connection between caregivers and loved ones.
                        Messages are played during medication times to create positive associations with
                        healthcare routines.
                    </p>
                </div>
            </main>
        </div>
    )
}
