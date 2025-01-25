"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/subComponents/Navbar";
import FirstTimeLoginForm from "./FirstTimeLoginForm";
import { FiX } from "react-icons/fi";
import axios from "axios";
import { generateMOMPdf } from "@/components/Meetings/PDFGenerator";
import { PDFDownloadComponent } from "@/components/Meetings/PDFGenerator";
import AttendanceDialog from "@/components/Meetings/AttendanceDialog";
import { Button } from "@mui/material";

const MentorDashBoard = () => {
  const router = useRouter();
  const [mentorData, setMentorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingNotes, setMeetingNotes] = useState({
    TopicOfDiscussion: "",
    TypeOfInformation: "",
    NotesToStudent: "",
    issuesRaisedByMentee: "",
    outcome: "",
    closureRemarks: "",
    feedbackFromMentee: "",
    presentMentees: [],
  });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const extractSessionData = (data) => ({
    name: data.name,
    email: data.email,
    MUJid: data.MUJid,
    academicSession: data.academicSession,
    academicYear: data.academicYear,
    isFirstTimeLogin: data.isFirstTimeLogin,
  });

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // const getCurrentSemester = (session) => {
  //   return session?.includes('JANUARY-JUNE') ? [2, 4, 6, 8] : [1, 3, 5, 7];
  // };

  const fetchMeetingsForSemester = async (
    mentorId,
    year,
    session,
    semester
  ) => {
    try {
      if (
        mentorId != undefined &&
        year != undefined &&
        session != undefined &&
        semester != undefined
      ) {
        const response = await fetch(
          `/api/mentor/manageMeeting?mentorId=${mentorId}&academicYear=${year}&session=${session}&semester=${semester}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch meetings");
        }
        const data = await response.json();
        return data.meetings || [];
      }
    } catch (error) {
      console.error(`Error fetching meetings for semester ${semester}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Check session storage for mentor data
        const sessionData = sessionStorage.getItem("mentorData");
        let mentorInfo;

        if (sessionData) {
          mentorInfo = JSON.parse(sessionData);
          setMentorData(mentorInfo);
        } else {
          // Get MUJ ID from session storage if available
          const storedMUJId = sessionStorage.getItem("mujid");
          const storedEmail = sessionStorage.getItem("email");
          const response = await axios.get("/api/mentor", {
            params: { MUJId: storedMUJId, email: storedEmail },
          });
          mentorInfo = response.data;
          if (!mentorInfo.isFirstTimeLogin) {
            sessionStorage.setItem("mentorData", JSON.stringify(mentorInfo));
          }
          setMentorData(mentorInfo);
        }

        if (!mentorInfo.isFirstTimeLogin) {
          setMeetingsLoading(true);

          // Get primary semester (4 for Jan-June, 3 for July-Dec)
          const primarySemester =
            mentorInfo?.academicSession &&
            mentorInfo?.academicSession.includes("JANUARY-JUNE")
              ? 4
              : 3;

          // Fetch primary semester meetings first
          const primaryMeetings = await fetchMeetingsForSemester(
            mentorInfo.MUJid,
            mentorInfo.academicYear,
            mentorInfo.academicSession,
            primarySemester
          );

          // Set initial meetings
          setMeetings(primaryMeetings);
          sessionStorage.setItem(
            "meetingData",
            JSON.stringify(primaryMeetings)
          );
          setMeetingsLoading(false);

          // Fetch other semesters in background
          const otherSemesters =
            mentorInfo?.academicSession &&
            mentorInfo?.academicSession.includes("JANUARY-JUNE")
              ? [2, 6, 8]
              : [1, 5, 7];

          Promise.all(
            otherSemesters.map(async (semester) => {
              const semesterMeetings = await fetchMeetingsForSemester(
                mentorInfo.MUJid,
                mentorInfo.academicYear,
                mentorInfo.academicSession,
                semester
              );

              if (semesterMeetings.length > 0) {
                setMeetings((prevMeetings) => {
                  const updatedMeetings = [
                    ...prevMeetings,
                    ...semesterMeetings,
                  ];
                  sessionStorage.setItem(
                    "meetingData",
                    JSON.stringify(updatedMeetings)
                  );
                  return updatedMeetings;
                });
              }
            })
          );
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // // Add this helper function before the component
  // const mergeMeetings = (meetings) => {
  //   return meetings.reduce((acc, meeting) => {
  //     const existingMeeting = acc.find(
  //       (m) => m.meeting.meeting_id === meeting.meeting.meeting_id
  //     );
  //     if (existingMeeting) {
  //       existingMeeting.sections.push(meeting.section);
  //     } else {
  //       acc.push({ ...meeting, sections: [meeting.section] });
  //     }
  //     return acc;
  //   }, []);
  // };

  // Add this helper function before the component
  const groupBySemester = (meetings) => {
    return meetings.reduce((acc, meeting) => {
      const semester = meeting.semester;
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(meeting);
      return acc;
    }, {});
  };

  // Add this helper function near the top of the file, before the component
  const getAllSemesters = (academicSession) => {
    return academicSession?.includes("JANUARY-JUNE")
      ? [2, 4, 6, 8]
      : [1, 3, 5, 7];
  };

  useEffect(() => {
    const {
      TopicOfDiscussion,
      TypeOfInformation,
      NotesToStudent,
      outcome,
      closureRemarks,
    } = meetingNotes;
    setIsSubmitDisabled(
      !(
        TopicOfDiscussion &&
        TypeOfInformation &&
        NotesToStudent &&
        outcome &&
        closureRemarks
      )
    );
  }, [meetingNotes]);

  const handleMeetingNotesChange = (e) => {
    const { name, value } = e.target;
    setMeetingNotes((prevNotes) => ({
      ...prevNotes,
      [name]: value,
    }));
  };

  const handleMeetingSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/meeting/mentors/reportmeeting", {
        mentor_id: mentorData.MUJid,
        meeting_id: selectedMeeting.meeting.meeting_id,
        meeting_notes: meetingNotes,
        presentMentees: meetingNotes.presentMentees,
      });

      if (response.data.meeting) {
        // Update attendance records
        console.log("Meeting report submitted successfully:", response.data);
        await axios.post("/api/mentee/meetings-attended", {
          mentor_id: mentorData.MUJid,
          meeting_id: selectedMeeting.meeting.meeting_id,
          presentMentees: meetingNotes.presentMentees,
          totalMentees: selectedMeeting.meeting?.mentee_ids,
        });

        // Update meetings in state
        setMeetings((prevMeetings) => {
          const updatedMeetings = prevMeetings.map((meeting) => {
            if (
              meeting.meeting.meeting_id === selectedMeeting.meeting.meeting_id
            ) {
              return {
                ...meeting,
                meeting: {
                  ...meeting.meeting,
                  meeting_notes: meetingNotes,
                  present_mentees: meetingNotes.presentMentees,
                  isReportFilled: true,
                },
              };
            }
            return meeting;
          });

          // Update session storage with new meeting data
          sessionStorage.setItem(
            "meetingData",
            JSON.stringify(updatedMeetings)
          );
          return updatedMeetings;
        });

        // Clear the form and close the modal
        setSelectedMeeting(null);
        setMeetingNotes({
          TopicOfDiscussion: "",
          TypeOfInformation: "",
          NotesToStudent: "",
          issuesRaisedByMentee: "",
          outcome: "",
          closureRemarks: "",
          feedbackFromMentee: "",
          presentMentees: [],
        });

        // Show success message
      }
    } catch (error) {
      console.error("Error submitting meeting notes:", error);
      // alert("Failed to submit meeting report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function to refresh meetings data
  const refreshMeetings = async () => {
    setMeetingsLoading(true);
    try {
      // Get primary semester (4 for Jan-June, 3 for July-Dec)
      const primarySemester =
        mentorData?.academicSession &&
        mentorData?.academicSession.includes("JANUARY-JUNE")
          ? 4
          : 3;

      // Fetch primary semester meetings first
      let primaryMeetings = await fetchMeetingsForSemester(
        mentorData.MUJid,
        mentorData.academicYear,
        mentorData.academicSession,
        primarySemester
      );

      // Ensure primaryMeetings is an array
      primaryMeetings = Array.isArray(primaryMeetings) ? primaryMeetings : [];

      // Set initial meetings
      setMeetings(primaryMeetings);
      sessionStorage.setItem("meetingData", JSON.stringify(primaryMeetings));

      // Fetch other semesters in background
      const otherSemesters =
        mentorData?.academicSession &&
        mentorData?.academicSession.includes("JANUARY-JUNE")
          ? [2, 6, 8]
          : [1, 5, 7];

      const allMeetingsPromises = otherSemesters.map((semester) =>
        fetchMeetingsForSemester(
          mentorData.MUJid,
          mentorData.academicYear,
          mentorData.academicSession,
          semester
        )
      );

      const otherSemesterMeetings = await Promise.all(allMeetingsPromises);
      const flattenedMeetings = [
        ...primaryMeetings,
        ...otherSemesterMeetings.flat().filter(Boolean),
      ];

      setMeetings(flattenedMeetings);
      sessionStorage.setItem("meetingData", JSON.stringify(flattenedMeetings));
    } catch (error) {
      console.error("Error refreshing meetings:", error);
    } finally {
      setMeetingsLoading(false);
    }
  };

  // Modify the useEffect that handles meeting data to use the refreshMeetings function
  useEffect(() => {
    if (!mentorData.isFirstTimeLogin) {
      refreshMeetings();
    }
  }, [mentorData.isFirstTimeLogin]);

  useEffect(() => {
    if (mentorData?.academicSession) {
      // Set default semester based on academic session
      const defaultSemester = mentorData?.academicSession.includes(
        "JANUARY-JUNE"
      )
        ? 4
        : 3;
      setActiveTab(defaultSemester);
    }
  }, [mentorData?.academicSession]);

  const getEmailBody = (meeting) => `
Dear Mentees,

A mentor meeting has been scheduled with the following details:

Meeting ID: ${meeting.meeting.meeting_id}
Date: ${meeting.meeting.meeting_date}
Time: ${meeting.meeting.meeting_time}
Topic: ${meeting.meeting.meeting_notes.TopicOfDiscussion || "N/A"}
Meeting Type: ${
    meeting.meeting.meeting_notes.isMeetingOnline ? "Online" : "Offline"
  }
${meeting.meeting.meeting_notes.isMeetingOnline ? "Meeting Link" : "Venue"}: ${
    meeting.meeting.meeting_notes.venue
  }
Branch: ${"CSE CORE"}
Semester: ${meeting.semester}


Please ensure your attendance for this mentor meeting. If you have any conflicts or concerns, kindly inform me in advance.

Best regards,
${mentorData?.name || "Your Mentor"}
${mentorData?.designation || "Faculty Mentor"}
Department of Computer Science and Engineering
Manipal University Jaipur
Contact: ${mentorData?.email || ""}`;

  const sendEmailToMentees = async (meeting) => {
    setIsLoading(true);
    try {
      const responsePromise = fetch(
        `/api/meeting/mentees?mentorId=${mentorData.MUJid}&semester=${meeting.semester}&section=${meeting.section}&year=${mentorData.academicYear}&session=${mentorData.academicSession}`
      );
      const response = await responsePromise;
      if (response.ok) {
        const menteesData = await response.json();
        const menteeEmails = menteesData.map((mentee) => mentee.email);

        const emailResponse = await axios.post("/api/meeting/send-email", {
          emails: menteeEmails,
          subject: `Meeting Reminder - ${meeting.meeting.meeting_id}`,
          body: getEmailBody(meeting),
          meetingId: meeting.meeting.meeting_id, // Add meeting ID to track emails
        });

        if (emailResponse.data.success) {
          setShowToast(true);
          // Show number of times emails were sent for this meeting
          alert(
            `Reminder email #${emailResponse.data.totalEmailsSent} sent successfully to ${emailResponse.data.sentCount} recipients`
          );
          setTimeout(() => setShowToast(false), 5000);
        } else {
          throw new Error(emailResponse.data.message);
        }
      } else {
        throw new Error("Failed to fetch mentees");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      alert(`Failed to send reminder emails: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAllPresent = () => {
    if (!selectedMeeting?.menteeDetails) return;

    setMeetingNotes((prev) => ({
      ...prev,
      presentMentees: selectedMeeting.menteeDetails.map((m) => m.MUJid),
    }));
  };

  const handleAttendanceSubmit = async () => {
    try {
      // Update in database
      await axios.post("/api/meeting/mentors/reportmeeting", {
        mentor_id: mentorData.MUJid,
        meeting_id: selectedMeeting.meeting.meeting_id,
        meeting_notes: {
          ...meetingNotes,
          presentMentees: meetingNotes.presentMentees,
        },
      });

      // Update in session storage
      const meetingData = JSON.parse(
        sessionStorage.getItem("meetingData") || "[]"
      );
      const updatedMeetings = meetingData.map((meeting) => {
        if (meeting.meeting.meeting_id === selectedMeeting.meeting.meeting_id) {
          return {
            ...meeting,
            meeting: {
              ...meeting.meeting,
              present_mentees: meetingNotes.presentMentees,
            },
          };
        }
        return meeting;
      });
      sessionStorage.setItem("meetingData", JSON.stringify(updatedMeetings));

      // Close the dialog
      setShowAttendance(false);

      // Show success toast or notification
      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    }
  };

  const cards = [
    {
      title: "View Mentees",
      icon: "👨‍🎓",
      description: "View and manage assigned mentees",
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      shadowColor: "rgba(251, 146, 60, 0.4)",
      onClick: () => router.push("/pages/viewmentee"), // Updated path
    },
    {
      title: "Schedule Meeting",
      icon: "📅",
      description: "Create and schedule new meetings",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      shadowColor: "rgba(244, 63, 94, 0.4)",
      onClick: () => router.push("/pages/meetings/schmeeting"), // Updated path
    },
    //DISABLED CURRENTLY
    // {
    //     title: 'Submit Meeting Report',
    //     icon: '📝',
    //     description: 'Add and update meeting details',
    //     gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    //     shadowColor: 'rgba(59, 130, 246, 0.4)',
    //     onClick: () => router.push('/pages/meetings/addmeetinginfo')
    // },
    // {
    //     title: 'Download Meeting Report',
    //     icon: '📊',
    //     description: 'Generate and manage meeting reports',
    //     gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    //     shadowColor: 'rgba(147, 51, 234, 0.4)',
    //     onClick: () => router.push('/pages/meetings/reportmeetings') // Updated path
    // },
    {
      title: "Consolidated Meeting Report",
      icon: "📊",
      description: "Generate Consolidated meeting reports",
      gradient: "from-purple-500 via-violet-500 to-indigo-500",
      shadowColor: "rgba(147, 51, 234, 0.4)",
      onClick: () => router.push("/pages/mentordashboard/consolidatedReport"), // Updated path
    },

    //DISABLED CURRENTLY
    // {
    //     title: 'Student Queries',
    //     icon: '❓',
    //     description: 'Handle mentee questions and concerns',
    //     gradient: 'from-green-500 via-emerald-500 to-teal-500',
    //     shadowColor: 'rgba(16, 185, 129, 0.4)',
    //     onClick: () => router.push('/pages/squery')
    // }
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-[#0a0a0a] flex items-center justify-center'>
        <div className='text-white'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#0a0a0a] overflow-hidden relative'>
      {/* Enhanced Background Effects */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
        <div className='absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
        <div className='absolute inset-0 backdrop-blur-3xl' />
      </div>

      <Navbar />
      {/* {console.log("mentor3:",mentorData)} */}
      {mentorData?.isFirstTimeLogin ? (
        <div className='relative z-10 container mx-auto px-4 pt-20'>
          <FirstTimeLoginForm
            mentorData={mentorData}
            onSubmitSuccess={() =>
              setMentorData({ ...mentorData, isFirstTimeLogin: false })
            }
          />
        </div>
      ) : (
        <div className='relative z-10 px-4 md:px-6 pt-20 pb-10'>
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-8'>
            <motion.h1
              className='text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              Mentor Dashboard
            </motion.h1>
            <motion.p
              className='text-gray-300 text-lg md:text-xl max-w-2xl mx-auto'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}>
              Manage your mentees and mentorship activities
            </motion.p>
          </motion.div>

          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Cards Grid */}
            <motion.div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:max-w-[50%] w-full'>
              {cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1 },
                  }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: `0 0 30px ${card.shadowColor}`,
                  }}
                  className={`
                                relative overflow-hidden
                                bg-gradient-to-br ${card.gradient}
                                rounded-lg p-4
                                cursor-pointer
                                transition-all duration-500
                                border border-white/10
                                backdrop-blur-sm
                                hover:border-white/20
                            `}
                  onClick={card.onClick}>
                  <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity' />
                  <span className='text-3xl mb-3 block'>{card.icon}</span>
                  <h3 className='text-lg font-bold text-white mb-2'>
                    {card.title}
                  </h3>
                  <p className='text-white/80 text-sm'>{card.description}</p>
                  <div className='absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:w-24 group-hover:h-24 transition-all' />
                </motion.div>
              ))}
            </motion.div>

            {/* Upcoming Meetings Section */}
            <motion.div
              className={`lg:max-w-[50%] w-full ${
                meetings.length > 0 ? "" : "hidden lg:block"
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                backgroundImage:
                  !meetingsLoading && meetings.length === 0
                    ? 'url("/MUJ-homeCover.jpg")'
                    : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                borderRadius: "1rem",
              }}>
              <div className='bg-white/10 rounded-lg p-6 backdrop-blur-sm overflow-y-auto max-h-[448px] custom-scrollbar'>
                {meetings.length > 0 || meetingsLoading ? (
                  <>
                    <h2 className='text-2xl font-bold text-white mb-4'>
                      Upcoming Meetings
                    </h2>
                    <div className='mb-4 border-b border-gray-700'>
                      <div className='flex overflow-x-auto space-x-4 custom-scrollbar'>
                        {getAllSemesters(mentorData.academicSession).map(
                          (semester) => (
                            <button
                              key={semester}
                              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                                activeTab === semester
                                  ? "bg-white/10 text-white border-b-2 border-orange-500"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                              }`}
                              onClick={() => setActiveTab(semester)}>
                              Semester {semester}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div className='space-y-4'>
                      {activeTab &&
                        (groupBySemester(meetings)[activeTab]?.length > 0 ? (
                          groupBySemester(meetings)[activeTab]?.map(
                            (meeting, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: { delay: index * 0.1 },
                                }}
                                className='bg-white/5 p-4 rounded-lg'>
                                {console.log(
                                  "meeting:",
                                  meeting.meeting.meeting_notes.isMeetingOnline
                                )}
                                <div className='text-white flex justify-between'>
                                  <div>
                                    <div className='space-y-2'>
                                      <p>
                                        Meeting Topic:{" "}
                                        {
                                          meeting.meeting.meeting_notes
                                            .TopicOfDiscussion
                                        }
                                      </p>
                                    </div>

                                    <p>Semester: {meeting.semester}</p>
                                    <p>
                                      Date:{" "}
                                      {new Date(
                                        meeting.meeting.meeting_date
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        ordinal: true,
                                      })}
                                    </p>
                                    <p>Time: {meeting.meeting.meeting_time}</p>
                                    {meeting.meeting.meeting_notes
                                      .isMeetingOnline ? (
                                      <p className='flex items-center space-x-2'>
                                        <span className='text-gray-300'>
                                          Link:{" "}
                                        </span>
                                        {meeting?.meeting?.meeting_notes
                                          ?.venue &&
                                        meeting?.meeting?.meeting_notes?.venue.includes(
                                          "https:"
                                        ) ? (
                                          <a
                                            href={`${meeting.meeting.meeting_notes.venue}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                                          text-blue-400 hover:text-blue-300 rounded-md transition-all duration-200 group'>
                                            <span className='truncate max-w-[200px]'>
                                              {
                                                meeting.meeting.meeting_notes
                                                  .venue
                                              }
                                            </span>
                                            <svg
                                              className='w-4 h-4 transform group-hover:translate-x-1 transition-transform'
                                              fill='none'
                                              viewBox='0 0 24 24'
                                              stroke='currentColor'>
                                              <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M10 6H6a2 2h10a2 2v-4M14 4h6m0 0v6m0-6L10 14'
                                              />
                                            </svg>
                                          </a>
                                        ) : (
                                          <a
                                            href={`https://${meeting.meeting.meeting_notes.venue}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                                          text-blue-400 hover:text-blue-300 rounded-md transition-all duration-200 group'>
                                            <span className='truncate max-w-[200px]'>
                                              {
                                                meeting.meeting.meeting_notes
                                                  .venue
                                              }
                                            </span>
                                            <svg
                                              className='w-4 h-4 transform group-hover:translate-x-1 transition-transform'
                                              fill='none'
                                              viewBox='0 0 24 24'
                                              stroke='currentColor'>
                                              <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M10 6H6a2 2h10a2 2v-4M14 4h6m0 0v6m0-6L10 14'
                                              />
                                            </svg>
                                          </a>
                                        )}
                                      </p>
                                    ) : (
                                      <p>
                                        Venue:{" "}
                                        {meeting.meeting.meeting_notes.venue}
                                      </p>
                                    )}
                                  </div>
                                  <div className='border-r-2 h-full'></div>
                                  <div className='my-auto'>
                                    {new Date(meeting.meeting.meeting_date) <=
                                    new Date() ? (
                                      <>
                                        {!meeting.meeting.isReportFilled &&
                                          new Date(
                                            meeting.meeting.meeting_date
                                          ) <= new Date() && (
                                            <button
                                              onClick={() => {
                                                setSelectedMeeting(meeting);
                                                setMeetingNotes({
                                                  TopicOfDiscussion:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.TopicOfDiscussion || "",
                                                  TypeOfInformation: "",
                                                  NotesToStudent: "",
                                                  issuesRaisedByMentee: "",
                                                  feedbackFromMentee: "",
                                                  outcome: "",
                                                  closureRemarks: "",
                                                  presentMentees: [],
                                                  isMeetingOnline:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.isMeetingOnline,
                                                  venue:
                                                    meeting?.meeting
                                                      ?.meeting_notes?.venue,
                                                });
                                              }}
                                              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors'>
                                              Submit Report
                                            </button>
                                          )}
                                        {meeting.meeting.isReportFilled && (
                                          <div className=''>
                                            <button
                                              onClick={() => {
                                                setSelectedMeeting(meeting);
                                                setMeetingNotes({
                                                  TopicOfDiscussion:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.TopicOfDiscussion || "",
                                                  TypeOfInformation:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.TypeOfInformation || "",
                                                  NotesToStudent:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.NotesToStudent || "",
                                                  issuesRaisedByMentee:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.issuesRaisedByMentee ||
                                                    "",
                                                  feedbackFromMentee:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.feedbackFromMentee ||
                                                    "",
                                                  outcome:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.outcome || "",
                                                  closureRemarks:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.closureRemarks || "",
                                                  presentMentees:
                                                    meeting?.meeting
                                                      ?.present_mentees || [],
                                                  isMeetingOnline:
                                                    meeting?.meeting
                                                      ?.meeting_notes
                                                      ?.isMeetingOnline,
                                                  venue:
                                                    meeting?.meeting
                                                      ?.meeting_notes?.venue,
                                                });
                                              }}
                                              className='mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors block w-[100%]'>
                                              Edit Report
                                            </button>

                                            {isClientSide && (
                                              <PDFDownloadComponent
                                                key={meeting.meeting.meeting_id}
                                                page={`MentorDashboard`}
                                                document={generateMOMPdf(
                                                  {
                                                    ...meeting.meeting,
                                                    section: meeting.section,
                                                    semester: meeting.semester,
                                                    academicYear:
                                                      mentorData.academicYear,
                                                    menteeDetails:
                                                      meeting?.menteeDetails,
                                                  },
                                                  mentorData.name
                                                )}
                                                fileName={`MOM_${meeting.meeting.meeting_notes.TopicOfDiscussion}.pdf`}>
                                                <div
                                                  className='mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer text-center'
                                                  role='button'>
                                                  Download MOM Report
                                                </div>
                                              </PDFDownloadComponent>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className='flex flex-col gap-2'>
                                        <div className='text-red-500 text-center'>
                                          Meeting not held yet
                                        </div>
                                        <button
                                          onClick={() =>
                                            sendEmailToMentees(meeting)
                                          }
                                          className='bg-blue-500 text-center hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors'
                                          disabled={isLoading}>
                                          {isLoading ? (
                                            <div className='m-auto animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white'></div>
                                          ) : (
                                            "Resend Meeting Email"
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          )
                        ) : (
                          <div className='text-center py-8 text-gray-400'>
                            No meetings scheduled for Semester {activeTab}
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className='flex flex-col items-center justify-center space-y-4'></div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
      {selectedMeeting && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
          onClick={() => setSelectedMeeting(null)}>
          <div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl w-full max-w-6xl relative border border-gray-700 shadow-2xl'
            onClick={(e) => e.stopPropagation()}>
            <div className='sticky top-0 z-10 bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-t-xl border-b border-gray-700 flex justify-between items-center'>
              <h2 className='text-2xl font-bold text-white'>Meeting Notes</h2>
              <button
                className='text-gray-400 hover:text-white transition-colors'
                onClick={() => setSelectedMeeting(null)}>
                <FiX size={24} />
              </button>
            </div>
            <div className='p-6 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Left Column */}
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Topic of Discussion
                    </label>
                    <input
                      type='text'
                      name='TopicOfDiscussion'
                      value={meetingNotes.TopicOfDiscussion}
                      disabled={true}
                      className='w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white/70'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Type of Information
                    </label>
                    <textarea
                      rows='3'
                      name='TypeOfInformation'
                      value={meetingNotes.TypeOfInformation}
                      onChange={handleMeetingNotesChange}
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Notes to Student
                    </label>
                    <textarea
                      rows='3'
                      name='NotesToStudent'
                      value={meetingNotes.NotesToStudent}
                      onChange={handleMeetingNotesChange}
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white'
                    />
                  </div>

                  <Button
                    onClick={() => setShowAttendance(true)}
                    variant='contained'
                    fullWidth
                    sx={{
                      mt: 2,
                      bgcolor: "#f97316",
                      "&:hover": { bgcolor: "#ea580c" },
                    }}>
                    Mark Attendance
                  </Button>
                </div>

                {/* Right Column */}
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Issues Raised/Resolved
                    </label>
                    <textarea
                      rows='3'
                      name='issuesRaisedByMentee'
                      value={meetingNotes.issuesRaisedByMentee}
                      onChange={handleMeetingNotesChange}
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                      placeholder='Enter issues...'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Outcome
                    </label>
                    <textarea
                      rows='3'
                      name='outcome'
                      value={meetingNotes.outcome}
                      onChange={handleMeetingNotesChange}
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                      placeholder='Enter outcome...'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Closure Remarks
                    </label>
                    <input
                      type='text'
                      name='closureRemarks'
                      value={meetingNotes.closureRemarks}
                      onChange={handleMeetingNotesChange}
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                      placeholder='Enter remarks...'
                    />
                  </div>
                </div>

                {/* Attendance Dialog */}
                <AttendanceDialog
                  open={showAttendance}
                  onClose={() => setShowAttendance(false)}
                  mentees={selectedMeeting?.menteeDetails || []}
                  presentMentees={meetingNotes.presentMentees}
                  onUpdateAttendance={(mujId) => {
                    setMeetingNotes((prev) => ({
                      ...prev,
                      presentMentees:
                        prev?.presentMentees &&
                        prev?.presentMentees.includes(mujId)
                          ? prev.presentMentees.filter((id) => id !== mujId)
                          : [...prev.presentMentees, mujId],
                    }));
                  }}
                  onSelectAll={handleSelectAllPresent}
                  onSubmit={handleAttendanceSubmit}
                />
              </div>
              <div className='space-y-2 mt-6'>
                <label className='block text-sm font-medium text-gray-300'>
                  Feedback from Mentee (Optional)
                </label>
                <textarea
                  rows='3'
                  name='feedbackFromMentee'
                  value={meetingNotes.feedbackFromMentee}
                  onChange={handleMeetingNotesChange}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                  placeholder='Enter mentee feedback (optional)...'
                />
              </div>{" "}
            </div>{" "}
            <div className='sticky bottom-0 z-10 bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-b-xl border-t border-gray-700'>
              <button
                onClick={handleMeetingSubmit}
                disabled={isSubmitDisabled || isSubmitting}
                className={`
                  w-full py-3 px-4 rounded-lg text-white font-medium
                  transition-all duration-200 flex items-center justify-center
                  ${
                    isSubmitDisabled
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  }
                `}>
                {isSubmitting ? (
                  <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
                ) : isSubmitDisabled ? (
                  "Please fill all required fields"
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {" "}
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black px-6 py-3 rounded-lg shadow-lg z-50 border border-green-500'>
            <span className='text-green-500 font-medium'>
              Emails sent successfully!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorDashBoard;
