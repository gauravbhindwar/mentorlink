
'use client';
import React from 'react';
import { motion } from 'framer-motion';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'John Doe',
      role: 'Founder & CEO',
      image: '/path-to-image.jpg',
      description: 'Visionary leader with 10+ years in EdTech'
    },
    // Add more team members as needed
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
            About Us
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto mb-12">
            We are dedicated to revolutionizing the way mentoring relationships are managed and maintained through innovative technology solutions.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-white/80">
            To empower mentors and mentees with tools that enhance their communication, track progress, and create meaningful connections that drive success.
          </p>
        </motion.div>

        {/* Team Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-semibold text-white text-center mb-2">{member.name}</h3>
              <p className="text-white/60 text-center mb-2">{member.role}</p>
              <p className="text-white/80 text-center text-sm">{member.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;