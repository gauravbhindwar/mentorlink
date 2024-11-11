"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';
import Navbar from '@/components/subComponents/Navbar';

const ScheduleMeeting = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('CSE CORE');
  const [mentorId, setMentorId] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  // Calculate current semester based on date
  useEffect(() => {
    const calculateSemester = () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
      
      // Determine if it's odd term (July-Nov) or even term (Dec-June)
      const isOddTerm = currentMonth >= 7 && currentMonth <= 11;
      
      // Calculate year of study (1 to 4)
      const batchStartYear = 2021; // Example: for batch 2021-2025
      const yearOfStudy = currentYear - batchStartYear;
      if (yearOfStudy < 0 || yearOfStudy > 3) return 1; // Default to 1st semester if calculation fails
      
      // Calculate semester (1 to 8)
      const semester = (yearOfStudy * 2) + (isOddTerm ? 1 : 2);
      setCurrentSemester(semester);

      // Set available semesters based on the current term
      const semesters = isOddTerm ? [3, 5, 7] : [2, 4, 6, 8];
      setAvailableSemesters(semesters);
    };

    calculateSemester();
  }, []);

  // Update available sections based on the selected semester
  useEffect(() => {
    const sectionsBySemester = {
      1: ['A1', 'A2', 'A3'],
      2: ['B1', 'B2', 'B3'],
      3: ['C1', 'C2', 'C3'],
      4: ['D1', 'D2', 'D3'],
      5: ['E1', 'E2', 'E3'],
      6: ['F1', 'F2', 'F3'],
      7: ['G1', 'G2', 'G3'],
      8: ['H1', 'H2', 'H3'],
    };
    setAvailableSections(sectionsBySemester[currentSemester] || []);
  }, [currentSemester]);

  // Available branches
  const branches = [
    'CSE CORE',
    'CSE (AI & ML)',
    'CSE (DevOps)',
    'CSE (Full Stack)',
    'CSE (Cloud Computing)',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  // Add form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/mentor/scheduleMeeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId,
          branch: selectedBranch,
          semester: currentSemester,
          section: selectedSection,
          // Add other form fields
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule meeting');
      }

      // Handle success (e.g., show notification, redirect)
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., show error notification)
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="min-h-screen h-screen bg-[#0a0a0a] overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <Navbar />

        <div className="relative z-10 container mx-auto px-4 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-6">
              Schedule Meetings
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  {/* Add Mentor MUJID field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mentor MUJID</label>
                    <input
                      type="text"
                      placeholder="Enter mentor MUJID"
                      value={mentorId}
                      onChange={(e) => setMentorId(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div>

                  {/* Existing academic fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      {branches.map(branch => (
                        <option key={branch} value={branch} className="bg-black text-white">{branch}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    >
                      {availableSemesters.map(sem => (
                        <option key={sem} value={sem} className="bg-black text-white">Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Section</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <option value="" className="bg-black text-white">Select Section</option>
                      {availableSections.map(section => (
                        <option key={section} value={section} className="bg-black text-white">{section}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column - reordered and added fields */}
                <div className="space-y-3">
                  {/* Meeting Title moved to top */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Title</label>
                    <input
                      type="text"
                      placeholder="Enter meeting title"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div>

                  {/* Added Date & Time field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div>

                  {/* Meeting Agenda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Agenda</label>
                    <textarea
                      placeholder="Describe the meeting agenda..."
                      rows="5" // Reduced from 7 to accommodate new fields
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div>

                  {/* File upload section */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Attachments</label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className="w-full flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm cursor-pointer hover:bg-black/30 transition-all"
                    >
                      <FiUpload className="text-purple-400" />
                      <span>{selectedFile ? selectedFile.name : "Upload attachments"}</span>
                    </label>
                  </div>

                  <button type="submit" className="w-full btn-orange">
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleMeeting;