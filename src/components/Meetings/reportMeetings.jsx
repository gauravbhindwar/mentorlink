'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Dynamically import MUI components
// const Dialog = dynamic(() => import('@mui/material/Dialog'), { ssr: false });
// const DialogTitle = dynamic(() => import('@mui/material/DialogTitle'), { ssr: false });
// const DialogContent = dynamic(() => import('@mui/material/DialogContent'), { ssr: false });
// const DialogActions = dynamic(() => import('@mui/material/DialogActions'), { ssr: false });
// const TextField = dynamic(() => import('@mui/material/TextField'), { ssr: false });
// const Button = dynamic(() => import('@mui/material/Button'), { ssr: false });
// const IconButton = dynamic(() => import('@mui/material/IconButton'), { ssr: false });
// const CloseIcon = dynamic(() => import('@mui/icons-material/Close'), { ssr: false });

const ReportMeetings = () => {
  const [mentorId, setMentorId] = useState('');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [selectedSection, setSelectedSection] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);
  const [reportDialog, setReportDialog] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [reportData, setReportData] = useState({
    TopicOfDiscussion: '',
    TypeOfInformation: '',
    NotesToStudent: '',
    feedbackFromMentee: '',
    outcome: '',
    closureRemarks: ''
  });
  const [reportedMeetings, setReportedMeetings] = useState({});

  const fixedBranch = 'CSE CORE';

  const handleMentorIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(value)) return;
    setMentorId(value);
  };

  const handleSectionChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (value.length > 2) return;
    if (value.length === 1 && !/^[A-Z]$/.test(value)) return;
    if (value.length === 2 && !/^[A-Z][1-9]$/.test(value)) return;
    setSelectedSection(value);
  };

  const generateAcademicSessions = (year) => {
    if (!year) return [];
    const [startYear] = year.split('-');
    return [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${parseInt(startYear) + 1}`
    ];
  };

  const validateAcademicYear = (value) => {
    if (!value) return false;
    const regex = /^(\d{4})-(\d{4})$/;
    if (!regex.test(value)) return false;
    const [startYear, endYear] = value.split('-').map(Number);
    return endYear === startYear + 1;
  };

  const generateYearSuggestions = (input) => {
    if (!input) return [];
    const currentYear = new Date().getFullYear();
    const suggestions = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const academicYear = `${year}-${year + 1}`;
      if (academicYear.startsWith(input)) {
        suggestions.push(academicYear);
      }
    }
    return suggestions;
  };

  const handleAcademicYearInput = (e) => {
    let value = e.target.value.toUpperCase();
    if (value.length === 4 && !value.includes('-')) {
      value = `${value}-${parseInt(value) + 1}`;
    }
    if (value.length > 0) {
      setYearSuggestions(generateYearSuggestions(value));
      setShowYearOptions(true);
    } else {
      setYearSuggestions([]);
      setShowYearOptions(false);
    }
    setAcademicYear(value);
    if (validateAcademicYear(value)) {
      const sessions = generateAcademicSessions(value);
      if (sessions.length > 0) {
        setAcademicSession(sessions[0]);
      }
    }
  };

  const handleAcademicSessionInput = (e) => {
    let value = e.target.value.toUpperCase();
    if (value.startsWith('JUL')) {
      value = `JULY-DECEMBER ${academicYear?.split('-')[0]}`;
    } else if (value.startsWith('JAN')) {
      value = `JANUARY-JUNE ${academicYear?.split('-')[1]}`;
    }
    if (value.length > 0) {
      setShowSessionOptions(true);
    } else {
      setShowSessionOptions(false);
    }
    setAcademicSession(value);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearOptions(false);
      }
      if (sessionRef.current && !sessionRef.current.contains(event.target)) {
        setShowSessionOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReportedMeetings = async () => {
    try {
      const response = await axios.get('/api/meeting/mentors/reportmeeting', {
        params: {
          mentor_id: mentorId,
          semester: currentSemester,
          section: selectedSection,
          session: academicSession,
          year: academicYear
        }
      });
      if (response.data) {
        setReportedMeetings(response.data.meetings);
      }
    } catch (error) {
      console.error('Error fetching reported meetings:', error);
    }
  };

  useEffect(() => {
    if (mentorId && currentSemester && selectedSection && academicSession && academicYear) {
      fetchReportedMeetings();
    }
  }, [mentorId, currentSemester, selectedSection, academicSession, academicYear]);

  const handleReportClick = (meeting) => {
    setSelectedMeeting(meeting);
    setReportDialog(true);
  };

  const handleReportClose = () => {
    setReportDialog(false);
    setSelectedMeeting(null);
    setReportData({
      TopicOfDiscussion: '',
      TypeOfInformation: '',
      NotesToStudent: '',
      feedbackFromMentee: '',
      outcome: '',
      closureRemarks: ''
    });
  };

  const handleReportSubmit = async () => {
    try {
      const response = await axios.patch('/api/meeting/mentors/reportmeeting', {
        meetingId: selectedMeeting.meeting_id,
        mentorId: mentorId,
        academicYear,
        academicSession,
        semester: currentSemester,
        section: selectedSection,
        reportData
      });

      if (response.status === 200) {
        toast.success('Meeting report submitted successfully');
        handleReportClose();
        fetchReportedMeetings(); // Refresh the meetings list
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Wrap date formatting in useEffect
  const [formattedDates, setFormattedDates] = useState({});

  useEffect(() => {
    if (reportedMeetings.length > 0) {
      const dates = {};
      reportedMeetings.forEach(meeting => {
        dates[meeting.meeting_id] = {
          date: new Date(meeting.meeting_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          time: meeting.meeting_time
        };
      });
      setFormattedDates(dates);
    }
  }, [reportedMeetings]);

  // Add this helper function before the return statement
  const isFormValid = () => {
    return reportData.TopicOfDiscussion.trim() !== '' &&
      reportData.TypeOfInformation.trim() !== '' &&
      reportData.outcome.trim() !== '' &&
      reportData.closureRemarks.trim() !== '';
  };

  // Add this helper function
  const getRequiredFields = () => {
    const missing = [];
    if (!reportData.TopicOfDiscussion.trim()) missing.push('Topic of Discussion');
    if (!reportData.TypeOfInformation.trim()) missing.push('Type of Information');
    if (!reportData.outcome.trim()) missing.push('Outcome');
    if (!reportData.closureRemarks.trim()) missing.push('Closure Remarks');
    return missing;
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
              Report Meetings
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mentor MUJID</label>
                    <input
                      type="text"
                      placeholder="Enter mentor MUJID"
                      value={mentorId}
                      onChange={handleMentorIdChange}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
                    <input
                      type="text"
                      value={fixedBranch}
                      disabled
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm opacity-60"
                    />
                  </div>

                  <div ref={yearRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Academic Year</label>
                    <input
                      type="text"
                      placeholder="YYYY-YYYY"
                      value={academicYear}
                      onChange={handleAcademicYearInput}
                      onClick={() => setShowYearOptions(true)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                    {showYearOptions && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {yearSuggestions.map((year, index) => (
                          <div
                            key={`${year}-${index}1`}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                            onClick={() => {
                              setAcademicYear(year);
                              setShowYearOptions(false);
                              const sessions = generateAcademicSessions(year);
                              if (sessions.length > 0) {
                                setAcademicSession(sessions[0]);
                              }
                            }}
                          >
                            {year}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={sessionRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Academic Session</label>
                    <input
                      type="text"
                      placeholder="MONTH-MONTH YYYY"
                      value={academicSession}
                      onChange={handleAcademicSessionInput}
                      onClick={() => setShowSessionOptions(true)}
                      disabled={!academicYear}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm disabled:opacity-50"
                    />
                    {showSessionOptions && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {generateAcademicSessions(academicYear).map((session, index) => {
                          try {
                            return (
                              <div
                                key={`session-${session}-${index}`}
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                                onClick={() => {
                                  setAcademicSession(session);
                                  setShowSessionOptions(false);
                                }}
                              >
                                {session}
                              </div>
                            );
                          } catch (error) {
                            console.error('Error rendering session:', error);
                            return null;
                          }
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem, index) => (
                        <option key={`sem-${sem}-${index}`} value={sem} className="bg-black text-white">Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Section</label>
                    <input 
                      type="text"
                      value={selectedSection}
                      onChange={handleSectionChange}
                      placeholder="Enter section (e.g., A1)"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {reportedMeetings.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Meetings:</h3>
                      <ul className="list-disc list-inside text-white space-y-2">
                        {reportedMeetings.map((meeting, index) => {
                          try {
                            return (
                              <li 
                                key={`meeting-${meeting.meeting_id || index}-${Date.now()}`} 
                                className="bg-black/20 flex border border-white/10 rounded-lg p-2"
                              >
                                <div className="flex items-center justify-between space-x-2 w-[100%]">
                                  <div>
                                    <p className="text-sm font-medium">{meeting.meeting_id}</p>
                                    <p className="text-xs text-gray-400">
                                      {formattedDates[meeting.meeting_id]?.date} at {formattedDates[meeting.meeting_id]?.time}
                                    </p>
                                    
                                  </div>
                                    <div 
                                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-1 px-2 rounded cursor-pointer"
                                      onClick={() => handleReportClick(meeting)}
                                    >
                                      Submit Report
                                    </div>
                                </div>
                              </li>
                            );
                          } catch (error) {
                            console.log('Error rendering meeting:', error);
                            return null;
                          }
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-md text-red-600 font-semibold w-[100%] flex justify-center mt-4">No meetings found</p>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
      {!reportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]"> {/* Added flex and max-h-[90vh] */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Submit Meeting Report</h2>
              <button 
                onClick={handleReportClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1"> {/* Added overflow-y-auto and flex-1 */}
              {[
                { label: "Topic of Discussion", name: "TopicOfDiscussion" },
                { label: "Type of Information", name: "TypeOfInformation" },
                { label: "Notes to Student", name: "NotesToStudent" },
                { label: "Feedback from Mentee", name: "feedbackFromMentee" },
                { label: "Outcome", name: "outcome" },
                { label: "Closure Remarks", name: "closureRemarks" }
              ].map((field, index) => (
                <div key={`field-${field.name}-${index}`} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <textarea
                    name={field.name}
                    value={reportData[field.name]}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={handleReportClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!isFormValid()}
                title={!isFormValid() ? `Required fields: ${getRequiredFields().join(', ')}` : ''}
                className={`px-4 py-2 text-white rounded-md group relative ${
                  isFormValid() 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Submit Report
                {!isFormValid() && (
                  <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm bg-gray-900 text-white rounded whitespace-nowrap">
                    Required fields: {getRequiredFields().join(', ')}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Export with no SSR
export default dynamic(() => Promise.resolve(ReportMeetings), { ssr: false });
