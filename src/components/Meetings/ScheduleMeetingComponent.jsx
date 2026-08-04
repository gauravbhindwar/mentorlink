"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import EmailProgress from "../EmailProgress/EmailProgress";
import { FaVideo, FaBuilding } from "react-icons/fa";

const ScheduleMeetingComponent = () => {
  const router = useRouter();
  const [mentorData, setMentorData] = useState(null);
  const [isDisabled, setDisabled] = useState(true);
  const [currentSemester, setCurrentSemester] = useState("");
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
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState("info"); // "success", "error", "info"
  const [formattedDate, setFormattedDate] = useState();
  const [formattedTime, setFormattedTime] = useState("");
  const yearRef = useRef(null);
  const sessionRef = useRef(null);
  const semesterRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allowBackdateMeetings, setAllowBackdateMeetings] = useState(false);
  const fixedBranch = "CSE CORE";
  const [preventReload, setPreventReload] = useState(false);
  const [isMeetingOnline, setIsMeetingOnline] = useState(false);
  const [venue, setVenue] = useState("");
  const [emailProgress] = useState({
    current: 0,
    total: 0,
    show: false,
  });

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("PM");
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  const getMentees = useCallback(
    async (mentorIdValue, semesterValue) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/meeting/mentees?mentorId=${mentorIdValue}&semester=${semesterValue}&year=${academicYear}&session=${academicSession}`
        );
        if (!response.ok) {
          setMentees([]);
          setDisabled(true);
        } else {
          const menteesData = await response.json();
          setMentees(Array.isArray(menteesData) ? menteesData : []);
          setDisabled(
            Array.isArray(menteesData) ? menteesData.length === 0 : true
          );
        }
      } catch (error) {
        setMentees([]);
        setDisabled(true);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [academicYear, academicSession]
  );

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
        } else {
          // Try to get mentor data using stored user info
          const storedMUJId = window.sessionStorage.getItem("userMUJId");
          const storedEmail = window.sessionStorage.getItem("userEmail");

          if (storedMUJId && storedEmail) {
            // Fetch mentor data from API
            fetch(`/api/mentor?MUJId=${storedMUJId}&email=${storedEmail}`)
              .then(response => response.json())
              .then(mentorInfo => {
                setMentorData(mentorInfo);
                setMentorId(mentorInfo?.MUJid || "");
                setAcademicYear(mentorInfo?.academicYear || "");
                setAcademicSession(mentorInfo?.academicSession || "");
                // Store for future use
                window.sessionStorage.setItem("mentorData", JSON.stringify(mentorInfo));
              })
              .catch(error => {
                console.error("Error fetching mentor data:", error);
                router.push("/");
              });
          } else {
            // No mentor data found, redirect to login
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error accessing sessionStorage:", error);
        router.push("/");
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

  useEffect(() => {
    const fetchBackdateSetting = async () => {
      try {
        const response = await axios.get(
          "/api/admin/settings/backdate-meeting"
        );
        if (
          response.data &&
          response.data.allowBackdateMeetings !== undefined
        ) {
          setAllowBackdateMeetings(response.data.allowBackdateMeetings);
        }
      } catch (error) {
        console.error("Failed to fetch backdate meeting setting:", error);
        setAllowBackdateMeetings(false);
      }
    };

    fetchBackdateSetting();
  }, []);

  const handleMeetingTopicChange = (e) => {
    let value = e.target.value;
    setMeetingTopic(value);
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);

    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
    setFormattedDate(formattedDate);
    setFormattedTime(formattedTime);
  };

  const updateCombinedDateTime = () => {
    if (!selectedDate) return;

    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      let hours = parseInt(selectedHour, 10);
      let minutes = parseInt(selectedMinute, 10);

      if (selectedAmPm === "PM" && hours < 12) hours += 12;
      if (selectedAmPm === "AM" && hours === 12) hours = 0;

      const dateObj = new Date(year, month - 1, day, hours, minutes);
      setDateTime(dateObj.toISOString().slice(0, 16));
      formatDateTime(dateObj.toISOString());
      setShowDateTimePicker(false);
    } catch (error) {
      console.error("Error updating datetime:", error);
      showAlert("Invalid date or time format", "error");
    }
  };

  const toggleDateTimePicker = () => {
    setShowDateTimePicker(!showDateTimePicker);
  };

  useEffect(() => {
    if (showDateTimePicker && dateTime) {
      const date = new Date(dateTime);
      setSelectedDate(date.toISOString().slice(0, 10));
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const isPM = hours >= 12;

      if (hours > 12) hours -= 12;
      else if (hours === 0) hours = 12;

      setSelectedHour(String(hours).padStart(2, "0"));
      setSelectedMinute(String(Math.floor(minutes / 5) * 5).padStart(2, "0"));
      setSelectedAmPm(isPM ? "PM" : "AM");
    }
  }, [showDateTimePicker, dateTime]);

  useEffect(() => {
    const generateMeetingId = async () => {
      try {
        const response = await axios.get("/api/meeting/mentors/schmeeting", {
          params: {
            mentor_id: mentorId,
            semester: Number(currentSemester),
            session: academicSession,
            year: academicYear,
          },
        });

        if (response.data) {
          const meetingsHeld = response.data?.meetings;
          setMeetingId(
            `${mentorId}${currentSemester}-M${meetingsHeld.length + 1}`
          );
          closeAlert();
          setDisabled(false);
        }
      } catch (error) {
        setMeetingId(error.response?.data.error);
        showAlert(error.response?.data.error, "error");
        setDisabled(true);
      }
    };

    try {
      if (
        mentorId &&
        currentSemester &&
        academicSession &&
        academicYear &&
        availableSemesters.includes(Number(currentSemester))
      ) {
        generateMeetingId();
        getMentees(mentorId, Number(currentSemester));
      }
    } catch (error) {
      console.log("Error in useEffect:", error);
      throw error;
    }
  }, [
    mentorId,
    currentSemester,
    academicSession,
    academicYear,
    availableSemesters,
    getMentees,
  ]);

  useEffect(() => {
    const calculateSemester = () => {
      if (!academicYear) return [];
      const [startYear] = academicYear.split("-");

      const semesters =
        academicSession === `JULY-DECEMBER ${startYear}`
          ? [1, 3, 5, 7]
          : [2, 4, 6, 8];
      setAvailableSemesters(semesters);
      const semester = "";
      setCurrentSemester(semester);
    };

    calculateSemester();
  }, [academicSession, academicYear]);

  const handleMeetingScheduled = async () => {
    if (!mentorId || !currentSemester || !dateTime || !venue || !meetingTopic) {
      showAlert("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    setSubmitting(true);
    setPreventReload(true);

    try {
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
        const validEmails = Array.isArray(mentees)
          ? mentees
              .filter((mentee) => mentee.email && mentee.email.includes("@"))
              .map((mentee) => mentee.email)
          : [];

        if (validEmails.length === 0) {
          throw new Error("No valid email addresses found");
        }

        await sendEmailToMentees(validEmails);

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

        const meetingData =
          JSON.parse(sessionStorage.getItem("meetingData")) || [];
        const updatedMeetingData = [...meetingData, newMeeting];
        sessionStorage.setItem(
          "meetingData",
          JSON.stringify(updatedMeetingData)
        );
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      showAlert(
        error.message || "Failed to schedule meeting or send emails",
        "error"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
      setPreventReload(false);
    }
  };

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

  const handleSemesterInput = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "").slice(0, 1);
    const semesterNumber = parseInt(numericValue);

    // Only allow valid semesters from the available list
    if (!numericValue || availableSemesters.includes(semesterNumber)) {
      setCurrentSemester(numericValue);
    }

    // Show dropdown automatically when user types a number
    if (numericValue) {
      setShowSemesterOptions(true);
    }
  };

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
      if (!Array.isArray(menteeEmails) || menteeEmails.length === 0) {
        throw new Error("No valid email recipients found");
      }

      // Show sending notification instead of progress
      showAlert("Meeting scheduled successfully! Email notifications are being sent to students...", "info");

      const response = await axios.post("/api/meeting/send-email", {
        emails: menteeEmails,
        subject: `Meeting Scheduled - ${meetingId}`,
        body: getEmailBody(),
        meetingId: meetingId,
      });

      if (response.data.success) {
        showAlert(`Meeting scheduled! Email notifications have been sent to ${menteeEmails.length} student(s).`, "success");

        setTimeout(() => {
          closeAlert();
          router.push("/pages/mentordashboard");
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      showAlert(
        "Meeting scheduled successfully, but there was an issue sending email notifications. Students may be notified later.",
        "error"
      );
      
      // Still redirect after a delay even if email fails
      setTimeout(() => {
        closeAlert();
        router.push("/pages/mentordashboard");
      }, 4000);
    }
  };

  // Helper function to show alert popup
  const showAlert = (message, type = "info") => {
    setCustomAlert(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // Helper function to close alert popup
  const closeAlert = () => {
    setShowAlertModal(false);
    setCustomAlert("");
  };

  return (
    <AnimatePresence>
      <motion.div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden relative">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 pt-20 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 md:mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4 md:mb-6">
              Schedule Meetings
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border p-4 border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={fixedBranch}
                      disabled
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white opacity-80"
                    />
                  </div>

                  <div ref={yearRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      placeholder="YYYY-YYYY"
                      value={academicYear}
                      onChange={handleAcademicYearInput}
                      disabled={mentorData?.academicYear ? true : false}
                      onClick={() => setShowYearOptions(true)}
                      className={`w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white disabled:opacity-85`}
                    />
                    {showYearOptions && (
                      <div className="absolute z-50 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {yearSuggestions.map((year, yi) => (
                          <div
                            key={`year-suggestion-${yi}`}
                            className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white text-sm md:text-base"
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Academic Session
                    </label>
                    <input
                      type="text"
                      placeholder={
                        !academicYear
                          ? "Add academic year first"
                          : "MONTH-MONTH YYYY"
                      }
                      value={academicSession}
                      onChange={handleAcademicSessionInput}
                      onClick={() => setShowSessionOptions(true)}
                      disabled={
                        (mentorData?.academicSession ? true : false) ||
                        !academicYear
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white disabled:opacity-80"
                    />
                    {showSessionOptions && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {generateAcademicSessions(academicYear).map(
                          (session, si) => (
                            <div
                              key={`session-suggestion-${si}`}
                              className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                              onClick={() => {
                                setAcademicSession(session);
                                setShowSessionOptions(false);
                              }}
                            >
                              {session}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {/*
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
                  */}

                  <div ref={semesterRef} className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Semester <sup className="text-red-600/90">*</sup>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={
                        !academicYear
                          ? "Add academic year first"
                          : "Select semester number"
                      }
                      value={currentSemester}
                      onChange={handleSemesterInput}
                      onFocus={() => {
                        if (academicYear) {
                          setShowSemesterOptions(true);
                        }
                      }}
                      disabled={!academicYear}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white placeholder-gray-500 disabled:opacity-50"
                    />
                    {showSemesterOptions && availableSemesters.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
                          Available Semesters
                        </div>
                        {availableSemesters.map((sem, si) => (
                          <div
                            key={`semester-option-${si}`}
                            className={`px-4 py-2 hover:bg-white/10 cursor-pointer text-white ${
                              currentSemester === String(sem)
                                ? "bg-orange-500/20 border-l-2 border-orange-500"
                                : ""
                            }`}
                            onClick={() => {
                              setCurrentSemester(String(sem));
                              setShowSemesterOptions(false);
                            }}
                          >
                            Semester {sem}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Meeting Topic
                    </label>
                    <textarea
                      value={meetingTopic}
                      onChange={handleMeetingTopicChange}
                      placeholder="Enter meeting topic"
                      rows="3"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Meeting Date & Time
                      </label>
                      <div className="relative">
                        <div
                          onClick={toggleDateTimePicker}
                          className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm md:text-base text-white cursor-pointer flex justify-between items-center"
                        >
                          <span className={!dateTime ? "text-gray-500" : ""}>
                            {dateTime
                              ? `${formattedDate} at ${formattedTime}`
                              : "Select date and time"}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>

                        {!allowBackdateMeetings && (
                          <p className="mt-1 text-xs text-amber-500">
                            Back date meetings are disabled by admin
                          </p>
                        )}

                        {/* {showDateTimePicker && (
                          <div className='absolute right-0 z-50 mt-2 bg-gray-800 border border-white/10 rounded-lg p-4 w-full lg:w-[400px] shadow-xl'>
                            <div className='flex justify-between items-center mb-3'>
                              <h3 className='text-white font-medium'>Select Date & Time</h3>
                              <button 
                                onClick={() => setShowDateTimePicker(false)}
                                className='text-gray-400 hover:text-white'
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className='mb-4'>
                              <label className='block text-sm font-medium text-gray-300 mb-2'>Date</label>
                              <input
                                type='date'
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={!allowBackdateMeetings ? new Date().toISOString().slice(0, 10) : undefined}
                                className='w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white 
                                          [&::-webkit-calendar-picker-indicator]:invert hover:border-orange-500 
                                          focus:border-orange-500 transition-colors'
                              />
                            </div>
                            
                            <div className='mb-4'>
                              <label className='block text-sm font-medium text-gray-300 mb-2'>Time</label>
                              <div className='flex space-x-2 items-center'>
                                <select 
                                  value={selectedHour}
                                  onChange={(e) => setSelectedHour(e.target.value)}
                                  className='bg-black/30 border border-white/10 rounded-lg p-2 text-white text-center appearance-none flex-1'
                                >
                                  {Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)).map((hour, hi) => (
                                    <option key={`hour-alt-${hi}`} value={String(hour).padStart(2, '0')}>
                                      {String(hour).padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                                
                                <span className='text-white text-xl'>:</span>
                                
                                <select 
                                  value={selectedMinute}
                                  onChange={(e) => setSelectedMinute(e.target.value)}
                                  className='bg-black/30 border border-white/10 rounded-lg p-2 text-white text-center appearance-none flex-1'
                                >
                                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute, mi) => (
                                    <option key={`minute-alt-${mi}`} value={String(minute).padStart(2, '0')}>
                                      {String(minute).padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                                
                                <select 
                                  value={selectedAmPm}
                                  onChange={(e) => setSelectedAmPm(e.target.value)}
                                  className='bg-black/30 border border-white/10 rounded-lg p-2 text-white text-center appearance-none flex-1'
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className='flex justify-end'>
                              <button
                                type="button"
                                onClick={updateCombinedDateTime}
                                disabled={!selectedDate}
                                className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                          

                        )} */}

                        <AnimatePresence>
                          {showDateTimePicker && (
                            <motion.div
                              initial={{
                                opacity: 0,
                                y: -10,
                                scale: 0.95,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                              }}
                              exit={{
                                opacity: 0,
                                y: -10,
                                scale: 0.95,
                              }}
                              transition={{
                                duration: 0.2,
                                ease: "easeOut",
                              }}
                              // Main container with a solid color scheme for better contrast.
                              className="absolute right-1 top-1 z-50 mt-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 w-[calc(100%-2rem)] max-w-sm shadow-2xl"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">
                                  Select Date & Time
                                </h3>
                                <button
                                  onClick={() => setShowDateTimePicker(false)}
                                  className="text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 transition-colors"
                                  aria-label="Close date and time picker"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>

                              <div className="mb-4 space-y-1.5">
                                <label
                                  htmlFor="date-picker"
                                  className="block text-sm font-medium text-slate-600 dark:text-slate-400"
                                >
                                  Date
                                </label>
                                <input
                                  id="date-picker"
                                  type="date"
                                  value={selectedDate}
                                  onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                  }
                                  min={
                                    !allowBackdateMeetings
                                      ? new Date().toISOString().slice(0, 10)
                                      : undefined
                                  }
                                  className="w-full bg-slate-100 dark:bg-slate-900 border-transparent rounded-md p-2 text-slate-800 dark:text-slate-200 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow
                         [color-scheme:light]"
                                />
                              </div>

                              <div className="mb-4 space-y-1.5">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Time
                                </label>
                                <div className="flex space-x-2 items-center">
                                  <select
                                    value={selectedHour}
                                    onChange={(e) =>
                                      setSelectedHour(e.target.value)
                                    }
                                    aria-label="Hour"
                                    className="bg-slate-100 dark:bg-slate-900 border-transparent rounded-md p-2 text-slate-800 dark:text-slate-200 text-center appearance-none flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                  >
                                    {Array.from(
                                      {
                                        length: 12,
                                      },
                                      (_, i) => i + 1
                                    ).map((hour, hi) => (
                                      <option
                                        key={`hour-option-${hi}`}
                                        value={String(hour).padStart(2, "0")}
                                      >
                                        {String(hour).padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>

                                  <span className="text-slate-400 dark:text-slate-500 font-bold text-lg">
                                    :
                                  </span>

                                  <select
                                    value={selectedMinute}
                                    onChange={(e) =>
                                      setSelectedMinute(e.target.value)
                                    }
                                    aria-label="Minute"
                                    className="bg-slate-100 dark:bg-slate-900 border-transparent rounded-md p-2 text-slate-800 dark:text-slate-200 text-center appearance-none flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                  >
                                    {Array.from(
                                      {
                                        length: 12,
                                      },
                                      (_, i) => i * 5
                                    ).map((minute, mi) => (
                                      <option
                                        key={`minute-option-${mi}`}
                                        value={String(minute).padStart(2, "0")}
                                      >
                                        {String(minute).padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={selectedAmPm}
                                    onChange={(e) =>
                                      setSelectedAmPm(e.target.value)
                                    }
                                    aria-label="Period"
                                    className="bg-slate-100 dark:bg-slate-900 border-transparent rounded-md p-2 text-slate-800 dark:text-slate-200 text-center appearance-none flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                  >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={updateCombinedDateTime}
                                  disabled={!selectedDate}
                                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                                >
                                  Confirm
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meeting Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMeetingOnline(false);
                          setVenue("");
                        }}
                        className={`flex items-center justify-center space-x-2 p-2.5 md:p-3 rounded-lg transition-all duration-200 text-sm md:text-base ${
                          !isMeetingOnline
                            ? "bg-orange-500 text-white"
                            : "bg-black/20 text-gray-400 hover:bg-black/30"
                        }`}
                      >
                        <FaBuilding className="text-base md:text-lg" />
                        <span className="hidden sm:inline">Offline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMeetingOnline(true);
                          setVenue("");
                        }}
                        className={`flex items-center justify-center space-x-2 p-2.5 md:p-3 rounded-lg transition-all duration-200 text-sm md:text-base ${
                          isMeetingOnline
                            ? "bg-orange-500 text-white"
                            : "bg-black/20 text-gray-400 hover:bg-black/30"
                        }`}
                      >
                        <FaVideo className="text-base md:text-lg" />
                        <span className="hidden sm:inline">Online</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isMeetingOnline ? "Meeting Link" : "Venue"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isMeetingOnline ? (
                          <FaVideo className="text-gray-400 text-base md:text-lg" />
                        ) : (
                          <FaBuilding className="text-gray-400 text-base md:text-lg" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder={
                          isMeetingOnline ? "Enter meeting link" : "Enter venue"
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 p-2.5 text-sm md:text-base text-white placeholder-gray-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-orange disabled:opacity-50 relative mt-4 p-2.5 md:p-3"
                    disabled={loading || isDisabled || submitting}
                    onClick={handleMeetingScheduled}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span className="text-sm md:text-base">
                            Scheduling...
                          </span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base">
                          Schedule Meeting
                        </span>
                      )}
                    </div>
                  </button>
                </div>
                <div className="space-y-3 mt-4 md:mt-0">
                  {mentees.length > 0 ? (
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-white mb-2">
                        Mentees:
                      </h3>
                      <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                        <ul className="list-none space-y-2">
                          {mentees.map((mentee, index) => (
                            <li
                              key={`mentee-item-${index}`}
                              className="bg-black/20 flex border border-white/10 rounded-lg p-2.5"
                            >
                              <div className="flex items-center space-x-2 w-full">
                                <div className="w-full">
                                  <p className="text-sm md:text-base font-medium text-white">
                                    {mentee.name}
                                  </p>
                                  <p className="text-xs md:text-sm text-gray-400">
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
                    <div className="flex items-center justify-center h-full">
                      <h3
                        className="text-lg md:text-xl font-semibold text-center"
                        style={{ color: "rgb(255, 0, 71)" }}
                      >
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
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
            <EmailProgress
              current={emailProgress.current}
              total={emailProgress.total}
            />
          </div>
        )}
      </motion.div>

      {/* Alert Popup Modal */}
      <AnimatePresence>
        {showAlertModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={closeAlert}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-500/20 p-6 max-w-md mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeAlert}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon based on alert type */}
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  alertType === 'success' ? 'bg-green-500/20' :
                  alertType === 'error' ? 'bg-red-500/20' :
                  'bg-blue-500/20'
                }`}>
                  {alertType === 'success' && (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {alertType === 'error' && (
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {alertType === 'info' && (
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="text-center mb-6">
                <h3 className={`text-lg font-bold mb-2 ${
                  alertType === 'success' ? 'text-green-400' :
                  alertType === 'error' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {alertType === 'success' ? 'Success' :
                   alertType === 'error' ? 'Notice' :
                   'Information'}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {customAlert}
                </p>
              </div>

              {/* OK Button */}
              <button
                onClick={closeAlert}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  alertType === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  alertType === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ScheduleMeetingComponent;
