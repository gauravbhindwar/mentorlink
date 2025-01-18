"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';

const ScheduleMeeting = () => {
  const router = useRouter();
  const sessionData = sessionStorage.getItem('mentorData');
  const mentorData = JSON.parse(sessionData);
  console.log('Mentor data:', mentorData.MUJid);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDisabled, setDisabled] = useState(true);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [selectedSection, setSelectedSection] = useState('');
  const [mentorId, setMentorId] = useState(mentorData?.MUJid || '');
  const [mentees, setMentees] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  // const [meetingNumber, setMeetingNumber] = useState('1');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [successPop, setSuccessPop] = useState(false);
  // Add new state variables
  const [academicYear, setAcademicYear] = useState(mentorData?.academicYear || '');
  const [academicSession, setAcademicSession] = useState(mentorData?.academicSession || '');
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
          if(meetingsHeld.length >= 4){
            setMeetingId('You have already scheduled 4 meetings for this section')
            setCustomAlert('You have already scheduled 4 meetings for this section')
            setDisabled(true);
          }else{
          setMeetingId(`${mentorId}-M${selectedSection}${meetingsHeld.length + 1}`);
          setCustomAlert('')
          setDisabled(false);
          }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };
  const handleMeetingScheduled = () => {
    const scheduleMeeting = async () => {
      setLoading(true);
      try {
        // Validate required fields
        if (!mentorId || !currentSemester || !dateTime) {
          throw new Error('Please fill all required fields');
        }

        const response = await axios.post('/api/meeting/mentors/schmeeting', {
          mentor_id: mentorId,
          meeting_id: meetingId,
          TopicOfDiscussion: meetingTopic,
          meeting_date: formattedDate,
          meeting_time: formattedTime,
          // file: selectedFile,
          semester: currentSemester,
          section: selectedSection,
          session: academicSession,
          year: academicYear
        });

        if (response.data) {
          if (response.status == 200) {
            // Meeting scheduled successfully
            setSuccessPop(true);
            // setTimeout(() => {
            //   router.push('/pages/mentordashboard');
            // }, 2000);
          } else {
            // Meeting scheduling failed
            // console.log(response.data)
            console.log('Meeting scheduling failed:', response.data.error);
          }
        } else {
          // Meeting scheduling failed
          console.log('Meeting scheduling failed:', response.data.error);
        }
      } catch (error) {
        console.error('Error scheduling meeting:', error);
        setCustomAlert('Failed to schedule meeting')
      }
    }

    try {
      scheduleMeeting();
    } catch (error) {
      console.log('Error in handleMeetingScheduled:', error);
    }
    setLoading(false);
  }

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
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <form onSubmit={(e)=>{
                e.preventDefault();
              }} className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  {/* Add Mentor MUJID field */}
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
                      onClick={() => setShowYearOptions(true)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
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
                      disabled={!academicYear}
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
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
                  
                </div>

                {/* Right Column - reordered and added fields */}
                <div className="space-y-3">
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

                  {/* Meeting Agenda */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Agenda</label>
                    <textarea
                      placeholder="Describe the meeting agenda..."
                      rows="5" // Reduced from 7 to accommodate new fields
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                    />
                  </div> */}

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

                  <button 
                    type="submit" 
                    className="w-full btn-orange disabled:opacity-50"
                    disabled={loading || isDisabled}
                    onClick={
                      handleMeetingScheduled
                    }
                  >
                    {loading ? 
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500">
                    </div>                    
                    : 'Schedule Meeting'}
                  </button>
                  {
                    customAlert && (
                      <p className='text-md text-red-600 font-semibold w-[100%] flex justify-center'><span>{customAlert}</span></p>
                    )
                  }  
                  {
                    successPop && (
                      <>
                        <div
                        className={`fixed inset-0 bg-black/40 z-110 transition-opacity`}
                          ></div>
                        <div className={`fixed inset-0 z-120 flex justify-center items-center`}>
                          <div className="bg-white p-10 pb-2 sm:p-16 w-[100vw] sm:w-[fit-content] sm:max-w-[600px] rounded-t-lg sm:rounded-lg">
                            <p>Meeting scheduled successfully</p>
                            <div className="flex justify-center mt-4 w-[100%]">
                              <button
                                onClick={() => {
                                  setSuccessPop(false);
                                  router.push('/pages/mentordashboard');
                                }} //Write Code Gaurav
                                className="btn-orange"
                              >
                                Send Email
                              </button>
                            </div>     
                            </div>
                          </div>
                        
                      </>   
                    )
                  }  
                  {
                    mentees.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Mentees:</h3>
                        <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
                        <ul className="list-disc list-inside text-white space-y-2">
                          {mentees.map((mentee, index) => (
                            <li key={index} className="bg-black/20 flex border border-white/10 rounded-lg p-2">
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
                    ) : (
                      <p className="text-md text-red-600 font-semibold w-[100%] flex justify-center mt-4">No mentees found</p>
                    )
                  }              
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