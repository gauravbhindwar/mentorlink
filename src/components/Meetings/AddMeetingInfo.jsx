'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AddMeetingInfo = () => {
  const [meetingData, setMeetingData] = useState({
    date: '',
    semester: '',
    agenda: '',
    discussion: '',
    actionItems: '',
    nextMeetingDate: '',
    attendees: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeetingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meetingData.date || !meetingData.semester || !meetingData.agenda) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      // Add your API call here to save meeting data
      console.log('Submitting meeting data:', meetingData);
      // Reset form after successful submission
      setMeetingData({
        date: '',
        semester: '',
        agenda: '',
        discussion: '',
        actionItems: '',
        nextMeetingDate: '',
        attendees: []
      });
    } catch (error) {
      console.error('Error submitting meeting data:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative pt-20"> {/* Adjusted pt-20 to avoid hiding under navbar */}
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 p-4 max-w-4xl mx-auto"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
        >
          Add Meeting Information
        </motion.h1>
        
        <motion.form 
          variants={containerVariants}
          className="space-y-6 bg-white p-6 rounded-lg shadow-lg"
          onSubmit={handleSubmit}
        >
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={meetingData.date}
                onChange={handleInputChange}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Semester</label>
              <select
                name="semester"
                value={meetingData.semester}
                onChange={handleInputChange}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                required
              >
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {['agenda', 'discussion', 'actionItems'].map((field) => (
            <motion.div key={field} variants={itemVariants} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {field.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <textarea
                name={field}
                placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                value={meetingData[field]}
                onChange={handleInputChange}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                rows="3"
                required={field === 'agenda'}
              />
            </motion.div>
          ))}

          <motion.div 
            variants={itemVariants}
            className="flex justify-center pt-4"
          >
            <motion.button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-8 py-3 rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Submit Meeting Information
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default AddMeetingInfo;
