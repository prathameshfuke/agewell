import { useState, useRef } from 'react'
import { notify } from '../lib/notify'
import { useNavigate } from 'react-router-dom'
import { Camera, Image, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { pills } from '../assets/images/gen'
import { api } from '../api/client'
import FamilyPage from '../components/family/FamilyPage'
import { useAuth } from '../contexts/AuthContext'

const PRESCRIPTION_REVIEW_STORAGE_KEY = 'agewell_prescription_review_data'

export default function PrescriptionUpload() {
  const navigate = useNavigate()
  const { profile, linkedElderId } = useAuth()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    if (!linkedElderId) {
      notify("No elder linked. Please pair first.", { error: true })
      return
    }

    setUploading(true)
    try {
      const result = await api.uploadPrescription(file, linkedElderId)
      if (result.success) {
        setUploadSuccess(true)
        setTimeout(() => {
          try {
            sessionStorage.setItem(PRESCRIPTION_REVIEW_STORAGE_KEY, JSON.stringify(result.prescription || null))
          } catch {
            // Ignore storage failures and continue navigation.
          }

          navigate('/family/prescription/review', {
            state: { prescription: result.prescription }
          })
        }, 1500)
      } else {
        notify(result.error || 'Upload failed. Please try again.', { error: true })
      }
    } catch (err) {
      notify('Upload failed. Please try again.', { error: true })
    } finally {
      setUploading(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setFile(null)
    setUploadSuccess(false)
  }

  const tips = ['Use good lighting', 'Keep the prescription flat', 'Include all medicine names']

  return (
    <FamilyPage
      title="Add a prescription"
      sub="Take a clear photo and we will read the medicines for you to review."
      back
      art={pills}
      aside={
        <section>
          <h2 className="font-serif text-2xl">For best results</h2>
          <ul className="mt-2 divide-y divide-line">
            {tips.map((t) => <li key={t} className="py-3">{t}</li>)}
          </ul>
        </section>
      }
    >
      <section>
        {preview ? (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[20px] border border-line">
              <img src={preview} alt="Prescription preview" className="max-h-[28rem] w-full object-cover" />
              {uploadSuccess && (
                <div role="status" className="absolute inset-0 flex items-center justify-center gap-3 bg-primary/90 text-xl text-white">
                  <CheckCircle className="h-8 w-8" aria-hidden="true" />
                  Processing...
                </div>
              )}
            </div>
            <div className="btn-row sm:max-w-md">
              <button type="button" onClick={clearPreview} disabled={uploading} className="btn-secondary btn-sm">Retake</button>
              <button type="button" onClick={handleUpload} disabled={uploading || uploadSuccess} className="btn-primary btn-sm">
                {uploading ? <><Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Processing...</> : <><Upload aria-hidden="true" /> Continue</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="max-w-lg text-lg text-ink-2">Your prescription photo will appear here once you choose one.</p>
            <div className="btn-row sm:max-w-md">
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-primary btn-sm"><Camera aria-hidden="true" /> Take a photo</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary btn-sm"><Image aria-hidden="true" /> Choose a photo</button>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        )}
      </section>
    </FamilyPage>
  )
}
