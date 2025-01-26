"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiClock, FiMessageCircle } from "react-icons/fi";

const MentorQueryPage = () => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const queries = [
    {
      id: 1,
      mentor: "Dr. Smith",
      subject: "Schedule Conflict",
      status: "Pending",
      priority: "High",
      description: "I have a schedule conflict with my classes.",
      email: "dr.smith@example.com",
      department: "CSE",
      phoneNumber: "1234567890",
    },
    {
      id: 2,
      mentor: "Prof. Johnson",
      subject: "Resource Request",
      status: "Resolved",
      priority: "Medium",
      description: "I need additional resources for my course.",
      email: "prof.johnson@example.com",
      department: "ECE",
      phoneNumber: "0987654321",
    },
    {
      id: 3,
      mentor: "Dr. Brown",
      subject: "Technical Issue",
      status: "Open",
      priority: "Low",
      description: "I am facing technical issues with the portal.",
      email: "dr.brown@example.com",
      department: "ME",
      phoneNumber: "1122334455",
    },
    // Add more sample queries as needed
  ];

  const stats = [
    { icon: <FiMessageCircle />, value: "3", label: "Active Queries" },
    { icon: <FiClock />, value: "1hr", label: "Avg. Response" },
    { icon: <FiActivity />, value: "90%", label: "Resolution Rate" },
  ];

  const handleCardClick = (status) => {
    setSelectedStatus(status);
  };

  const handleQueryClick = (query) => {
    setSelectedQuery(query);
  };

  const closePopup = () => {
    setSelectedStatus(null);
    setSelectedQuery(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='min-h-screen bg-[#0a0a0a] overflow-hidden relative'>
        {/* Enhanced background with multiple gradients */}
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-pink-600/20 via-red-500/10 to-purple-400/20 animate-gradient' />
          <div className='absolute top-0 left-0 w-1/2 h-1/2 bg-pink-500/5 blur-[100px] rounded-full' />
          <div className='absolute bottom-0 right-0 w-1/2 h-1/2 bg-red-500/5 blur-[100px] rounded-full' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>

        <div className='relative z-10 container mx-auto px-4 pt-20'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-10'>
            <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500'>
              Mentor Queries
            </h1>
            <p className='text-gray-300 mt-2'>
              Manage and respond to mentor inquiries
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className='grid grid-cols-3 gap-4 mb-8'>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className='bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10'>
                <div className='flex items-center gap-3'>
                  <div className='text-pink-400 text-xl'>{stat.icon}</div>
                  <div>
                    <div className='text-2xl font-bold text-white'>
                      {stat.value}
                    </div>
                    <div className='text-sm text-gray-400'>{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Query Status Cards */}
            {["Pending", "Resolved", "Open"].map((status, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                className='bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 cursor-pointer'
                onClick={() => handleCardClick(status)}>
                <h3 className='text-xl font-semibold text-white'>
                  {status} Queries
                </h3>
                <p className='text-gray-400 mt-2'>
                  View all {status.toLowerCase()} queries
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Popup for Query List */}
        {selectedStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-[#1a1a1a] p-6 rounded-lg max-w-3xl w-full'>
              <h2 className='text-2xl font-bold text-white mb-4'>
                {selectedStatus} Queries
              </h2>
              <div className='space-y-4'>
                {queries
                  .filter((query) => query.status === selectedStatus)
                  .map((query) => (
                    <div
                      key={query.id}
                      className='bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer'
                      onClick={() => handleQueryClick(query)}>
                      <h3 className='text-xl font-semibold text-white'>
                        {query.mentor}
                      </h3>
                      <p className='text-gray-400'>{query.subject}</p>
                    </div>
                  ))}
              </div>
              <button className='mt-4 btn-orange' onClick={closePopup}>
                Close
              </button>
            </div>
          </motion.div>
        )}

        {/* Popup for Query Details */}
        {selectedQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-[#1a1a1a] p-6 rounded-lg max-w-3xl w-full'>
              <h2 className='text-2xl font-bold text-white mb-4'>
                Query Details
              </h2>
              <div className='space-y-2'>
                <p className='text-white'>
                  <strong>Mentor:</strong> {selectedQuery.mentor}
                </p>
                <p className='text-white'>
                  <strong>Email:</strong> {selectedQuery.email}
                </p>
                <p className='text-white'>
                  <strong>Department:</strong> {selectedQuery.department}
                </p>
                <p className='text-white'>
                  <strong>Phone Number:</strong> {selectedQuery.phoneNumber}
                </p>
                <p className='text-white'>
                  <strong>Description:</strong> {selectedQuery.description}
                </p>
              </div>
              <div className='mt-4'>
                <textarea
                  placeholder='Type your response...'
                  rows='4'
                  className='w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white'
                />
                <button className='w-full btn-orange mt-2'>
                  Send Response
                </button>
              </div>
              <button className='mt-4 btn-orange' onClick={closePopup}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MentorQueryPage;
