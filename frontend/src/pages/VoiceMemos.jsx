import { useState, useEffect, useRef } from 'react'
import { notify } from '../lib/notify'
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react'
import { voice } from '../assets/images/gen'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import FamilyPage, { Art, lone } from '../components/family/FamilyPage'

export default function VoiceMemos() {
    const { user, profile, linkedElderId } = useAuth()
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
    const userId = user?.id
    const linkedElderlyId = linkedElderId

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
            notify('Could not access microphone. Please allow microphone access.', { error: true })
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
                // Private bucket: store the unguessable object name; readers get a short-lived signed URL.
                const filename = `${userId}/${crypto.randomUUID()}.webm`
                const { error } = await supabase.storage
                    .from('voice-memos')
                    .upload(filename, audioBlob, { contentType: 'audio/webm' })

                if (error) throw error

                uploadedUrl = filename
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
                notify('Voice memo sent!')
            }
        } catch (error) {
            console.error('Error sending memo:', error)
            notify('Failed to send voice memo', { error: true })
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
        <FamilyPage
            title="Voice memos"
            sub={isCaregiver ? 'Send a message to play at medicine time' : 'Messages from family'}
            back
            art={voice}
            aside={isCaregiver && (
                <section>
                    <h2 className="font-serif text-2xl">Why voice</h2>
                    <p className="mt-2 text-ink-2">A familiar voice at medicine time makes the routine feel less clinical. Messages play when a dose is due.</p>
                </section>
            )}
        >
            {/* Hidden audio element for playback */}
            <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

            {isCaregiver && (
                <section>
                    <h2 className="font-serif text-2xl">Record a message</h2>
                    {!audioUrl ? (
                        <div className="mt-3 space-y-4">
                            {isRecording ? (
                                <>
                                    <p role="status" className="flex items-center gap-3 text-xl">
                                        <span aria-hidden="true" className="h-3 w-3 animate-pulse rounded-full bg-status-danger motion-reduce:animate-none" />
                                        Recording {formatTime(recordingTime)}
                                    </p>
                                    <button type="button" onClick={stopRecording} className={`btn-primary btn-sm ${lone}`}><Square aria-hidden="true" /> Stop recording</button>
                                </>
                            ) : (
                                <button type="button" onClick={startRecording} className={`btn-primary btn-sm ${lone}`}><Mic aria-hidden="true" /> Start recording</button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-3 space-y-4">
                            <p className="text-lg">Voice memo, {formatTime(recordingTime)}</p>
                            <div className="btn-row sm:max-w-xl">
                                <button type="button" onClick={() => new Audio(audioUrl).play()} className="btn-secondary btn-sm"><Play aria-hidden="true" /> Play</button>
                                <button type="button" onClick={cancelRecording} className="btn-secondary btn-sm"><Trash2 aria-hidden="true" /> Discard</button>
                                <button type="button" onClick={sendMemo} className="btn-primary btn-sm"><Send aria-hidden="true" /> Send</button>
                            </div>
                        </div>
                    )}
                </section>
            )}

            <section>
                <h2 className="font-serif text-2xl">{isCaregiver ? 'Sent messages' : 'Messages from family'}</h2>
                {loading ? (
                    <p className="mt-2 text-ink-2">Loading messages...</p>
                ) : memos.length === 0 ? (
                    <div className="mt-2 flex items-center gap-5">
                        <Art src={voice} className="w-24 shrink-0 lg:hidden" />
                        <p className="text-ink-2">
                            {isCaregiver ? 'No messages yet. Record one to send to your loved one.' : 'Your family has not sent any voice memos yet.'}
                        </p>
                    </div>
                ) : (
                    <ul className="mt-2 divide-y divide-line">
                        {memos.map((memo) => (
                            <li key={memo.id} className="flex items-center gap-4 py-3">
                                <button type="button" onClick={() => playMemo(memo)} aria-label={playingId === memo.id ? 'Pause' : 'Play'} className="btn-secondary btn-sm !px-4">
                                    {playingId === memo.id ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                                </button>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-lg">
                                        {memo.from_user?.full_name || 'Family member'}
                                        {!memo.is_played && !isCaregiver && <span className="ml-2 text-sm font-bold text-primary">New</span>}
                                    </div>
                                    <div className="text-ink-2">{formatTime(memo.duration_seconds || 0)} · {formatDate(memo.created_at)}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </FamilyPage>
    )
}
