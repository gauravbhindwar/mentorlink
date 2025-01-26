"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiClock, FiMessageCircle } from "react-icons/fi";

const StudentQueryPage = () => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const queries = [
    {
      id: 1,
      student: "John Doe",
      subject: "Mentorship Program Question",
      status: "Open",
      priority: "Medium",
      description: "I have a question about the mentorship program.",
      email: "john.doe@example.com",
      section: "A1",
      mujId: "MUJ12345",
      department: "CSE",
      phoneNumber: "1234567890",
    },
    {
      id: 2,
      student: "Jane Smith",
      subject: "Course Enrollment Issue",
      status: "Resolved",
      priority: "High",
      description: "I am facing issues with course enrollment.",
      email: "jane.smith@example.com",
      section: "B2",
      mujId: "MUJ67890",
      department: "ECE",
      phoneNumber: "0987654321",
    },
    {
      id: 3,
      student: "Alice Johnson",
      subject: "Technical Support",
      status: "Pending",
      priority: "Low",
      description: "I need technical support for the portal.",
      email: "alice.johnson@example.com",
      section: "C3",
      mujId: "MUJ11223",
      department: "ME",
      phoneNumber: "1122334455",
    },
    // Add 10 more sample queries
    {
      id: 4,
      student: "Bob Brown",
      subject: "Library Access",
      status: "Open",
      priority: "Low",
      description: "I need access to the library resources.",
      email: "bob.brown@example.com",
      section: "D1",
      mujId: "MUJ33445",
      department: "CE",
      phoneNumber: "2233445566",
    },
    {
      id: 5,
      student: "Charlie Davis",
      subject: "Exam Schedule",
      status: "Resolved",
      priority: "Medium",
      description: "I have a query regarding the exam schedule.",
      email: "charlie.davis@example.com",
      section: "E2",
      mujId: "MUJ55667",
      department: "EE",
      phoneNumber: "3344556677",
    },
    {
      id: 6,
      student: "David Evans",
      subject: "Hostel Accommodation",
      status: "Pending",
      priority: "High",
      description: "I need information about hostel accommodation.",
      email: "david.evans@example.com",
      section: "F3",
      mujId: "MUJ77889",
      department: "ME",
      phoneNumber: "4455667788",
    },
    {
      id: 7,
      student: "Eve Foster",
      subject: "Scholarship Application",
      status: "Open",
      priority: "Medium",
      description: "I need help with my scholarship application.",
      email: "eve.foster@example.com",
      section: "G1",
      mujId: "MUJ99001",
      department: "CSE",
      phoneNumber: "5566778899",
    },
    {
      id: 8,
      student: "Frank Green",
      subject: "Internship Opportunities",
      status: "Resolved",
      priority: "High",
      description: "I am looking for internship opportunities.",
      email: "frank.green@example.com",
      section: "H2",
      mujId: "MUJ11223",
      department: "ECE",
      phoneNumber: "6677889900",
    },
    {
      id: 9,
      student: "Grace Harris",
      subject: "Course Material",
      status: "Pending",
      priority: "Low",
      description: "I need the course material for the current semester.",
      email: "grace.harris@example.com",
      section: "A3",
      mujId: "MUJ22334",
      department: "CE",
      phoneNumber: "7788990011",
    },
    {
      id: 10,
      student: "Hank Irving",
      subject: "Fee Payment",
      status: "Open",
      priority: "High",
      description: "I have a query regarding fee payment.",
      email: "hank.irving@example.com",
      section: "B1",
      mujId: "MUJ33445",
      department: "EE",
      phoneNumber: "8899001122",
    },
    {
      id: 11,
      student: "Ivy Johnson",
      subject: "Lab Access",
      status: "Resolved",
      priority: "Medium",
      description: "I need access to the lab facilities.",
      email: "ivy.johnson@example.com",
      section: "C2",
      mujId: "MUJ44556",
      department: "ME",
      phoneNumber: "9900112233",
    },
    {
      id: 12,
      student: "Jack King",
      subject: "Project Guidance",
      status: "Pending",
      priority: "High",
      description: "I need guidance for my final year project.",
      email: "jack.king@example.com",
      section: "D3",
      mujId: "MUJ55667",
      department: "CSE",
      phoneNumber: "0011223344",
    },
    {
      id: 13,
      student: "Kara Lee",
      subject: "Sports Facilities",
      status: "Open",
      priority: "Low",
      description: "I want to know about the sports facilities available.",
      email: "kara.lee@example.com",
      section: "E1",
      mujId: "MUJ66778",
      department: "ECE",
      phoneNumber: "1122334455",
    },
  ];

  const stats = [
    { icon: <FiMessageCircle />, value: "12", label: "Active Queries" },
    { icon: <FiClock />, value: "2hr", label: "Avg. Response" },
    { icon: <FiActivity />, value: "95%", label: "Resolution Rate" },
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
          <div className='absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-teal-400/20 animate-gradient' />
          <div className='absolute top-0 left-0 w-1/2 h-1/2 bg-blue-500/5 blur-[100px] rounded-full' />
          <div className='absolute bottom-0 right-0 w-1/2 h-1/2 bg-cyan-500/5 blur-[100px] rounded-full' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>

        <div className='relative z-10 container mx-auto px-4 pt-20'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-10'>
            <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500'>
              Student Queries
            </h1>
            <p className='text-gray-300 mt-2'>
              Handle student support requests and inquiries
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
                  <div className='text-cyan-400 text-xl'>{stat.icon}</div>
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
                        {query.student}
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
                  <strong>Student:</strong> {selectedQuery.student}
                </p>
                <p className='text-white'>
                  <strong>Email:</strong> {selectedQuery.email}
                </p>
                <p className='text-white'>
                  <strong>Section:</strong> {selectedQuery.section}
                </p>
                <p className='text-white'>
                  <strong>MUJ ID:</strong> {selectedQuery.mujId}
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

export default StudentQueryPage;
