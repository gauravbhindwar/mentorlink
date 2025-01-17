"use client"
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';

const AddMeetingInfo = () => {
  const [mentorId, setMentorId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [semesterSuggestions, setSemesterSuggestions] = useState([]);
  console.log(semesterSuggestions);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const [showSemesterOptions, setShowSemesterOptions] = useState(false);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingNotes, setMeetingNotes] = useState({
    TopicOfDiscussion: '',
    TypeOfInformation: '',
    NotesToStudent: '',
    issuesRaisedByMentee: '',
    outcome: '',
    closureRemarks: ''
  });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);
  const semesterRef = useRef(null);

  const handleMentorIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (!/^[A-Z0-9]*$/.test(value)) return;
    setMentorId(value);
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

  const handleSectionChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (value.length > 2) return;
    if (value.length === 1 && !/^[A-Z]$/.test(value)) return;
    if (value.length === 2 && !/^[A-Z][1-9]$/.test(value)) return;
    setSelectedSection(value);
  };

  const fetchMeetings = async () => {
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
        setMeetings(response.data.meetings);
      }
    } catch (error) {
      console.log('Error fetching meetings:', error);
    }
  };

  useEffect(() => {
    if (mentorId && academicYear && academicSession && currentSemester && selectedSection) {
      fetchMeetings();
    }
  }, [mentorId, academicYear, academicSession, currentSemester, selectedSection]);

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

  const generateSemesterSuggestions = (input) => {
    if (!input) return [];
    return availableSemesters.filter(sem => 
      `${sem}`.toLowerCase().includes(input.toLowerCase())
    );
  };

  const validateAcademicYear = (value) => {
    if (!value) return false;
    const regex = /^(\d{4})-(\d{4})$/;
    if (!regex.test(value)) return false;
    const [startYear, endYear] = value.split('-').map(Number);
    return endYear === startYear + 1;
  };

  const generateAcademicSessions = (year) => {
    if (!year) return [];
    const [startYear] = year.split('-');
    return [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${parseInt(startYear) + 1}`
    ];
  };

  useEffect(() => {
    const calculateSemester = () => {
      if (!academicYear) return [];
      const [startYear] = academicYear.split('-');
      const semesters = academicSession === `JULY-DECEMBER ${startYear}` ? [1, 3, 5, 7] : [2, 4, 6, 8];
      setAvailableSemesters(semesters);
      setCurrentSemester('');
    };
    calculateSemester();
  }, [academicSession]);

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
        if (selectedMeeting && !document.getElementById('meeting-popup').contains(event.target)) {
          setSelectedMeeting(null);
        }
      } catch (error) {
        console.log('Error in handleClickOutside:', error);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMeeting]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      setIsMounted(true);
    } catch (error) {
      console.log('Error during hydration:', error);
    }
  }, []);

  useEffect(() => {
    const { TopicOfDiscussion, TypeOfInformation, NotesToStudent, outcome, closureRemarks } = meetingNotes;
    setIsSubmitDisabled(!(TopicOfDiscussion && TypeOfInformation && NotesToStudent && outcome && closureRemarks));
  }, [meetingNotes]);

  const handleMeetingNotesChange = (e) => {
    const { name, value } = e.target;
    setMeetingNotes(prevNotes => ({
      ...prevNotes,
      [name]: value
    }));
  };

  const handleMeetingSubmit = async () => {
    try {
      await axios.post('/api/meeting/mentors/reportmeeting', {
        mentor_id: mentorId,
        meeting_id: selectedMeeting.meeting_id,
        meeting_notes: meetingNotes
      });
      setSelectedMeeting(null);
      setMeetingNotes({
        TopicOfDiscussion: '',
        TypeOfInformation: '',
        NotesToStudent: '',
        issuesRaisedByMentee: '',
        outcome: '',
        closureRemarks: ''
      });
      fetchMeetings();
    } catch (error) {
      console.log('Error submitting meeting notes:', error);
    }
  };

  if (!isMounted) {
    return null;
  }

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
              Submit Meeting Report
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Academic Year</label>
                    <div ref={yearRef} className="relative">
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Academic Session</label>
                    <div ref={sessionRef} className="relative">
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
                          {sessionSuggestions.map(session => (
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
                    <div ref={semesterRef} className="relative">
                      <input
                        type="text"
                        placeholder={!academicYear ? 'Add academic year first' : availableSemesters[0] == 2 ? 'Select even semester' : 'Select odd semester'}
                        value={currentSemester}
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
                  {meetings.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Meetings:</h3>
                      <ul className="list-disc list-inside text-white space-y-2">
                        {meetings.map((meeting, index) => (
                          <li 
                            key={index} 
                            className={`bg-black/20 flex border border-white/10 rounded-lg p-2 cursor-pointer ${meeting.isReportFilled ? 'pointer-events-none opacity-30' : ''}`}
                            onClick={() => setSelectedMeeting(meeting)}
                          >
                            <div className="flex items-center space-x-2">
                              {/* {console.log("meeting: ",meeting)} */}
                              <div>
                                <p className="text-sm font-medium">Meeting ID: {meeting.meeting_id}</p>
                                <p className="text-xs text-gray-400">Date: {new Date(meeting.meeting_date).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-400">Time: {meeting.meeting_time}</p>
                              </div>
                            </div>
                          </li>
                        ))}
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

        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedMeeting(null)}>
            <div id="meeting-popup" className="bg-white p-6 rounded-lg w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedMeeting(null)}
              >
                <FiX size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-4">Add Meeting Notes</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Topic of Discussion</label>
                  <input
                    type="text"
                    name="TopicOfDiscussion"
                    value={meetingNotes.TopicOfDiscussion}
                    onChange={handleMeetingNotesChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type of Information</label>
                  <input
                    type="text"
                    name="TypeOfInformation"
                    value={meetingNotes.TypeOfInformation}
                    onChange={handleMeetingNotesChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes to Student</label>
                  <input
                    type="text"
                    name="NotesToStudent"
                    value={meetingNotes.NotesToStudent}
                    onChange={handleMeetingNotesChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issues Raised/Resolved</label>
                  <input
                    type="text"
                    name="issuesRaisedByMentee"
                    value={meetingNotes.issuesRaisedByMentee}
                    onChange={handleMeetingNotesChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Outcome</label>
                  <input
                    type="text"
                    name="outcome"
                    value={meetingNotes.outcome}
                    onChange={handleMeetingNotesChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Closure Remarks</label>
                  <input
                    type="text"
                    name="closureRemarks"
                    value={meetingNotes.closureRemarks}
                    onChange={handleMeetingNotesChange}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <button
                  onClick={handleMeetingSubmit}
                  disabled={isSubmitDisabled}
                  className={`w-full py-2 px-4 rounded-lg text-white ${isSubmitDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isSubmitDisabled ? 'Please fill all fields' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AddMeetingInfo;
