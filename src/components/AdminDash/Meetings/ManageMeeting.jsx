"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingComponent from "@/components/LoadingComponent";
import { DataGrid } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { toast } from "react-hot-toast";
import {
  determineAcademicPeriod,
  generateAcademicSessions,
} from "../mentee/utils/academicUtils";
import { motion } from "framer-motion";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PersonIcon from "@mui/icons-material/Person";
import CircularProgress from "@mui/material/CircularProgress";
import SendIcon from "@mui/icons-material/Send";
import Backdrop from '@mui/material/Backdrop';
import dynamic from 'next/dynamic';
import searchAnimation from '@/assets/animations/searchData.json';
import Pagination from '@mui/material/Pagination';

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: '#f97316'
    },
    background: {
      default: 'rgba(0,0,0,0.2)'
    }
  },
});

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const ManageMeeting = () => {
  const [academicYear, setAcademicYear] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  const [semester, setSemester] = useState("");
  const [mentorMeetings, setMentorMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalRows, setTotalRows] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [noData, setNoData] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' });
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [cardsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1); // Add this state for card pagination

  useEffect(() => {
    const init = async () => {
      const { academicYear: currentAcadYear, academicSession: currentSession } =
        determineAcademicPeriod();
      const sessions = generateAcademicSessions(currentAcadYear);

      // Set initial values
      setAcademicYear(currentAcadYear);
      setAcademicSession(currentSession);
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
    };

    init();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && semester) {
        handleSubmit(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [academicYear, academicSession, semester, pageSize]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // Set breakpoint at lg
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExpandCard = (mujId) => {
    setExpandedCard(expandedCard === mujId ? null : mujId);
  };

  const fetchMentorMeetings = async (
    year = academicYear,
    session = academicSession,
    sem = semester,
    pg = page,
    size = pageSize
  ) => {
    setLoading(true);
    setNoData(false); // Reset no data state
    try {
      const params = {
        year,
        session,
        semester: sem,
        page: pg,
        limit: size,
      };

      const response = await axios.get("/api/admin/manageMeeting", { params });

      if (response.data && response.data.meetings.length > 0) {
        setMentorMeetings(response.data.meetings);
        setTotalRows(response.data.total);
        sessionStorage.setItem(
          "mentorMeetings",
          JSON.stringify(response.data.meetings)
        );
      } else {
        setNoData(true); // Set no data state
        setMentorMeetings([]);
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Failed to fetch mentor meetings"
      );
      setMentorMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchMentorMeetings(
      academicYear,
      academicSession,
      semester,
      newPage,
      pageSize
    );
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(0);
    fetchMentorMeetings(
      academicYear,
      academicSession,
      semester,
      0,
      newPageSize
    );
  };

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
    setAcademicSession(e.target.value.toUpperCase());
  };

  const handleSemesterChange = (e) => {
    const value = e.target.value;
    // Only allow numbers 1-8
    if (value === "" || /^[1-8]$/.test(value)) {
      setSemester(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    setShowTable(true); // Show table when fetching
    fetchMentorMeetings(academicYear, academicSession, semester, 0, pageSize);
  };

  const generateEmailContent = (mentor) => {
    const subject = "Mentor Meeting Follow-up";
    const body = `Dear ${mentor.mentorName},

I hope this email finds you well.
${mentor.meetingCount >= 3
  ? "Congratulations on completing all required mentor meetings!"
  : "This is a reminder that you still need to complete the required mentor meetings."}

Current Status:
- Meetings Completed: ${mentor.meetingCount || 0}
- Required Meetings: 3

Please ensure all meeting details are properly documented in the system.

Best regards,
Admin Team`;

    return { subject, body };
  };

  const handleSendEmailToMentor = (mentor) => {
    setSelectedMentor(mentor);
    const content = generateEmailContent(mentor);
    setEmailContent(content);
    setEmailPreview(true);
  };

  const handleConfirmSendEmail = async () => {
    setEmailPreview(false);
    setIsSendingEmail(true);
    setGlobalLoading(true);
    
    try {
      const response = await Promise.race([
        axios.post('/api/admin/send-email-mentor', {
          mentorEmail: selectedMentor.mentorEmail,
          subject: emailContent.subject,
          body: emailContent.body,
          mentorData: selectedMentor
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);

      if (response.data.success) {
        toast.success('Email sent to mentor successfully');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message === 'Request timeout' 
        ? 'Email is being sent in background. You will receive a confirmation.' 
        : 'Failed to send email to mentor');
    } finally {
      setIsSendingEmail(false);
      setGlobalLoading(false);
    }
  };

  const generateReport = async (mentorMUJid) => {
    try {
      const mentorData = mentorMeetings.find((m) => m.MUJid === mentorMUJid);

      // Store the report data
      const initialData = {
        meetings: [mentorData],
        academicYear,
        academicSession,
        semester,
        mentorMUJid,
        mentorName: mentorData?.mentorName || "",
      };

      // Store in sessionStorage and navigate
      sessionStorage.setItem("reportData", JSON.stringify(initialData));
      window.location.href = "/pages/meetings/mreport";
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  const columns = [
    // {
    //   field: "MUJid",
    //   headerName: "MUJ ID",
    //   flex: 0.7,
    //   width: 130,
    //   sortable: true,
    //   headerAlign: "center",
    //   align: "center",
    // },
    {
      field: "mentorName",
      headerName: "Name",
      flex: 0.8,
      width: 180,
      sortable: true,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "mentorEmail",
      headerName: "Email",
      flex: 1,
      width: 220,
      sortable: true,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "mentorPhone",
      headerName: "Phone",
      flex: 0.8,
      width: 130,
      sortable: true,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "meetingCount",
      headerName: "Meetings",
      flex: 0.5,
      width: 100,
      sortable: true,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 300,
      headerAlign: "center",
      align: "center",

      renderCell: (params) => (
        <div className='flex gap-2 justify-center items-center'>
          <button
            onClick={() => handleSendEmailToMentor(params.row)}
            className='px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
            bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
            focus:ring-2 focus:ring-blue-500/50 active:scale-95 flex items-center gap-1.5'>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Email
          </button>
          <button
            onClick={() => generateReport(params.row.MUJid)}
            className='px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
            bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
            focus:ring-2 focus:ring-emerald-500/50 active:scale-95 flex items-center gap-1.5'>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Get Report
          </button>
        </div>
      ),
    },
  ];

  // Format data for DataGrid
  const rows = mentorMeetings.map((mentor) => ({
    id: mentor.MUJid, // Use MUJid as the unique identifier
    ...mentor,
  }));

  const MentorCard = ({ mentor }) => {
    const isExpanded = expandedCard === mentor.MUJid;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden mb-4"
      >
        <div className="p-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-orange-500">
              {mentor.mentorName}
            </h3>
            <div className="text-sm text-gray-300">
              <p>Email: {mentor.mentorEmail}</p>
              <p>Phone: {mentor.mentorPhone}</p>
              <p>Meetings Conducted: {mentor.meetingCount}/3</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 p-3 flex gap-2 flex-wrap">
          <button
            onClick={() => handleSendEmailToMentor(mentor)}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
              bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
              focus:ring-2 focus:ring-blue-500/50 active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Email
          </button>
          <button
            onClick={() => generateReport(mentor.MUJid)}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
              bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
              focus:ring-2 focus:ring-emerald-500/50 active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Get Report
          </button>
          <button
            onClick={() => handleExpandCard(mentor.MUJid)}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
              bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-white/20 active:scale-95 flex items-center gap-1.5 ml-auto`}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-white/10 pt-3">
            <div className="space-y-2 text-sm text-gray-300">
              <h4 className="text-orange-500 font-medium">Additional Details</h4>
              <p>Academic Year: {academicYear}</p>
              <p>Academic Session: {academicSession}</p>
              <p>Semester: {semester}</p>
              {mentor.meetingCount < 3 && (
                <p className="text-yellow-500">
                  Pending Meetings: {3 - mentor.meetingCount}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Add this function to get current cards for pagination
  const getCurrentCards = () => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return mentorMeetings.slice(startIndex, endIndex);
  };

  // Add this function to handle card pagination
  const handleCardPageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a] max-h-screen overflow-y-auto lg:overflow-auto custom-scrollbar">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
              Manage Meetings
            </h1>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 sm:p-4 md:p-6 border border-white/10 shadow-2xl">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Academic Year Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    list="academicYears"
                    placeholder="YYYY-YYYY"
                    value={academicYear}
                    onChange={handleAcademicYearChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-gray-500
                    focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                  />
                  <datalist id="academicYears">
                    {academicYears.map((year, index) => (
                      <option key={index} value={year} />
                    ))}
                  </datalist>
                </div>

                {/* Academic Session Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    list="academicSessions"
                    placeholder="MONTH-MONTH YYYY"
                    value={academicSession}
                    onChange={handleAcademicSessionChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-gray-500
                    focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm uppercase"
                  />
                  <datalist id="academicSessions">
                    {academicSessions.map((session, index) => (
                      <option key={index} value={session} />
                    ))}
                  </datalist>
                </div>

                {/* Semester Input */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium text-gray-300">
                    Semester
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="8"
                      placeholder="Enter Semester (1-8)"
                      value={semester}
                      onChange={handleSemesterChange}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-gray-500
                    focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="submit"
                      disabled={loading || !semester}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg font-medium transition-all
                    bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600
                    disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? "Loading..." : "Fetch"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Results Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 h-[calc(100vh-280px)] min-h-[400px] custom-scrollbar"
              >
                {loading && <LoadingComponent />}

                {!loading && !showTable && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-64 h-64">
                      {typeof window !== 'undefined' && (
                        <Lottie
                          animationData={searchAnimation}
                          loop={true}
                          autoplay={true}
                        />
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-400">Enter Semester to View Meetings</h3>
                    <p className="mt-2 text-sm text-gray-500">Select the academic details and enter a semester number to get started</p>
                  </div>
                )}

                {!loading && showTable && noData && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">No meetings found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try different search criteria</p>
                  </div>
                )}

                {!loading && showTable && mentorMeetings.length > 0 && (
                  <div className="h-full w-full">
                    {isMobile ? (
                      <Box sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        {/* Cards container with scrolling */}
                        <Box sx={{
                          flex: 1,
                          overflowY: 'auto',
                          px: 0.5, // Add padding for scrollbar
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(249, 115, 22, 0.5)',
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: '#f97316',
                          },
                        }}>
                          {getCurrentCards().map((mentor) => (
                            <MentorCard key={mentor.MUJid} mentor={mentor} />
                          ))}
                        </Box>
                        
                        {/* Pagination at bottom */}
                        <Box sx={{
                          mt: 'auto',
                          pt: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <Pagination
                            count={Math.ceil(mentorMeetings.length / cardsPerPage)}
                            page={currentPage}
                            onChange={handleCardPageChange}
                            sx={{
                              '& .MuiPaginationItem-root': {
                                color: 'white',
                                '&.Mui-selected': {
                                  backgroundColor: '#f97316',
                                },
                                '&:hover': {
                                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                },
                                '&.MuiPaginationItem-previousNext': {
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      // Table view for desktop
                      <div className="h-full w-full rounded-lg overflow-hidden border border-white/10">
                        <ThemeProvider theme={darkTheme}>
                          <DataGrid
                            rows={rows}
                            columns={columns.map(col => ({
                              ...col,
                              width: undefined, // Remove fixed widths
                              flex: 1, // Make all columns flexible
                              minWidth: col.field === 'actions' ? 200 : 130, // Set minimum widths
                            }))}
                            rowCount={totalRows}
                            page={page}
                            pageSize={pageSize}
                            paginationMode='server'
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            pageSizeOptions={[5, 10, 20]}
                            loading={loading}
                            disableRowSelectionOnClick
                            disableColumnMenu={true}
                            disableColumnFilter={false}
                            autoHeight={false}
                            sx={{
                              height: '100%',
                              width: '100%',
                              border: 'none',
                              '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '8px',
                              },
                              '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                              },
                              '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              },
                              '& .MuiDataGrid-footerContainer': {
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              },
                              "& .MuiDataGrid-virtualScroller": {
                                overflow: "auto",
                                '&::-webkit-scrollbar': {
                                  display: 'none' // Hide default scrollbar
                                },
                                msOverflowStyle: 'none',
                                scrollbarWidth: 'none'
                              },
                            }}
                            className="custom-scrollbar"
                          />
                        </ThemeProvider>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Add Email Preview Dialog */}
        <Dialog
          open={emailPreview}
          onClose={() => setEmailPreview(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              color: 'white',
            },
          }}>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Email Preview
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              Please review and edit the email content before sending:
            </DialogContentText>
            
            {/* Recipient Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Recipient:
              </Typography>
              <Box sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                p: 2, 
                borderRadius: '8px',
              }}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: '0.9rem', color: '#f97316' }} />
                  {selectedMentor?.mentorEmail}
                </Typography>
              </Box>
            </Box>

            {/* Subject Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Subject:
              </Typography>
              <TextField
                fullWidth
                value={emailContent.subject}
                onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }
                }}
              />
            </Box>

            {/* Body Section */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Body:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={emailContent.body}
                onChange={(e) => setEmailContent(prev => ({ ...prev, body: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'monospace',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={() => setEmailPreview(false)}
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSendEmail}
              variant="contained"
              disabled={isSendingEmail || !emailContent.subject.trim() || !emailContent.body.trim()}
              startIcon={isSendingEmail ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(37, 99, 235, 0.5)',
                },
              }}>
              {isSendingEmail ? 'Sending...' : 'Confirm & Send'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }}
        open={globalLoading}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ color: 'white' }}>
          Sending Email...
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          This may take a few moments
        </Typography>
      </Backdrop>
    </>
  );
};

export default ManageMeeting;
