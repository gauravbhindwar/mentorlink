'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';

const ScheduleMeetingComponent = () => {
  const router = useRouter();
  const [mentorData, setMentorData] = useState(null);
  const [isDisabled, setDisabled] = useState(true);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [selectedSection, setSelectedSection] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [mentees, setMentees] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [showSemesterOptions, setShowSemesterOptions] = useState(false);
  const [ setSessionSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const [customAlert, setCustomAlert] = useState('')
  const [formattedDate, setFormattedDate] = useState();
  const [formattedTime, setFormattedTime] = useState('');
  const yearRef = useRef(null);
  const sessionRef = useRef(null);

  const [semesterSuggestions, setSemesterSuggestions] = useState([]);
  console.log(semesterSuggestions);
  const semesterRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false); // Add this new state

  const fixedBranch = 'CSE CORE';

  const [preventReload, setPreventReload] = useState(false);
  const [isMeetingOnline, setIsMeetingOnline] = useState(false);
  const [venue, setVenue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = window.sessionStorage.getItem('mentorData');
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          setMentorData(parsedData);
          setMentorId(parsedData?.MUJid || '');
          setAcademicYear(parsedData?.academicYear || '');
          setAcademicSession(parsedData?.academicSession || '');
        }
      } catch (error) {
        console.error('Error accessing sessionStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (preventReload) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preventReload]);

  const handleSectionChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Allow only format like A1, B2, etc.
    if (value.length > 2) return;
    
    // First character must be a letter
    if (value.length === 1 && !/^[A-Z]$/.test(value)) return;
    
    // Second character must be a number 1-9
    if (value.length === 2 && !/^[A-Z][1-9]$/.test(value)) return;
    
    setSelectedSection(value);
  };

  const handleMeetingTopicChange = (e) => {
    let value = e.target.value;
    // Only allow uppercase letters and numbers
    // if (!/^[A-Z0-9]*$/.test(value)) return;
    setMeetingTopic(value);
  };

  const handleMentorIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    // Only allow uppercase letters and numbers
    if (!/^[A-Z0-9]*$/.test(value)) return;
    setMentorId(value);
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    
    // Format date and time with explicit AM/PM
    const formattedDate = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase(); // Makes AM/PM uppercase
    setFormattedDate(formattedDate);
    setFormattedTime(formattedTime);
  };

  useEffect(() => {
    const generateMeetingId = async () => {
      try {
        const response = await axios.get('/api/meeting/mentors/schmeeting', {
          params: {
            mentor_id: mentorId,
            semester: currentSemester,
            section: selectedSection,
            session: academicSession,
            year: academicYear
          }
        });

        if (response.data) {
          
          const meetingsHeld = response.data?.meetings;
          
          
          console.log('Mentor meetings:', meetingsHeld);
          // console.log('Meeting count:', meetingCount);
          //MEETING LIMIT CURRENTLY DISABLED
          // if(meetingsHeld.length >= 4){
          //   setMeetingId('You have already scheduled 4 meetings for this section')
          //   setCustomAlert('You have already scheduled 4 meetings for this section')
          //   setDisabled(true);
          // }else{
          setMeetingId(`${mentorId}${currentSemester}-M${selectedSection}${meetingsHeld.length + 1}`);
          setCustomAlert('')
          setDisabled(false);
          // }
        }
      } catch (error) {
        // console.log('Error fetching meetings:', error.response?.data || error.message);
        setMeetingId(error.response?.data.error);
        setCustomAlert(error.response?.data.error)
        setDisabled(true);
      }
    };

    try {
      if (mentorId && currentSemester && academicSession && academicYear) {
        generateMeetingId();
        getMentees(mentorId, currentSemester, selectedSection);
      }
    } catch (error) {
      console.log('Error in useEffect:', error);
    }
  }, [currentSemester, selectedSection]); // Add proper dependencies

  // useEffect(() => {
  //   if (customAlert) {
  //     const timer = setTimeout(() => {
  //       setCustomAlert('');
  //     }, 5000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [customAlert]);

  // Calculate current semester based on date
  useEffect(() => {
    const calculateSemester = () => {          
      // Set available semesters based on the current term
      if (!academicYear) return [];
      const [startYear] = academicYear.split('-');
        
      const semesters = academicSession === `JULY-DECEMBER ${startYear}` ? [1, 3, 5, 7] : [2, 4, 6, 8];
      // console.log('Current semesters:', semesters);
      setAvailableSemesters(semesters);
      const semester = '';
      setCurrentSemester(semester);
    };

    calculateSemester();
    // console.log('Current semester:', currentSemester);
  }, [academicSession]);

 
  const handleMeetingScheduled = async () => {
    if (!mentorId || !currentSemester || !dateTime || !venue || !meetingTopic) {
      setCustomAlert('Please fill all required fields');
      return;
    }

    setLoading(true);
    setPreventReload(true);
    try {
      // First schedule the meeting
      const response = await axios.post('/api/meeting/mentors/schmeeting', {
        mentor_id: mentorId,
        meeting_id: meetingId,
        TopicOfDiscussion: meetingTopic,
        meeting_date: formattedDate,
        meeting_time: formattedTime,
        semester: currentSemester,
        section: selectedSection,
        session: academicSession,
        year: academicYear,
        isMeetingOnline: isMeetingOnline,
        venue: venue
      });

      if (response.status === 200) {
        // Then send emails to all mentees
        const menteeEmails = mentees.map(mentee => mentee.email);
        console.log('Mentee emails:', menteeEmails);
        try {
          await sendEmailToMentees(menteeEmails);
        } catch (error) {
          console.log('Error sending emails to mentees:', error);
        }
      }
    } catch (error) {
      console.log('Error scheduling meeting:', error);
      setCustomAlert('Failed to schedule meeting or send emails');
    } finally {
      setLoading(false);
      setPreventReload(false);
    }
  };

  // Add new function to get mentees
  const getMentees = async (mentorId, semester, section) => {
    setIsLoading(true); // Start loading
    try {
      const response = await fetch(`/api/meeting/mentees?mentorId=${mentorId}&semester=${semester}&section=${section}&year=${academicYear}&session=${academicSession}`);
      if (!response.ok){
        console.log('Failed to fetch mentees');
        setDisabled(true);
      }
      else{
        const menteesData = await response.json();
        setMentees(menteesData);
        setDisabled(menteesData.length === 0);
      }
      console.log(mentees, 'mentees');

    } catch (error) {
      console.log('Error fetching mentees:', error);
      setDisabled(true);
      throw error;
    } finally {
      setIsLoading(false); // End loading
    }
  };

  // Add helper functions
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

  const generateSessionSuggestions = (input) => {
    if (!academicYear || !input) return [];
    const [startYear, endYear] = academicYear.split('-');
    const possibleSessions = [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`
    ];
    
    return possibleSessions.filter(session => 
      session.toLowerCase().includes(input.toLowerCase())
    );
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
      setSessionSuggestions(generateSessionSuggestions(value));
      setShowSessionOptions(true);
    } else {
      setSessionSuggestions([]);
      setShowSessionOptions(false);
    }
    
    setAcademicSession(value);
  };

  const generateSemesterSuggestions = (input) => {
    if (!input) return [];
    return availableSemesters.filter(sem => 
      `${sem}`.toLowerCase().includes(input.toLowerCase())
    );
  };

  const handleSemesterInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    if (value.length > 0) {
      setSemesterSuggestions(generateSemesterSuggestions(value));
      setShowSemesterOptions(true);
    } else {
      setSemesterSuggestions([]);
      setShowSemesterOptions(false);
    }

    setCurrentSemester(value);
  };

  // Add useEffect for click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      try {
        if (yearRef.current && !yearRef.current.contains(event.target)) {
          setShowYearOptions(false);
        }
        if (sessionRef.current && !sessionRef.current.contains(event.target)) {
          setShowSessionOptions(false);
        }
        if (semesterRef.current && !semesterRef.current.contains(event.target)) {
          setShowSemesterOptions(false);
        }
      } catch (error) {
        console.log('Error in handleClickOutside:', error);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      setIsMounted(true);
    } catch (error) {
      console.log('Error during hydration:', error);
    }
  }, []);

  if (!isMounted) {
    return null;
  }

  // In ScheduleMeetingComponent.jsx, update the getEmailBody function
const getEmailBody = () => `
Dear Mentees,

A mentor meeting has been scheduled with the following details:

Meeting ID: ${meetingId}
Date: ${formattedDate}
Time: ${formattedTime}
Topic: ${meetingTopic || 'N/A'}
Meeting Type: ${isMeetingOnline ? 'Online' : 'Offline'}
${isMeetingOnline ? 'Meeting Link' : 'Venue'}: ${venue}
Branch: ${fixedBranch}
Semester: ${currentSemester}
${selectedSection && `Section: ${selectedSection}`}

Please ensure your attendance for this mentor meeting. If you have any conflicts or concerns, kindly inform me in advance.

Best regards,
${mentorData?.name || 'Your Mentor'}
${mentorData?.designation || 'Faculty Mentor'}
Department of Computer Science and Engineering
Manipal University Jaipur
Contact: ${mentorData?.email || ''}`;

const sendEmailToMentees = async (menteeEmails) => {
  try {
    const emailPromises = menteeEmails.map(async (email) => {
      const response = await axios.post('/api/meeting/send-email', {
        email,
        subject: `Meeting Scheduled - ${meetingId}`,
        body: getEmailBody()
      });
      return response;
    });
    router.push('/pages/mentordashboard');

    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
};

  return (
    <AnimatePresence>
      <motion.div className="min-h-screen h-screen bg-[#0a0a0a] overflow-hidden relative">
        {/* Add loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              <p className="text-white text-lg">Loading data...</p>
            </div>
          </div>
        )}
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
            className="max-w-6xl mx-auto" // Changed from max-w-4xl to max-w-6xl
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <form onSubmit={(e)=>{
                e.preventDefault();
              }} className="grid grid-cols-3 gap-4"> {/* Changed from grid-cols-2 to grid-cols-3 */}
                {/* Left Column */}
                <div className="space-y-3">
                  {/* Add Mentor MUJID field */}
                  {/* Disabled for now */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mentor MUJID</label>
                    <input
                      type="text"
                      placeholder="Enter mentor MUJID"
                      value={mentorId}
                      onChange={handleMentorIdChange}
                      disabled={mentorData.MUJid ? true : false}
                      className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm uppercase ${mentorData.MUJid ? 'opacity-60' : ''}`}
                    />
                  </div> */}

                  {/* Existing academic fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
                    <input
                      type="text"
                      value={fixedBranch}
                      disabled
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm opacity-60"
                    />
                  </div>

                  {/* Academic Year Field */}
                  <div ref={yearRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Academic Year</label>
                    <input
                      type="text"
                      placeholder="YYYY-YYYY"
                      value={academicYear}
                      onChange={handleAcademicYearInput}
                      disabled={mentorData.academicYear ? true : false}
                      onClick={() => setShowYearOptions(true)}
                      className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm ${mentorData.academicYear ? 'opacity-60' : ''}`}
                    />
                    {showYearOptions && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {yearSuggestions.map(year => (
                          <div
                            key={year}
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

                  {/* Academic Session Field */}
                  <div ref={sessionRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Academic Session</label>
                    <input
                      type="text"
                      placeholder={!academicYear ? 'Add academic year first' : 'MONTH-MONTH YYYY'}
                      value={academicSession}
                      onChange={handleAcademicSessionInput}
                      onClick={() => setShowSessionOptions(true)}
                      disabled={(mentorData.academicSession ? true : false) || !academicYear}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm disabled:opacity-50"
                    />
                    {showSessionOptions && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {generateAcademicSessions(academicYear).map(session => (
                          <div
                            key={session}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                            onClick={() => {
                              setAcademicSession(session);
                              setShowSessionOptions(false);
                            }}
                          >
                            {session}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={semesterRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Semester (Required)</label>
                    <input
                      type="text"
                      placeholder={!academicYear ? 'Add academic year first' : availableSemesters[0] == 2 ? 'Select even semester' : 'Select odd semester'}
                      value={academicYear && currentSemester}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (availableSemesters.includes(parseInt(value))) {
                          handleSemesterInput(e);
                        }
                      }}
                      onClick={() => setShowSemesterOptions(true)}
                      disabled={!academicYear}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm disabled:opacity-50"
                    />
                    {showSemesterOptions && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {availableSemesters.map(sem => (
                          <div
                            key={sem}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                            onClick={() => {
                              setCurrentSemester(sem);
                              setShowSemesterOptions(false);
                            }}
                          >
                            {sem}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Section (Optional)</label>
                    <input 
                      type="text"
                      value={selectedSection}
                      onChange={handleSectionChange}
                      placeholder="Enter section (e.g., A, B, C)"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                      maxLength={2}
                    />
                  </div>
                  
                </div>

                {/* Middle Column */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Meeting ID</label>
                    <input
                      type="text"
                      placeholder="Meeting ID"
                      disabled={true}
                      value={meetingId}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pointer-events-none p-2 text-white text-sm disabled:opacity-50"
                    />
                  </div>
                  
                  {/* Meeting Title moved to top */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Topic</label>
                    <textarea 
                      value={meetingTopic}
                      onChange={handleMeetingTopicChange}
                      placeholder="Enter meeting topic"
                      rows='3'
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div>

                  {/* Added Date & Time field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date & Time</label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => {
                          setDateTime(e.target.value)
                          formatDateTime(e.target.value)
                        }}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm [&::-webkit-calendar-picker-indicator]:invert"
                        step="1800"
                      />
                    </div>
                  </div>

                  {/* Meeting Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Type</label>
                    <select
                      value={isMeetingOnline ? 'online' : 'offline'}
                      onChange={(e) => {
                        setIsMeetingOnline(e.target.value === 'online');
                        setVenue(''); // Reset venue when changing meeting type
                      }}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                    </select>
                  </div>

                  {/* Conditional Venue/Link Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {isMeetingOnline ? 'Meeting Link' : 'Venue'}
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder={isMeetingOnline ? 'Enter meeting link' : 'Enter venue location'}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full btn-orange disabled:opacity-50"
                    disabled={loading || isDisabled}
                    onClick={handleMeetingScheduled}
                  >
                    {loading ? 
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500">
                      </div>                    
                      : 'Schedule Meeting'
                    }
                  </button>
                  {customAlert && (
                    <p className='text-md text-red-600 font-semibold w-[100%] flex justify-center'>
                      <span>{customAlert}</span>
                    </p>
                  )}  
                </div>

                {/* Right Column - Mentees List */}
                <div className="space-y-3">
                  {mentees.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Mentees:</h3>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <ul className="list-disc list-inside text-white space-y-2">
                          {mentees.map((mentee, index) => (
                            <li 
                              key={mentee.MUJid || mentee.email || `mentee-${index}`} 
                              className="bg-black/20 flex border border-white/10 rounded-lg p-2"
                            >
                              <div className="flex items-center space-x-2">
                                <div>
                                  <p className="text-sm font-medium">{mentee.name}</p>
                                  <p className="text-xs text-gray-400">{mentee.email}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ):(
                    <div>
                      <h3 className="text-md font-semibold text-rose-800 mb-2 text-center">No mentees found</h3>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleMeetingComponent;