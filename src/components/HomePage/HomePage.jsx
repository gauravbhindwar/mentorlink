"use client";
import React, { useState} from "react";
import Login from "@/components/Login/Login";
import Navbar from "@/components/subComponents/Navbar";
import { motion, AnimatePresence } from "framer-motion";
const HomePage = () => {
  const [loginType, setLoginType] = useState(null);


  const cards = [
    { 
      type: 'mentor', 
      icon: '👨‍🏫', 
      title: 'Mentor Portal',
      description: 'Guide and support students in their academic journey',
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      shadowColor: 'rgba(251, 146, 60, 0.4)'
    },
    //Currently disabled Mentee Portal
    // { 
    //   type: 'mentee', 
    //   icon: '👨‍🎓', 
    //   title: 'Mentee Portal',
    //   description: 'Connect with mentors and track your progress',
    //   gradient: 'from-pink-500 via-rose-500 to-red-500',
    //   shadowColor: 'rgba(244, 63, 94, 0.4)'
    // },
    { 
      type: 'admin', 
      icon: '👨‍💼', 
      title: 'Admin Portal',
      description: 'Manage users and oversee system operations',
      gradient: 'from-purple-500 via-violet-500 to-indigo-500',
      shadowColor: 'rgba(147, 51, 234, 0.4)'
    },
    // { 
    //   type: 'superadmin', 
    //   icon: '👑', 
    //   title: 'SuperAdmin Portal',
    //   description: 'Full system control and configuration',
    //   gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    //   shadowColor: 'rgba(59, 130, 246, 0.4)'
    // },
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

      <div className="relative z-10 container mx-auto px-4">
        {/* Hero Section */}
        {!loginType && (
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
              Welcome to MentorLink
            </motion.h1>
            <motion.p 
              className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Connect, Learn, and Grow with MUJ&apos;s Integrated Mentorship Platform
            </motion.p>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-400px)]">
          <AnimatePresence mode="wait">
            {!loginType ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full" // Reduced gap-6 to gap-4 and max-w-5xl to max-w-4xl
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {cards.map((card, index) => (
                  <motion.div
                    key={card.type}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    whileHover={{ 
                      scale: 1.03, // Reduced from 1.05
                      boxShadow: `0 0 30px ${card.shadowColor}`,
                    }}
                    className={`
                      relative overflow-hidden
                      bg-gradient-to-br ${card.gradient}
                      rounded-xl p-6 // Reduced from rounded-2xl and p-8
                      cursor-pointer
                      transition-all duration-500
                      border border-white/10
                      backdrop-blur-sm
                      hover:border-white/20
                    `}
                    onClick={() => setLoginType(card.type)}
                  >
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-4xl mb-4 block">{card.icon}</span> {/* Reduced from text-5xl and mb-6 */}
                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3> {/* Reduced from text-2xl and mb-3 */}
                    <p className="text-white/80 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:w-32 group-hover:h-32 transition-all" /> {/* Reduced from w-32/h-32 to w-24/h-24 */}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg"
              >
                <Login role={loginType} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
