"use client";
import React from "react";
import Navbar from "@/components/subComponents/Navbar";
import { motion } from "framer-motion";

const ArchivePage = () => {
  const archiveCards = [
    {
      type: 'mentors-mentee',
      icon: '👥',
      title: 'Mentors & Mentees',
      description: 'View historical mentor-mentee relationships and interactions',
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      shadowColor: 'rgba(16, 185, 129, 0.4)',
      onClick: () => router.push('/pages/archives/mentorMentee')
    },
    {
      type: 'meetings',
      icon: '📝',
      title: 'Meeting Reports',
      description: 'Access detailed reports from past meetings and sessions',
      gradient: 'from-blue-500 via-sky-500 to-cyan-500',
      shadowColor: 'rgba(14, 165, 233, 0.4)',
      onClick: () => router.push('/pages/archives/meetingReport')
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 mb-10"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Archive Center
          </motion.h1>
          <motion.p 
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Access and manage all your historical data and resources
          </motion.p>
        </motion.div>

        <div className="flex items-center justify-center min-h-[calc(100vh-400px)]">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {archiveCards.map((card, index) => (
              <motion.div
                key={card.type}
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
                  rounded-xl p-6
                  cursor-pointer
                  transition-all duration-500
                  border border-white/10
                  backdrop-blur-sm
                  hover:border-white/20
                `}
              >
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-4xl mb-4 block">{card.icon}</span>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {card.description}
                </p>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:w-32 group-hover:h-32 transition-all" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
