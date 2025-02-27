"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import EmailProgress from "../EmailProgress/EmailProgress";
import { FaVideo, FaBuilding } from "react-icons/fa"; // Add this import at the top

const ScheduleMeetingComponent = () => {
  const router = useRouter();
  const [mentorData, setMentorData] = useState(null);
  const [isDisabled, setDisabled] = useState(true);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [mentorId, setMentorId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  const [mentees, setMentees] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [meetingTopic, setMeetingTopic] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [showSemesterOptions, setShowSemesterOptions] = useState(false);
  const [setSessionSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const [customAlert, setCustomAlert] = useState("");
  const [formattedDate, setFormattedDate] = useState();
  const [formattedTime, setFormattedTime] = useState("");
  const yearRef = useRef(null);
  const sessionRef = useRef(null);

  // const [semesterSuggestions, setSemesterSuggestions] = useState([]);
  // console.log(semesterSuggestions);
  const semesterRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false); // Add this new state
  const [submitting, setSubmitting] = useState(false);

  const fixedBranch = "CSE CORE";

  const [preventReload, setPreventReload] = useState(false);
  const [isMeetingOnline, setIsMeetingOnline] = useState(false);
  const [venue, setVenue] = useState("");
  const [emailProgress, setEmailProgress] = useState({
    current: 0,
    total: 0,
    show: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const sessionData = window.sessionStorage.getItem("mentorData");
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          setMentorData(parsedData);
          setMentorId(parsedData?.MUJid || "");
          setAcademicYear(parsedData?.academicYear || "");
          setAcademicSession(parsedData?.academicSession || "");
        }
      } catch (error) {
        console.error("Error accessing sessionStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (preventReload) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [preventReload]);

  const handleMeetingTopicChange = (e) => {
    let value = e.target.value;
    // Only allow uppercase letters and numbers
    // if (!/^[A-Z0-9]*$/.test(value)) return;
    setMeetingTopic(value);
  };

  // const handleMentorIdChange = (e) => {
  //   let value = e.target.value.toUpperCase();
  //   // Only allow uppercase letters and numbers
  //   if (!/^[A-Z0-9]*$/.test(value)) return;
  //   setMentorId(value);
  // };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);

    // Format date and time with explicit AM/PM
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const formattedTime = date
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase(); // Makes AM/PM uppercase
    setFormattedDate(formattedDate);
    setFormattedTime(formattedTime);
  };

  useEffect(() => {
    const generateMeetingId = async () => {
      try {
        const response = await axios.get("/api/meeting/mentors/schmeeting", {
          params: {
            mentor_id: mentorId,
            semester: currentSemester,
            session: academicSession,
            year: academicYear,
          },
        });

        if (response.data) {
          const meetingsHeld = response.data?.meetings;

          // console.log("Mentor meetings:", meetingsHeld);
          // console.log('Meeting count:', meetingCount);
          //MEETING LIMIT CURRENTLY DISABLED
          // if(meetingsHeld.length >= 4){
          //   setMeetingId('You have already scheduled 4 meetings for this section')
          //   setCustomAlert('You have already scheduled 4 meetings for this section')
          //   setDisabled(true);
          // }else{
          setMeetingId(
            `${mentorId}${currentSemester}-M${meetingsHeld.length + 1}`
          );
          setCustomAlert("");
          setDisabled(false);
          // }
        }
      } catch (error) {
        // console.log('Error fetching meetings:', error.response?.data || error.message);
        setMeetingId(error.response?.data.error);
        setCustomAlert(error.response?.data.error);
        setDisabled(true);
      }
    };

    try {
      if (mentorId && currentSemester && academicSession && academicYear) {
        generateMeetingId();
        getMentees(mentorId, currentSemester);
      }
    } catch (error) {
      console.log("Error in useEffect:", error);
      throw error;
    }
  }, [currentSemester]); // Add proper dependencies

  // Calculate current semester based on date
  useEffect(() => {
    const calculateSemester = () => {
      // Set available semesters based on the current term
      if (!academicYear) return [];
      const [startYear] = academicYear.split("-");

      const semesters =
        academicSession === `JULY-DECEMBER ${startYear}`
          ? [1, 3, 5, 7]
          : [2, 4, 6, 8];
      // console.log('Current semesters:', semesters);
      setAvailableSemesters(semesters);
      const semester = "";
      setCurrentSemester(semester);
    };

    calculateSemester();
    // console.log('Current semester:', currentSemester);
  }, [academicSession]);

  const handleMeetingScheduled = async () => {
    if (!mentorId || !currentSemester || !dateTime || !venue || !meetingTopic) {
      setCustomAlert("Please fill all required fields");
      return;
    }

    setLoading(true);
    setSubmitting(true);
    setPreventReload(true);

    try {
      // First schedule the meeting
      const response = await axios.post("/api/meeting/mentors/schmeeting", {
        mentor_id: mentorId,
        meeting_id: meetingId,
        TopicOfDiscussion: meetingTopic,
        meeting_date: formattedDate,
        meeting_time: formattedTime,
        semester: currentSemester,
        session: academicSession,
        year: academicYear,
        isMeetingOnline: isMeetingOnline,
        venue: venue,
      });

      if (response.status === 200) {
        // Filter out invalid emails and send
        const validEmails = mentees
          .filter((mentee) => mentee.email && mentee.email.includes("@"))
          .map((mentee) => mentee.email);

        if (validEmails.length === 0) {
          throw new Error("No valid email addresses found");
        }

        await sendEmailToMentees(validEmails);

        // Add/edit meetingData in session storage
        const newMeeting = {
          mentor_id: mentorId,
          meeting_id: meetingId,
          TopicOfDiscussion: meetingTopic,
          meeting_date: formattedDate,
          meeting_time: formattedTime,
          semester: currentSemester,
          session: academicSession,
          year: academicYear,
          isMeetingOnline: isMeetingOnline,
          venue: venue,
        };

        const meetingData = JSON.parse(sessionStorage.getItem("meetingData")) || [];
        const updatedMeetingData = [...meetingData, newMeeting];
        sessionStorage.setItem("meetingData", JSON.stringify(updatedMeetingData));
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      setCustomAlert(
        error.message || "Failed to schedule meeting or send emails"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
      setPreventReload(false);
    }
  };

  // Add new function to get mentees
  const getMentees = async (mentorId, semester) => {
    setIsLoading(true); // Start loading
    try {
      const response = await fetch(
        `/api/meeting/mentees?mentorId=${mentorId}&semester=${semester}&year=${academicYear}&session=${academicSession}`
      );
      if (!response.ok) {
        // console.log("Failed to fetch mentees");
        setDisabled(true);
      } else {
        const menteesData = await response.json();
        setMentees(menteesData);
        setDisabled(menteesData.length === 0);
      }
      // console.log(mentees, "mentees");
    } catch (error) {
      // console.log("Error fetching mentees:", error);
      setDisabled(true);
      throw error;
    } finally {
      setIsLoading(false); // End loading
    }
  };

  // Add helper functions
  const generateAcademicSessions = (year) => {
    if (!year) return [];
    const [startYear] = year.split("-");
    return [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${parseInt(startYear) + 1}`,
    ];
  };

  const validateAcademicYear = (value) => {
    if (!value) return false;
    const regex = /^(\d{4})-(\d{4})$/;
    if (!regex.test(value)) return false;
    const [startYear, endYear] = value.split("-").map(Number);
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
    const [startYear, endYear] = academicYear.split("-");
    const possibleSessions = [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`,
    ];

    return possibleSessions.filter((session) =>
      session.toLowerCase().includes(input.toLowerCase())
    );
  };

  const handleAcademicYearInput = (e) => {
    let value = e.target.value.toUpperCase();

    if (value.length === 4 && !value.includes("-")) {
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

    if (value.startsWith("JUL")) {
      value = `JULY-DECEMBER ${academicYear?.split("-")[0]}`;
    } else if (value.startsWith("JAN")) {
      value = `JANUARY-JUNE ${academicYear?.split("-")[1]}`;
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

  // const generateSemesterSuggestions = (input) => {
  //   if (!input) return [];
  //   return availableSemesters.filter((sem) =>
  //     `${sem}`.toLowerCase().includes(input.toLowerCase())
  //   );
  // };

  const handleSemesterInput = (e) => {
    let value = e.target.value.toUpperCase();

    // Auto-hide dropdown if a valid semester is entered
    if (availableSemesters.includes(parseInt(value))) {
      setShowSemesterOptions(false);
    } else if (value.length > 0) {
      // setSemesterSuggestions(generateSemesterSuggestions(value));
      setShowSemesterOptions(true);
    } else {
      // setSemesterSuggestions([]);
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
        if (
          semesterRef.current &&
          !semesterRef.current.contains(event.target)
        ) {
          setShowSemesterOptions(false);
        }
      } catch (error) {
        // console.log("Error in handleClickOutside:", error);
        throw error;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      setIsMounted(true);
    } catch (error) {
      console.log("Error during hydration:", error);
      throw error;
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
Topic: ${meetingTopic || "N/A"}
Meeting Type: ${isMeetingOnline ? "Online" : "Offline"}
${isMeetingOnline ? "Meeting Link" : "Venue"}: ${venue}
Branch: ${fixedBranch}
Semester: ${currentSemester}

Please ensure your attendance for this mentor meeting. If you have any conflicts or concerns, kindly inform me in advance.

Best regards,
${mentorData?.name || "Your Mentor"}
${mentorData?.designation || "Faculty Mentor"}
Department of Computer Science and Engineering
Manipal University Jaipur
Contact: ${mentorData?.email || ""}`;

  const sendEmailToMentees = async (menteeEmails) => {
    try {
      // Validate email array
      if (!Array.isArray(menteeEmails) || menteeEmails.length === 0) {
        throw new Error("No valid email recipients found");
      }

      // Start progress
      setEmailProgress({ current: 0, total: menteeEmails.length, show: true });

      // Send emails
      const response = await axios.post("/api/meeting/send-email", {
        emails: menteeEmails,
        subject: `Meeting Scheduled - ${meetingId}`,
        body: getEmailBody(),
        meetingId: meetingId, // Ensure meetingId is included
      });

      if (response.data.success) {
        setEmailProgress({
          current: menteeEmails.length,
          total: menteeEmails.length,
          show: true,
        });

        setTimeout(() => {
          setEmailProgress({ current: 0, total: 0, show: false });
          router.push("/pages/mentordashboard");
        }, 2000);
      } else {
        throw new Error(response.data.message || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setCustomAlert(
        error.message || "Failed to send meeting notification emails"
      );
      setEmailProgress({ current: 0, total: 0, show: false });
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // Add 10 minutes buffer
    return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:mm
  };

  return (
    <AnimatePresence>
      <motion.div className='min-h-screen bg-[#0a0a0a] overflow-x-hidden relative'>
        {/* Add loading overlay */}
        {isLoading && (
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center'>
            <div className='flex flex-col items-center gap-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500'></div>
              <p className='text-white text-lg'>Loading data...</p>
            </div>
          </div>
        )}
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>

        <div className='relative z-10 container mx-auto px-4 py-6 md:pt-24'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-4 md:mb-8'>
            <h1 className='text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4 md:mb-6'>
              Schedule Meetings
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='w-full mx-auto'>
            <div className='bg-white/5 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/10'>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
                {" "}
                {/* Changed from grid-cols-2 to grid-cols-3 */}
                {/* Left Column */}
                <div className='space-y-3'>
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
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Branch
                    </label>
                    <input
                      type='text'
                      value={fixedBranch}
                      disabled
                      className='w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white opacity-60'
                    />
                  </div>

                  {/* Academic Year Field */}
                  <div ref={yearRef} className='relative'>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Academic Year
                    </label>
                    <input
                      type='text'
                      placeholder='YYYY-YYYY'
                      value={academicYear}
                      onChange={handleAcademicYearInput}
                      disabled={mentorData.academicYear ? true : false}
                      onClick={() => setShowYearOptions(true)}
                      className={`w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white ${
                        mentorData.academicYear ? "opacity-60" : ""
                      }`}
                    />
                    {showYearOptions && (
                      <div className='absolute z-50 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                        {yearSuggestions.map((year) => (
                          <div
                            key={year}
                            className='px-4 py-3 hover:bg-white/10 cursor-pointer text-white text-sm md:text-base'
                            onClick={() => {
                              setAcademicYear(year);
                              setShowYearOptions(false);
                              const sessions = generateAcademicSessions(year);
                              if (sessions.length > 0) {
                                setAcademicSession(sessions[0]);
                              }
                            }}>
                            {year}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Academic Session Field */}
                  <div ref={sessionRef} className='relative'>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Academic Session
                    </label>
                    <input
                      type='text'
                      placeholder={
                        !academicYear
                          ? "Add academic year first"
                          : "MONTH-MONTH YYYY"
                      }
                      value={academicSession}
                      onChange={handleAcademicSessionInput}
                      onClick={() => setShowSessionOptions(true)}
                      disabled={
                        (mentorData.academicSession ? true : false) ||
                        !academicYear
                      }
                      className='w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white disabled:opacity-50'
                    />
                    {showSessionOptions && (
                      <div className='absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg'>
                        {generateAcademicSessions(academicYear).map(
                          (session) => (
                            <div
                              key={session}
                              className='px-4 py-2 hover:bg-white/10 cursor-pointer text-white'
                              onClick={() => {
                                setAcademicSession(session);
                                setShowSessionOptions(false);
                              }}>
                              {session}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div ref={semesterRef} className='relative'>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Semester (Required)
                    </label>
                    <input
                      type='text'
                      placeholder={
                        !academicYear
                          ? "Add academic year first"
                          : availableSemesters[0] == 2
                          ? "Select even semester"
                          : "Select odd semester"
                      }
                      value={academicYear && currentSemester}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          availableSemesters.includes(parseInt(value)) ||
                          value === ""
                        ) {
                          handleSemesterInput(e);
                        }
                      }}
                      onClick={() => {
                        if (!currentSemester) {
                          setShowSemesterOptions(true);
                        }
                      }}
                      disabled={!academicYear}
                      className='w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white disabled:opacity-50'
                    />
                    {showSemesterOptions && (
                      <div className='absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg'>
                        {availableSemesters.map((sem) => (
                          <div
                            key={sem}
                            className='px-4 py-2 hover:bg-white/10 cursor-pointer text-white'
                            onClick={() => {
                              setCurrentSemester(sem);
                              setShowSemesterOptions(false);
                            }}>
                            {sem}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Middle Column */}
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Meeting ID
                    </label>
                    <input
                      type='text'
                      placeholder='Meeting ID'
                      disabled={true}
                      value={meetingId}
                      className='w-full bg-black/20 border border-white/10 rounded-lg pointer-events-none p-2.5 text-sm md:text-base text-white disabled:opacity-50'
                    />
                  </div>

                  {/* Meeting Title moved to top */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Meeting Topic
                    </label>
                    <textarea
                      value={meetingTopic}
                      onChange={handleMeetingTopicChange}
                      placeholder='Enter meeting topic'
                      rows='3'
                      className='w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white'
                    />
                  </div>

                  {/* Added Date & Time field */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-1'>
                      Date & Time
                    </label>
                    <div className='relative'>
                      <input
                        type='datetime-local'
                        value={dateTime}
                        min={getMinDateTime()}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const now = new Date();

                          if (selectedDate < now) {
                            setCustomAlert(
                              "Please select a future date and time"
                            );
                            return;
                          }

                          setDateTime(e.target.value);
                          formatDateTime(e.target.value);
                          setCustomAlert("");
                          e.target.blur(); // Autoclose after selecting time
                        }}
                        className='w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white 
                                  [&::-webkit-calendar-picker-indicator]:invert hover:border-orange-500 
                                  focus:border-orange-500 transition-colors'
                      />
                    </div>
                  </div>

                  {/* Replace the Meeting Type Selection div with this new version */}
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Meeting Type
                    </label>
                    <div className='grid grid-cols-2 gap-2 md:gap-3'>
                      <button
                        type='button'
                        onClick={() => {
                          setIsMeetingOnline(false);
                          setVenue("");
                        }}
                        className={`flex items-center justify-center space-x-2 p-2.5 md:p-3 rounded-lg transition-all duration-200 text-sm md:text-base ${
                          !isMeetingOnline
                            ? "bg-orange-500 text-white"
                            : "bg-black/20 text-gray-400 hover:bg-black/30"
                        }`}>
                        <FaBuilding className='text-base md:text-lg' />
                        <span className='hidden sm:inline'>Offline</span>
                      </button>

                      <button
                        type='button'
                        onClick={() => {
                          setIsMeetingOnline(true);
                          setVenue("");
                        }}
                        className={`flex items-center justify-center space-x-2 p-2.5 md:p-3 rounded-lg transition-all duration-200 text-sm md:text-base ${
                          isMeetingOnline
                            ? "bg-orange-500 text-white"
                            : "bg-black/20 text-gray-400 hover:bg-black/30"
                        }`}>
                        <FaVideo className='text-base md:text-lg' />
                        <span className='hidden sm:inline'>Online</span>
                      </button>
                    </div>
                  </div>

                  {/* Update the Venue/Link Field with icons */}
                  <div className='mt-4'>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      {isMeetingOnline ? "Meeting Link" : "Venue"}
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        {isMeetingOnline ? (
                          <FaVideo className='text-gray-400 text-base md:text-lg' />
                        ) : (
                          <FaBuilding className='text-gray-400 text-base md:text-lg' />
                        )}
                      </div>
                      <input
                        type='text'
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder={
                          isMeetingOnline
                            ? "Enter meeting link (e.g., Zoom, Teams)"
                            : "Enter venue location"
                        }
                        className='w-full bg-black/20 border border-white/10 rounded-lg pl-10 p-2.5 text-sm md:text-base text-white focus:border-orange-500 transition-colors'
                      />
                    </div>
                  </div>

                  <button
                    type='submit'
                    className='w-full btn-orange disabled:opacity-50 relative mt-4 p-2.5 md:p-3'
                    disabled={loading || isDisabled || submitting}
                    onClick={handleMeetingScheduled}>
                    <div className='flex items-center justify-center space-x-2'>
                      {submitting ? (
                        <>
                          <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
                          <span className='text-sm md:text-base'>Scheduling...</span>
                        </>
                      ) : (
                        <span className='text-sm md:text-base'>Schedule Meeting</span>
                      )}
                    </div>
                  </button>
                  {customAlert && (
                    <p className='text-sm md:text-base text-red-600 font-semibold w-full text-center mt-2'>
                      {customAlert}
                    </p>
                  )}
                </div>
                {/* Right Column - Mentees List */}
                <div className='space-y-3 mt-4 md:mt-0'>
                  {mentees.length > 0 ? (
                    <div>
                      <h3 className='text-base md:text-lg font-semibold text-white mb-2'>
                        Mentees:
                      </h3>
                      <div className='max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar'>
                        <ul className='list-none space-y-2'>
                          {mentees.map((mentee, index) => (
                            <li
                              key={
                                mentee.MUJid ||
                                mentee.email ||
                                `mentee-${index}`
                              }
                              className='bg-black/20 flex border border-white/10 rounded-lg p-2.5'>
                              <div className='flex items-center space-x-2 w-full'>
                                <div className='w-full'>
                                  <p className='text-sm md:text-base font-medium text-white'>
                                    {mentee.name}
                                  </p>
                                  <p className='text-xs md:text-sm text-gray-400'>
                                    {mentee.email}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center justify-center h-full'>
                      <h3 className='text-sm md:text-base font-semibold text-rose-800 text-center'>
                        No mentees found
                      </h3>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
        {emailProgress.show && (
          <div className='fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50'>
            <EmailProgress
              current={emailProgress.current}
              total={emailProgress.total}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleMeetingComponent;
