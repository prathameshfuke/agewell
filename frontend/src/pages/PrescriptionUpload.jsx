import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Image, ArrowLeft, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '../api/client'
import FamilyNav from '../components/FamilyNav'
import { useAuth } from '../contexts/AuthContext'

export default function PrescriptionUpload() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const fileInputRef = useRef(null)
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

    if (!profile?.linked_elderly_id) {
      alert("No elder linked. Please pair first.")
      return
    }

    setUploading(true)
    try {
      const result = await api.uploadPrescription(file, profile.linked_elderly_id)
      if (result.success) {
        setUploadSuccess(true)
        setTimeout(() => {
          navigate('/family/prescription-review', {
            state: { prescription: result.prescription }
          })
        }, 1500)
      } else {
        alert(result.error || 'Upload failed. Please try again.')
      }
    } catch (err) {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setFile(null)
    setUploadSuccess(false)
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-28">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-4 sticky top-0 bg-cream-50 z-10 border-b border-sage-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="p-3 text-sage-500 hover:bg-sage-50 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="text-xl font-bold text-sage-800">Upload Prescription</h1>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-serif font-bold text-sage-800 mb-3">
            Add a New Prescription
          </h2>
          <p className="text-sage-500 text-lg leading-relaxed">
            Take a clear photo of the prescription. Our AI will extract the medicines for you.
          </p>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-sage-50 rounded-2xl p-5 border-2 border-sage-100"
        >
          <div className="font-bold text-sage-700 mb-3">Tips for best results:</div>
          <ul className="space-y-2 text-sage-600">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" />
              <span>Use good lighting</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" />
              <span>Keep the prescription flat</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-sage-500 mt-0.5 flex-shrink-0" />
              <span>Include all medicine names</span>
            </li>
          </ul>
        </motion.div>

        {/* Preview or Upload Buttons */}
        <AnimatePresence mode="wait">
          {preview ? (
            /* Preview State */
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="relative rounded-3xl overflow-hidden border-2 border-sage-200 shadow-sm">
                <img
                  src={preview}
                  alt="Prescription preview"
                  className="w-full h-64 object-cover"
                />
                {uploadSuccess && (
                  <div className="absolute inset-0 bg-sage-500/90 flex items-center justify-center">
                    <div className="text-center text-white">
                      <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                      <div className="text-xl font-bold">Processing...</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={clearPreview}
                  disabled={uploading}
                  className="py-4 rounded-2xl font-bold text-base sm:text-lg border-2 border-sage-200 text-sage-600 bg-white disabled:opacity-50 min-h-touch"
                >
                  Retake
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={uploading || uploadSuccess}
                  className="py-4 rounded-2xl font-bold text-lg bg-sage-500 text-white disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      Continue
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Upload Buttons */
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Visual Placeholder */}
              <div className="bg-sage-50 border-2 border-dashed border-sage-300 rounded-3xl p-8 text-center">
                <div className="w-24 h-24 bg-sage-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-sage-400" />
                </div>
                <p className="text-sage-500 text-lg">
                  Your prescription photo will appear here
                </p>
              </div>

              {/* Large Upload Buttons */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                {/* Camera Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.capture = 'environment'
                    input.onchange = handleFileSelect
                    input.click()
                  }}
                  className="bg-sage-500 text-white py-6 rounded-2xl flex flex-col items-center gap-3 shadow-md"
                >
                  <Camera className="w-10 h-10" />
                  <span className="text-lg font-bold">Camera</span>
                </motion.button>

                {/* Gallery Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-sage-700 py-6 rounded-2xl flex flex-col items-center gap-3 border-2 border-sage-200 shadow-sm"
                >
                  <Image className="w-10 h-10" />
                  <span className="text-lg font-bold">Gallery</span>
                </motion.button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <FamilyNav />
    </div>
  )
}
