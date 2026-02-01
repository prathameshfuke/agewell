import { motion } from 'framer-motion'
import { User, Phone, Mail, Plus } from 'lucide-react'
import { Card } from '../ui'
import DemoFamilyNav from './DemoFamilyNav'
import oneSticker from '../../assets/images/stickers/one.jpeg'

export default function DemoFamily({ onNavigate }) {
    const FamilyMember = ({ name, role, isAdmin }) => (
        <div className="flex items-center justify-between py-4 border-b border-sage-100 last:border-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-sage-100 border-2 border-white shadow-sm">
                    {/* Placeholder avatars */}
                    <div className="w-full h-full flex items-center justify-center text-sage-400 font-bold text-lg bg-sage-50">
                        {name[0]}
                    </div>
                </div>
                <div>
                    <div className="font-bold text-sage-900 text-lg">{name}</div>
                    <div className="text-sage-500 text-sm">{role} {isAdmin && <span className="bg-sage-100 text-sage-600 px-2 py-0.5 rounded text-xs ml-1">Admin</span>}</div>
                </div>
            </div>
            <button className="w-10 h-10 rounded-full border border-sage-200 flex items-center justify-center text-sage-400">
                <Phone className="w-5 h-5" />
            </button>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="page-header pb-0">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-serif font-bold text-sage-900">Family Circle</h1>
                    <button className="w-10 h-10 rounded-full bg-sage-600 text-white flex items-center justify-center shadow-lg">
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-sage-500">3 Members caring for Grandma Martha</p>
            </div>

            <div className="page-main">
                <Card>
                    <FamilyMember name="Martha Stewart" role="Primary Caregiver" isAdmin={true} />
                    <FamilyMember name="John Doe" role="Son" />
                    <FamilyMember name="Sarah Smith" role="Granddaughter" />
                </Card>

                <div className="bg-sage-50 rounded-2xl p-6 border-dashed border-2 border-sage-200 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-sage-400 shadow-sm">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sage-800 mb-1">Invite Family</h3>
                    <p className="text-sage-500 text-sm mb-4">Send an invite code to add more family members.</p>
                    <button className="text-sage-700 font-bold text-sm bg-white px-4 py-2 rounded-lg border border-sage-200">Share Invite Code</button>
                </div>
            </div>

            <DemoFamilyNav activeTab="caregiver-family" onNavigate={onNavigate} />
        </div>
    )
}
