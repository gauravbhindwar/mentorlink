"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/subComponents/Navbar";
import FirstTimeLoginForm from "./FirstTimeLoginForm";
// import Image from 'next/image'
import { FiX } from "react-icons/fi";
import axios from "axios";
import { generateMOMPdf } from "@/components/Meetings/PDFGenerator";
import { PDFDownloadComponent } from "@/components/Meetings/PDFGenerator";

// Add this new memoized component outside the main component
const MemoizedPDFDownload = React.memo(
  ({ meeting, mentorData }) => {
    return (
      <PDFDownloadComponent
        page='MentorDashboard'
        document={generateMOMPdf(
          {
            ...meeting.meeting,
            section: meeting.section,
            semester: meeting.semester,
            academicYear: mentorData.academicYear,
            menteeDetails: meeting?.menteeDetails,
          },
          mentorData.name
        )}
        fileName={`MOM_${meeting.meeting.meeting_notes.TopicOfDiscussion}.pdf`}>
        <button className='mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors'>
          Download MOM Report
        </button>
      </PDFDownloadComponent>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.meeting.meeting.meeting_id ===
        nextProps.meeting.meeting.meeting_id &&
      prevProps.mentorData.name === nextProps.mentorData.name
    );
  }
);

// Add display name
MemoizedPDFDownload.displayName = "MemoizedPDFDownload";

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

  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        const sessionData = sessionStorage.getItem("mentorData");
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          setMentorData(parsedData);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/mentor");
        if (response.ok) {
          const data = await response.json();
          console.log("Mentor data:", data);
          if (!data.isFirstTimeLogin) {
            sessionStorage.setItem(
              "mentorData",
              JSON.stringify(extractSessionData(data))
            );
          }
          setMentorData(data);
        }
      } catch (error) {
        console.error("Error fetching mentor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, []);

  // Add this helper function before the component
  const mergeMeetings = (meetings) => {
    return meetings.reduce((acc, meeting) => {
      const existingMeeting = acc.find(
        (m) => m.meeting.meeting_id === meeting.meeting.meeting_id
      );
      if (existingMeeting) {
        existingMeeting.sections.push(meeting.section);
      } else {
        acc.push({ ...meeting, sections: [meeting.section] });
      }
      return acc;
    }, []);
  };

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

  // Replace the meetings fetch useEffect with this updated version
  useEffect(() => {
    const fetchMeetings = async () => {
      if (
        !mentorData.MUJid ||
        !mentorData.academicYear ||
        !mentorData.academicSession
      )
        return;
      setMeetingsLoading(true);
      try {
        const response = await fetch(
          `/api/mentor/manageMeeting?mentorId=${mentorData.MUJid}&academicYear=${mentorData.academicYear}&session=${mentorData.academicSession}`
        );
        if (response.ok) {
          const data = await response.json();
          const mergedMeetings = mergeMeetings(data.meetings);

          if (mergedMeetings.length > 0) {
            if (sessionStorage.getItem("meetingData")) {
              sessionStorage.removeItem("meetingData");
            }
            sessionStorage.setItem(
              "meetingData",
              JSON.stringify(mergedMeetings)
            );
            setMeetings(mergedMeetings);
          }
          setMeetingsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
      } finally {
        setMeetingsLoading(false);
      }
    };

    if (!mentorData.isFirstTimeLogin) {
      fetchMeetings();
    }
  }, [mentorData]);

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

  // const handleMenteeCheck = (e, index, MUJid) => {
  //   if (e.target.checked) {
  //     setMeetingNotes((prevNotes) => ({
  //       ...prevNotes,
  //       presentMentees: [...prevNotes.presentMentees, MUJid],
  //     }));
  //   } else {
  //     setMeetingNotes((prevNotes) => ({
  //       ...prevNotes,
  //       presentMentees: prevNotes.presentMentees.filter((id) => id !== MUJid),
  //     }));
  //   }
  // };

  // Update the handleMeetingSubmit function
  const handleMeetingSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/meeting/mentors/reportmeeting", {
        mentor_id: mentorData.MUJid,
        meeting_id: selectedMeeting.meeting.meeting_id,
        meeting_notes: meetingNotes,
        presentMentees: meetingNotes.presentMentees,
      });
      console.log("Meeting notes submitted successfully", selectedMeeting);
      await axios.post("/api/mentee/meetings-attended", {
        meeting_id: selectedMeeting.meeting.meeting_id,
        presentMentees: meetingNotes.presentMentees,
        totalMentees: selectedMeeting.meeting?.mentee_ids,
      });
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
      setMeetingsLoading(true);
      const updatedMeetings = await fetch(
        `/api/mentor/manageMeeting?mentorId=${mentorData.MUJid}&academicYear=${mentorData.academicYear}&session=${mentorData.academicSession}`
      );
      if (updatedMeetings.ok) {
        const data = await updatedMeetings.json();
        const mergedMeetings = mergeMeetings(data.meetings);
        setMeetings(mergedMeetings);
        setMeetingsLoading(false);
      }
    } catch (error) {
      console.log("Error submitting meeting notes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
${
  meeting.sections
    ? `Sections: ${[...new Set(meeting.sections)].join(", ")}`
    : `Section: ${meeting.section}`
}

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

        const emailPromises = menteeEmails.map(async (email) => {
          const response = await axios.post("/api/meeting/send-email", {
            email,
            subject: `Meeting Reminder - ${meeting.meeting.meeting_id}`,
            body: getEmailBody(meeting),
          });
          return response;
        });
        await Promise.all(emailPromises);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } else {
        throw new Error("Failed to fetch mentees");
      }
      // alert('Reminder emails sent successfully!');
    } catch (error) {
      console.error("Error sending emails:", error);
      alert("Failed to send reminder emails");
    } finally {
      setIsLoading(false);
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
                {meetingsLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                  </div>
                ) : meetings.length > 0 ? (
                  <>
                    <h2 className='text-2xl font-bold text-white mb-4'>
                      Upcoming Meetings
                    </h2>
                    {Object.entries(groupBySemester(meetings))
                      .sort(([semA], [semB]) => semA - semB)
                      .map(([semester, semesterMeetings]) => (
                        <div key={semester} className='mb-6'>
                          <h3 className='text-xl font-semibold text-white mb-3 border-b border-white/20 pb-2'>
                            Semester {semester}
                          </h3>
                          <div className='space-y-4'>
                            {semesterMeetings.map((meeting, index) => (
                              // ... existing meeting card code ...
                              // Keep the existing meeting card code unchanged
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: { delay: index * 0.1 },
                                }}
                                className='bg-white/5 p-4 rounded-lg'>
                                {/* Keep the existing meeting card content */}
                                {console.log(
                                  "meeting:",
                                  meeting.meeting.meeting_notes.isMeetingOnline
                                )}
                                <div className='text-white flex justify-between'>
                                  <div>
                                    <p>
                                      Meeting Topic:{" "}
                                      {
                                        meeting.meeting.meeting_notes
                                          .TopicOfDiscussion
                                      }
                                    </p>
                                    {/* <p className='font-semibold'>
                                      {meeting?.sections
                                        ? `Sections: ${[
                                            ...new Set(meeting?.sections),
                                          ].join(", ")}`
                                        : `Section: ${meeting.section}`}
                                    </p> */}
                                    <p>Semester: {meeting.semester}</p>
                                    <p>
                                      Date:{" "}
                                      {new Date(meeting.meeting.meeting_date)
                                        .toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                          ordinal: true,
                                        })
                                        .replace(
                                          /(\d+)(?=\s)/,
                                          (n) =>
                                            n +
                                              ["st", "nd", "rd"][
                                                (((n % 100) - 20) % 10) - 1
                                              ] || "th"
                                        )}
                                    </p>
                                    <p>Time: {meeting.meeting.meeting_time}</p>
                                    {meeting.meeting.meeting_notes
                                      .isMeetingOnline ? (
                                      <p className='flex items-center space-x-2'>
                                        <span className='text-gray-300'>
                                          Link:{" "}
                                        </span>
                                        {meeting.meeting.meeting_notes.venue.includes(
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
                                                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
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
                                                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
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
                                                });
                                              }}
                                              className='mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors block w-[100%]'>
                                              Edit Report
                                            </button>
                                            {/* {console.log(
                                              "meeting1234:",
                                              meeting?.menteeDetails
                                            )} */}
                                            {isClientSide && (
                                              <MemoizedPDFDownload
                                                meeting={meeting}
                                                mentorData={mentorData}
                                              />
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
                            ))}
                          </div>
                        </div>
                      ))}
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
            className='bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl w-full max-w-6xl relative border border-gray-700 shadow-2xl'
            onClick={(e) => e.stopPropagation()}>
            <div className='max-h-[80vh] overflow-y-auto custom-scrollbar px-2'>
              <button
                className='absolute top-4 right-4 text-gray-400 hover:text-white transition-colors'
                onClick={() => setSelectedMeeting(null)}>
                <FiX size={24} />
              </button>

              <h2 className='text-2xl font-bold mb-6 text-white text-center'>
                Meeting Notes
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-300'>
                      Topic of Discussion
                    </label>
                    <input
                      type='text'
                      name='TopicOfDiscussion'
                      value={meetingNotes.TopicOfDiscussion}
                      onChange={handleMeetingNotesChange}
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                      placeholder='Enter topic...'
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
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                      placeholder='Enter information type...'
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
                      className='w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                      placeholder='Enter notes...'
                    />
                  </div>
                </div>

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

                {selectedMeeting?.menteeDetails?.length > 0 && (
                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Attendees
                    </h3>
                    <div className='space-y-2 max-h-[330px] overflow-y-auto custom-scrollbar'>
                      {selectedMeeting.menteeDetails.map((mentee, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            const isPresent =
                              meetingNotes.presentMentees.includes(
                                mentee.MUJid
                              );
                            if (isPresent) {
                              setMeetingNotes((prev) => ({
                                ...prev,
                                presentMentees: prev.presentMentees.filter(
                                  (id) => id !== mentee.MUJid
                                ),
                              }));
                            } else {
                              setMeetingNotes((prev) => ({
                                ...prev,
                                presentMentees: [
                                  ...prev.presentMentees,
                                  mentee.MUJid,
                                ],
                              }));
                            }
                          }}
                          className='flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors'>
                          <div className='flex flex-col'>
                            <span className='text-white font-medium'>
                              {mentee.name}
                            </span>
                            <span className='text-gray-400 text-sm'>
                              Section: {mentee.section}
                            </span>
                          </div>
                          <div className='flex items-center space-x-3'>
                            <input
                              type='checkbox'
                              className='w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500'
                              checked={meetingNotes?.presentMentees.includes(
                                mentee.MUJid
                              )}
                              onChange={(e) => e.stopPropagation()} // Prevent double-firing of click event
                            />
                            <span
                              className={`text-sm font-medium ${
                                meetingNotes?.presentMentees.includes(
                                  mentee.MUJid
                                )
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}>
                              {meetingNotes?.presentMentees.includes(
                                mentee.MUJid
                              )
                                ? "Present"
                                : "Absent"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              </div>

              <button
                onClick={handleMeetingSubmit}
                disabled={isSubmitDisabled || isSubmitting}
                className={`
                                    w-full mt-6 py-3 px-4 rounded-lg text-white font-medium
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
