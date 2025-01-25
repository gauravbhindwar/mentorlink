"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { generateMOMPdf } from "./PDFGenerator";
import { PDFDownloadComponent, ConsolidatedDocument } from "./PDFGenerator";

const MeetingReportGenerator = () => {
  const [academicYear, setAcademicYear] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  const [semester, setSemester] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [mentorMUJid, setMentorMUJid] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [consolidatedData, setConsolidatedData] = useState({});
  const [isGeneratingConsolidated, setIsGeneratingConsolidated] =
    useState(false);

  // Utility functions
  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  const generateAcademicSessions = (academicYear) => {
    if (!academicYear) return [];
    const [startYear, endYear] = academicYear.split("-");
    return [`JULY-DECEMBER ${startYear}`, `JANUARY-JUNE ${endYear}`];
  };

  // Initialize states on component mount
  useEffect(() => {
    const currentAcadYear = getCurrentAcademicYear();
    const sessions = generateAcademicSessions(currentAcadYear);
    setAcademicYear(currentAcadYear);
    setAcademicSession(sessions[0]);
    setAcademicYears([
      currentAcadYear,
      `${parseInt(currentAcadYear.split("-")[0]) - 1}-${
        parseInt(currentAcadYear.split("-")[1]) - 1
      }`,
      `${parseInt(currentAcadYear.split("-")[0]) - 2}-${
        parseInt(currentAcadYear.split("-")[1]) - 2
      }`,
    ]);
    setAcademicSessions(sessions);
  }, []);

  // Event handlers
  const handleAcademicYearChange = (e) => {
    const value = e.target.value;
    setAcademicYear(value);
    if (value.length === 4) {
      const startYear = parseInt(value);
      const endYear = startYear + 1;
      const newAcademicYear = `${startYear}-${endYear}`;
      setAcademicYear(newAcademicYear);
      const sessions = generateAcademicSessions(newAcademicYear);
      setAcademicSessions(sessions);
      setAcademicSession(sessions[0]);
    }
  };

  const handleAcademicSessionChange = (e) => {
    setAcademicSession(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  const handleMentorMUJidChange = (e) => {
    setMentorMUJid(e.target.value.toUpperCase());
  };

  const fetchMeetingsWithData = async (data) => {
    if (
      !data ||
      !data.academicYear ||
      !data.academicSession ||
      !data.semester ||
      !data.mentorMUJid
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const [startYear] = data.academicYear.split("-");
      const endYear = parseInt(startYear) + 1;
      const queryYear = data.academicSession.includes("JULY-DECEMBER")
        ? startYear
        : endYear;

      console.log("Params for meetingReport:", {
        year: queryYear,
        session: data.academicSession.trim(),
        semester: data.semester,
        mentorMUJid: data.mentorMUJid,
      });

      const response = await axios.get(
        "/api/admin/manageMeeting/meetingReport",
        {
          params: {
            year: queryYear,
            session: data.academicSession.trim(),
            semester: data.semester,
            mentorMUJid: data.mentorMUJid,
          },
        }
      );

      if (response.data?.success) {
        const meetings = response.data.reportData?.meetings || [];
        const transformedMeetings = meetings.map((meeting) => ({
          ...meeting,
          meeting_date: meeting.meeting_date || meeting.created_at,
          meeting_time:
            meeting.meeting_time ||
            new Date(meeting.created_at).toLocaleTimeString(),
          mentor_id: meeting.mentorMUJid || data.mentorMUJid,
          menteeDetails: meeting.menteeDetails || [],
          present_mentees: meeting.present_mentees || [],
        }));

        setMeetings(transformedMeetings);

        if (transformedMeetings.length === 0) {
          toast("No meetings found for the selected criteria", {
            icon: "ℹ️",
          });
        }

        const completeData = {
          meetings: transformedMeetings,
          ...data,
        };
        sessionStorage.setItem(
          "mentorMeetingsData",
          JSON.stringify(completeData)
        );
      } else {
        toast.error(response.data?.error || "Failed to fetch meetings");
        setMeetings([]);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error(error.response?.data?.error || "Failed to fetch meetings");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFDocument = () => {
    // Convert mentee_details array into a Map for quick lookups
    const menteeDetailsMap = new Map();
    meetings.forEach((meeting) => {
      meeting.menteeDetails?.forEach((mentee) => {
        if (!menteeDetailsMap.has(mentee.MUJid)) {
          menteeDetailsMap.set(mentee.MUJid, {
            MUJid: mentee.MUJid,
            name: mentee.name,
            semester: semester,
            meetingsCount: 0,
            mentorRemarks: mentee.mentorRemarks || "",
          });
        }
      });
    });

    // Count meeting attendance for each mentee
    meetings.forEach((meeting) => {
      const presentMentees = meeting.present_mentees || [];
      presentMentees.forEach((menteeMUJid) => {
        if (menteeDetailsMap.has(menteeMUJid)) {
          const mentee = menteeDetailsMap.get(menteeMUJid);
          mentee.meetingsCount = (mentee.meetingsCount || 0) + 1;
          menteeDetailsMap.set(menteeMUJid, mentee);
        }
      });
    });

    // Convert Map back to array
    const processedMentees = Array.from(menteeDetailsMap.values());

    try {
      return (
        <ConsolidatedDocument
          meetings={meetings}
          mentorName={mentorName}
          mentees={processedMentees}
          selectedSemester={semester}
        />
      );
    } catch (error) {
      console.error("Error in generatePDFDocument:", error);
      toast.error("Error generating consolidated report");
      return null;
    }
  };
  // Render components
  const renderFilterControls = () => (
    <div className='bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 h-full'>
      <h2 className='text-xl font-semibold text-white mb-4 lg:mb-6'>Filters</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = {
            academicYear,
            academicSession,
            semester,
            mentorMUJid,
          };
          fetchMeetingsWithData(data);
        }}
        className='space-y-4 lg:space-y-6'>
        <div>
          <label className='block text-sm font-medium text-white mb-2'>
            Academic Year
          </label>
          <input
            type='text'
            list='academicYears'
            placeholder='YYYY-YYYY'
            value={academicYear}
            onChange={handleAcademicYearChange}
            className='w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all'
          />
          <datalist id='academicYears'>
            {academicYears.map((year, index) => (
              <option key={index} value={year} />
            ))}
          </datalist>
        </div>

        <div>
          <label className='block text-sm font-medium text-white mb-2'>
            Academic Session
          </label>
          <input
            type='text'
            list='academicSessions'
            placeholder='MONTH-MONTH YYYY'
            value={academicSession}
            onChange={handleAcademicSessionChange}
            className='w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all'
          />
          <datalist id='academicSessions'>
            {academicSessions.map((session, index) => (
              <option key={index} value={session} />
            ))}
          </datalist>
        </div>

        <div>
          <label className='block text-sm font-medium text-white mb-2'>
            Semester
          </label>
          <input
            type='text'
            placeholder='Enter Semester'
            value={semester}
            onChange={handleSemesterChange}
            className='w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-white mb-2'>
            Mentor MUJ ID
          </label>
          <input
            type='text'
            placeholder='Enter Mentor MUJ ID'
            value={mentorMUJid}
            onChange={handleMentorMUJidChange}
            className='w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all'
          />
        </div>

        <div className='pt-6 mt-auto'>
          <button
            type='submit'
            className='w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50'
            disabled={loading}>
            {loading ? "Fetching..." : "Fetch Meetings"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderAttendeeCount = (meeting) => (
    <div className='text-center min-w-[80px]'>
      <span className='text-sm font-medium text-white/90'>Attendees</span>
      <div className='flex flex-col gap-1 mt-1'>
        <p className='text-sm text-white bg-white/5 px-3 py-2 rounded'>
          {meeting.present_mentees?.length || 0} /{" "}
          {meeting.mentee_ids?.length || 0}
        </p>
        <span
          className={`text-xs ${
            ((meeting.present_mentees?.length || 0) /
              (meeting.mentee_ids?.length || 1)) *
              100 >=
            75
              ? "text-green-400"
              : "text-orange-400"
          }`}>
          {Math.round(
            ((meeting.present_mentees?.length || 0) /
              (meeting.mentee_ids?.length || 1)) *
              100
          )}
          % attended
        </span>
      </div>
    </div>
  );

  const renderMeetingCard = (meeting, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className='bg-white/10 backdrop-blur-md rounded-xl p-4 hover:bg-white/15 transition-all flex flex-col'>
      {/* Meeting Card Header */}
      <div className='flex items-center justify-between mb-3 pb-3 border-b border-white/10'>
        <div className='flex gap-3 items-center'>
          <span className='text-sm font-medium text-white'>#{index + 1}</span>
          <span className='text-sm text-white/90'>
            {new Date(meeting.meeting_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className='text-sm text-white/90 bg-white/5 px-3 py-1 rounded-full'>
            {meeting.meeting_time}
          </span>
        </div>
      </div>

      {/* Meeting Info */}
      <div className='grid grid-cols-2 gap-4 mb-3'>
        <div>
          <span className='text-sm font-medium text-white/90'>Meeting ID</span>
          <p className='text-sm text-white bg-white/5 p-2 rounded mt-1 truncate'>
            {meeting.meeting_id || "N/A"}
          </p>
        </div>
        <div>
          <span className='text-sm font-medium text-white/90'>Mentor ID</span>
          <p className='text-sm text-white bg-white/5 p-2 rounded mt-1 truncate'>
            {meeting.mentor_id || mentorMUJid || "N/A"}
          </p>
        </div>
      </div>

      {/* Topic and Attendees */}
      <div className='flex justify-between items-start gap-4 mb-4'>
        <div className='flex-1'>
          <span className='text-sm font-medium text-white/90'>Topic</span>
          <p className='text-sm text-white bg-white/5 p-2 rounded mt-1 line-clamp-2'>
            {meeting.meeting_notes?.TopicOfDiscussion || "N/A"}
          </p>
        </div>
        {renderAttendeeCount(meeting)}
      </div>

      {/* Dynamic MOM Button */}
      <div className='flex gap-3 mt-auto pt-3 border-t border-white/10'>
        <PDFDownloadComponent
          document={generateMOMPdf(
            {
              ...meeting,
              semester,
              menteeDetails: meeting.menteeDetails
                .filter((mentee) =>
                  meeting.present_mentees.includes(mentee.MUJid)
                )
                .map((mentee) => ({
                  MUJid: mentee.MUJid,
                  name: mentee.name,
                  mujId: mentee.MUJid, // Add this line to ensure registration number is passed
                })),
              meeting_notes: meeting.meeting_notes || {},
            },
            mentorName
          )}
          fileName={`MOM_${meeting.meeting_id}_${new Date().toLocaleDateString(
            "en-US"
          )}.pdf`}>
          {`MOM ${index + 1}`}
        </PDFDownloadComponent>
      </div>
    </motion.div>
  );

  const renderMeetingsContent = () => (
    <div className='h-full flex flex-col bg-white/10 backdrop-blur-md rounded-2xl'>
      <div className='p-4 lg:p-6 border-b border-white/10'>
        <h2 className='text-xl font-semibold text-white'>Meeting Reports</h2>
      </div>
      <div className='flex-1 overflow-y-auto p-4 lg:p-6 pr-2 lg:pr-4 custom-scrollbar'>
        {loading ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-white/70'>Loading...</div>
          </div>
        ) : !meetings.length ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-white/70'>No meetings found</div>
          </div>
        ) : (
          <div className='space-y-4 lg:space-y-6'>
            {" "}
            {/* Removed pb-16 */}
            <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3 lg:gap-4'>
              {meetings.map((meeting, index) =>
                renderMeetingCard(meeting, index)
              )}
            </div>
            {/* Consolidated Report Button - Show in both mobile and desktop */}
            {meetings.length >= 3 ? (
              <PDFDownloadComponent
                document={generatePDFDocument()}
                page={`consolidatedReport`}
                fileName={`consolidated_report_${mentorName.replace(
                  /\s+/g,
                  "_"
                )}_sem${semester}.pdf`}>
                <div className='w-full flex items-center justify-center px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium shadow-lg transition-all duration-300'>
                  <svg
                    className='w-5 h-5 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                    />
                  </svg>
                  Download PDF Report
                </div>
              </PDFDownloadComponent>
            ) : meetings.length > 0 ? (
              <div className='w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-center'>
                <span className='text-sm text-white/70'>
                  Complete {3 - meetings.length} more{" "}
                  {3 - meetings.length === 1 ? "meeting" : "meetings"} to
                  generate consolidated report
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    try {
      const storedReportData = sessionStorage.getItem("reportData");
      if (storedReportData) {
        const reportData = JSON.parse(storedReportData);

        // Set mentor details if available
        if (reportData.meetings?.[0]) {
          const mentorDetails = reportData.meetings[0];
          setMentorName(mentorDetails.mentorName || "");
          setMentorMUJid(mentorDetails.MUJid || "");
        }

        // Safely set the state values
        setAcademicYear(reportData.academicYear || getCurrentAcademicYear());
        setAcademicSession(reportData.academicSession || "");
        setSemester(reportData.semester || "");

        // Initialize meetings array if available
        if (Array.isArray(reportData.meetings)) {
          setMeetings(reportData.meetings);
        }

        // Set academic sessions based on the academic year
        if (reportData.academicYear) {
          const sessions = generateAcademicSessions(reportData.academicYear);
          setAcademicSessions(sessions);
        }

        // After setting all data, automatically fetch meetings
        const fetchData = {
          academicYear: reportData.academicYear || getCurrentAcademicYear(),
          academicSession: reportData.academicSession || "",
          semester: reportData.semester || "",
          mentorMUJid:
            reportData.mentorMUJid || reportData.meetings?.[0]?.MUJid || "",
        };

        if (
          fetchData.academicYear &&
          fetchData.academicSession &&
          fetchData.semester &&
          fetchData.mentorMUJid
        ) {
          fetchMeetingsWithData(fetchData);
        }
      }

      // Clean up storage after loading
      sessionStorage.removeItem("reportData");
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  }, []);

  return (
    <>
      <Toaster position='top-right' />
      <div className='min-h-screen bg-[#0a0a0a] overflow-y-auto'>
        <div className='absolute inset-0 z-0'>
          {/* Background effects */}
          <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
          <div className='absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>

        <div className='relative z-10 container mx-auto px-4 h-[calc(100vh-4rem)] pt-16'>
          <h1 className='text-3xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-3 text-center mt-2'>
            Meeting Report Generator
          </h1>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full'>
            <div className='lg:col-span-3'>
              <div className='bg-white/8 px-4 rounded-2xl h-full'>
                {renderFilterControls()}
              </div>
            </div>

            <div className='lg:col-span-9 flex flex-col h-full'>
              <div className='flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar space-y-4'>
                {renderMeetingsContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingReportGenerator;
