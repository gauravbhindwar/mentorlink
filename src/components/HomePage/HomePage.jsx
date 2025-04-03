"use client";
import React, { useEffect, useState } from "react";
import Login from "../Login/Login";
import AboutUs from "../AboutUs/AboutUs";
import Image from "next/image";
import { motion } from "framer-motion";

const HomePage = () => {
  const [showAboutUs, setShowAboutUs] = useState(false);

  // Add ESC key handler
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        setShowAboutUs(false);
      }
    };

    if (showAboutUs) {
      window.addEventListener("keydown", handleEscKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [showAboutUs]);

  return (
    <div className='min-h-screen bg-[#0a0a0a] overflow-hidden relative'>
      {/* Enhanced Background Effects */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
        <div className='absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
        <div className='absolute inset-0 backdrop-blur-3xl' />
        <Image
          src='/MUJ-homeCover.jpg'
          alt='MUJ Campus'
          fill
          className='object-cover opacity-20 mix-blend-overlay'
        />
      </div>

      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setShowAboutUs(true)}
        className='fixed top-4 right-4 z-50 px-6 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm tracking-wide border border-white/10'>
        About Us
      </motion.button>

      {/* About Us Sliding Panel */}
      {showAboutUs && (
        <>
          <div
            onClick={() => setShowAboutUs(false)}
            className='fixed inset-0 bg-black/50 z-40 transition-opacity duration-300'
          />
          <div
            className={`fixed top-0 h-full bg-transparent z-50 overflow-y-auto custom-scrollbar w-[70%] transition-all duration-500 ease-in-out ${
              showAboutUs ? "right-0" : "-right-[70%]"
            }`}>
            <button
              onClick={() => setShowAboutUs(false)}
              className='absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white hover:text-gray-300 transition-all text-3xl font-light border border-gray-600/50'>
              ×
            </button>
            <AboutUs />
          </div>
        </>
      )}

      <div className='relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8'>
        <motion.div 
          className='text-center mb-12'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            <Image
              src='/muj-logo.svg'
              alt='MUJ Logo'
              className='mx-auto w-48 sm:w-64 md:w-80 mb-8'
              width={200}
              height={200}
            />
          </motion.div>
          <motion.h1 
            className='text-4xl sm:text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}>
            Mentorlink
          </motion.h1>
          <motion.p 
            className='text-gray-300 text-sm md:text-base tracking-wider uppercase mb-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}>
            By Software Development Center
          </motion.p>
        </motion.div>

        <motion.div 
          className='w-full sm:w-[450px] md:w-[550px] lg:w-[650px] p-6 sm:p-8 rounded-lg '
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}>
          <Login />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
