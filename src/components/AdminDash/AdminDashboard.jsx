"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/subComponents/Navbar'

const AdminDashboard = () => {
    const router = useRouter();

    const cards = [
        {
            title: 'Manage Mentees',
            icon: '👨‍🎓',
            description: 'View and manage student mentees',
            gradient: 'from-orange-500 via-amber-500 to-yellow-500',
            shadowColor: 'rgba(251, 146, 60, 0.4)',
            onClick: () => router.push('/pages/admin/managementee')
        },
        {
            title: 'Manage Mentors',
            icon: '👨‍🏫',
            description: 'Oversee and coordinate mentors',
            gradient: 'from-pink-500 via-rose-500 to-red-500',
            shadowColor: 'rgba(244, 63, 94, 0.4)',
            onClick: () => router.push('/pages/admin/managementor')
        },
        {
            title: 'Manage Meetings',
            icon: '📊',
            description: 'Manage meetings & Generate Meeting Reports',
            gradient: 'from-purple-500 via-violet-500 to-indigo-500',
            shadowColor: 'rgba(147, 51, 234, 0.4)',
            onClick: () => router.push('/pages/admin/managemeeting')
        },
        {
            title: 'Create New Academic Session',
            icon: '📅',
            description: 'Create and manage academic sessions',
            gradient: 'from-green-500 via-emerald-500 to-teal-500',
            shadowColor: 'rgba(16, 185, 129, 0.4)',
            onClick: () => router.push('/pages/admin/createacademicsession')
        },
        // {
        //     title: 'Student Queries',
        //     icon: '❓',
        //     description: 'Handle student support requests',
        //     gradient: 'from-green-500 via-emerald-500 to-teal-500',
        //     shadowColor: 'rgba(16, 185, 129, 0.4)',
        //     onClick: () => router.push('/pages/squery')
        // },
        // {
        //     title: 'Mentor Queries',
        //     icon: '💭',
        //     description: 'Address mentor inquiries',
        //     gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        //     shadowColor: 'rgba(245, 158, 11, 0.4)',
        //     onClick: () => router.push('/pages/admin/mquery')
        // },
        {
            title: 'Archives',
            icon: '📚',
            description: 'Access historical records',
            gradient: 'from-slate-500 via-gray-500 to-zinc-500',
            shadowColor: 'rgba(71, 85, 105, 0.4)',
            onClick: () => router.push('/pages/archives')  // Updated path
        },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
                <div className="absolute inset-0 backdrop-blur-3xl" />
            </div>

            <Navbar />

            <div className="relative z-10 px-4 md:px-6 pt-20 pb-10">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                >
                    <motion.h1 
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Admin Dashboard
                    </motion.h1>
                    <motion.p 
                        className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Manage and oversee all aspects of the mentorship program
                    </motion.p>
                </motion.div>

                {/* Cards Grid */}
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { delay: index * 0.1 }
                            }}
                            whileHover={{ 
                                scale: 1.03,
                                boxShadow: `0 0 30px ${card.shadowColor}`,
                            }}
                            className={`
                                relative overflow-hidden
                                bg-gradient-to-br ${card.gradient}
                                rounded-lg p-4
                                cursor-pointer
                                transition-all duration-500
                                border border-white/10
                                backdrop-blur-sm
                                hover:border-white/20
                            `}
                            onClick={card.onClick}
                        >
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-3xl mb-3 block">{card.icon}</span>
                            <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                            <p className="text-white/80 text-sm">
                                {card.description}
                            </p>
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:w-24 group-hover:h-24 transition-all" />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;