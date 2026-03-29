import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react'

import { api } from '../../api/client'
import { Card, Button } from '../../components/ui'

export default function ImageUpload({ sessionId, onUploadComplete }) {
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)

    const inputRef = useRef(null)

    const uploadFile = async (file) => {
        if (!file || !sessionId) return

        setUploading(true)
        const response = await api.uploadDiagnosisImage(sessionId, file)
        setUploading(false)

        if (response.success) {
            setResult(response)
            if (onUploadComplete) {
                onUploadComplete(response)
            }
        }
    }

    const onDrop = (event) => {
        event.preventDefault()
        setDragging(false)
        const file = event?.dataTransfer?.files?.[0]
        if (file) uploadFile(file)
    }

    return (
        <Card>
            <h3 className="text-xl font-bold text-sage-800 mb-3">Optional: Upload a Photo or Report</h3>
            <p className="text-sage-500 text-lg mb-4">You can upload a wound image, rash photo, or report scan for better summary context.</p>

            <motion.div
                whileHover={{ scale: 1.01 }}
                onDragEnter={(e) => {
                    e.preventDefault()
                    setDragging(true)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                    dragging ? 'border-sage-400 bg-sage-50' : 'border-sage-200 bg-cream-50'
                }`}
            >
                <UploadCloud className="w-10 h-10 text-sage-500 mx-auto mb-2" />
                <p className="text-sage-700 text-lg font-semibold">Drag and drop image here</p>
                <p className="text-sage-500">or use camera/gallery buttons below</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <Button
                    variant="primary"
                    size="lg"
                    icon={Camera}
                    fullWidth
                    onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.capture = 'environment'
                        input.onchange = (e) => uploadFile(e.target.files?.[0])
                        input.click()
                    }}
                    disabled={uploading}
                >
                    Use Camera
                </Button>
                <Button
                    variant="secondary"
                    size="lg"
                    icon={ImageIcon}
                    fullWidth
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    Choose File
                </Button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadFile(e.target.files?.[0])}
            />

            {uploading && (
                <div className="flex items-center gap-2 mt-4 text-sage-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-lg">Analyzing image...</span>
                </div>
            )}

            {result?.success && (
                <div className="mt-4 space-y-3">
                    <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
                        <div className="text-sm font-bold uppercase tracking-wider text-sage-600 mb-1">Image Observations</div>
                        <p className="text-sage-800 text-lg">{result.observations}</p>
                    </div>

                    {result.flagged_urgent && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <p className="text-rose-700 font-bold text-lg">Potential urgent finding detected from image. Consider immediate clinical review.</p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
