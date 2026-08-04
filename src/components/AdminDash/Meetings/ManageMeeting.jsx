"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import Backdrop from "@mui/material/Backdrop";
import dynamic from "next/dynamic";
import searchAnimation from "@/assets/animations/searchData.json";
import nodatafound from "@/assets/animations/nodatafound.json";
import Pagination from "@mui/material/Pagination";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#f97316",
    },
    background: {
      default: "rgba(0,0,0,0.2)",
    },
  },
});

// Add this after existing theme definitions
const dialogStyles = {
  dialog: {
    "& .MuiDialog-paper": {
      maxHeight: "90vh",
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      // Mobile specific styles
      [darkTheme.breakpoints.down("sm")]: {
        margin: 0,
        maxHeight: "100%",
        minHeight: "100%",
        width: "100%",
        borderRadius: "1rem 1rem 0 0",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    // Mobile specific styles for container
    [darkTheme.breakpoints.down("sm")]: {
      "& .MuiDialog-container": {
        alignItems: "flex-end",
      },
    },
  },
  dialogContent: {
    flex: 1,
    overflowY: "auto",
    p: 0,
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.05)",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(249, 115, 22, 0.5)",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "#f97316",
    },
    // Mobile specific padding
    [darkTheme.breakpoints.down("sm")]: {
      pb: 4,
    },
  },
  contentWrapper: {
    p: 3,
    height: "100%",
    // Mobile specific padding
    [darkTheme.breakpoints.down("sm")]: {
      p: 2,
    },
  },
};

const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

const normalizeSemester = (val) => {
  if (!val) return "";
  const n = Number(val);
  if (isNaN(n) || n < 1 || n > 8) return "";
  return String(n);
};

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const ManageMeeting = () => {
  const [academicYear, setAcademicYear] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  const [semester, setSemester] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [showSemesterOptions, setShowSemesterOptions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const semesterRef = useRef(null);
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
  const [emailContent, setEmailContent] = useState({ subject: "", body: "" });
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [cardsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1); // Add this state for card pagination
  const [meetingDetailsDialog, setMeetingDetailsDialog] = useState(false);
  const [selectedMeetingDetails, setSelectedMeetingDetails] = useState(null);
  const [loadingMeetingDetails, setLoadingMeetingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMentors, setFilteredMentors] = useState([]);

  useEffect(() => {
    setSemester(currentSemester);
  }, [currentSemester]);

  const handleSemesterInput = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // digits only
    const normalized = normalizeSemester(raw);
    setCurrentSemester(normalized); // syncs semester via useEffect

    if (academicYear) setShowSemesterOptions(true);
    if (normalized && normalized.length <= 1) {
      setShowSemesterOptions(false);
    }
  };

  const handleSemesterKeyDown = (e) => {
    if (!showSemesterOptions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((idx) => (idx + 1) % availableSemesters.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((idx) =>
        idx <= 0 ? availableSemesters.length - 1 : idx - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) {
        const sem = availableSemesters[highlightIndex];
        setCurrentSemester(String(sem)); // semester syncs automatically
      }
      setShowSemesterOptions(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSemesterOptions(false);
      setHighlightIndex(-1);
    }
  };

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
  const fetchMentorMeetings = useCallback(
    async (
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

        const response = await axios.get("/api/admin/manageMeeting", {
          params,
        });

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
    },
    [academicYear, academicSession, semester, page, pageSize]
  );
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setPage(0); // Reset to first page
      setShowTable(true); // Show table when fetching
      fetchMentorMeetings(academicYear, academicSession, semester, 0, pageSize);
    },
    [academicYear, academicSession, semester, pageSize, fetchMentorMeetings]
  );
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
  }, [academicYear, academicSession, semester, pageSize, handleSubmit]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // Set breakpoint at lg
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mentorMeetings.length > 0) {
      const filtered = mentorMeetings.filter(
        (mentor) =>
          mentor.mentorName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          mentor.mentorEmail
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          mentor.MUJid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mentor.mentorPhone?.includes(searchQuery)
      );
      setFilteredMentors(filtered);
    }
  }, [searchQuery, mentorMeetings]);

  const handleExpandCard = (mujId) => {
    setExpandedCard(expandedCard === mujId ? null : mujId);
  };

  const fetchMentorMeetingDetails = async (mentorId, status) => {
    setLoadingMeetingDetails(true);
    try {
      const response = await axios.get(`/api/admin/mentorMeetings`, {
        params: {
          mentorId,
          year: academicYear.split("-")[1],
          session: academicSession,
          semester,
          status, // Add status parameter
        },
      });

      if (response.data.success) {
        const meetings = response.data.meetings;
        // Filter meetings based on status if provided
        const filteredMeetings =
          status === "scheduled"
            ? meetings.filter((m) => !m.isReportFilled)
            : status === "reported"
            ? meetings.filter((m) => m.isReportFilled)
            : meetings;

        setSelectedMeetingDetails({
          mentorId,
          mentorName:
            mentorMeetings.find((m) => m.MUJid === mentorId)?.mentorName ||
            "Unknown",
          meetings: filteredMeetings,
          status, // Add status to use in dialog title
        });
        setMeetingDetailsDialog(true);
      } else {
        toast.error("Failed to fetch meeting details");
      }
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch meeting details"
      );
    } finally {
      setLoadingMeetingDetails(false);
    }
  };

  const handleViewMeetings = (mentorId, status) => {
    fetchMentorMeetingDetails(mentorId, status);
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

  // const handleSemesterChange = (e) => {
  //   const value = e.target.value;
  //   // Only allow numbers 1-8
  //   if (value === "" || /^[1-8]$/.test(value)) {
  //     setSemester(value);
  //   }
  // };

  const generateEmailContent = (mentor) => {
    const subject = "Mentor Meeting Follow-up";

    // Customize email message based on reports pending
    let pendingReports = "";
    if (mentor.scheduledMeetings > 0) {
      pendingReports = `\nNote: You have ${
        mentor.scheduledMeetings
      } scheduled ${
        mentor.scheduledMeetings > 1 ? "meetings" : "meeting"
      } with pending reports. Please complete the reports at your earliest convenience.`;
    }

    const body = `Dear ${mentor.mentorName},

I hope this email finds you well.
${
  mentor.meetingCount >= 3
    ? `Congratulations on scheduling all required mentor meetings! ${
        mentor.scheduledMeetings > 0
          ? "Please ensure all meeting reports are filled."
          : "All meeting reports have been completed."
      }`
    : `This is a reminder that you still need to schedule ${
        3 - mentor.meetingCount
      } more mentor ${3 - mentor.meetingCount > 1 ? "meetings" : "meeting"}.`
}

Current Status:
- Total Meetings: ${mentor.meetingCount || 0}/3
- Completed with Reports: ${mentor.reportedMeetings || 0}
- Scheduled (Pending Reports): ${mentor.scheduledMeetings || 0}${pendingReports}

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
        axios.post("/api/admin/send-email-mentor", {
          mentorEmail: selectedMentor.mentorEmail,
          subject: emailContent.subject,
          body: emailContent.body,
          mentorData: selectedMentor,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        ),
      ]);

      if (response.data.success) {
        toast.success("Email sent to mentor successfully");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        error.message === "Request timeout"
          ? "Email is being sent in background. You will receive a confirmation."
          : "Failed to send email to mentor"
      );
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
      field: "meetingStatus",
      headerName: `Semester ${semester} Meetings`,
      flex: 1,
      minWidth: 200,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <div className="text-center w-full">
          <div className="grid grid-cols-2 gap-2 w-full px-2">
            <button
              onClick={() => {
                handleViewMeetings(params.row.MUJid, "scheduled");
              }}
              className="flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500/20 
              rounded-lg py-1.5 px-2 transition-all duration-200 group cursor-pointer"
            >
              <span className="inline-block w-2 h-2 rounded-full mr-2 bg-yellow-500 group-hover:scale-110"></span>
              <span className="text-yellow-500 text-xs font-medium">
                Scheduled: {params.row.scheduledMeetings || 0}
              </span>
            </button>
            <button
              onClick={() => {
                handleViewMeetings(params.row.MUJid, "reported");
              }}
              className="flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 
              rounded-lg py-1.5 px-2 transition-all duration-200 group cursor-pointer"
            >
              <span className="inline-block w-2 h-2 rounded-full mr-2 bg-green-500 group-hover:scale-110"></span>
              <span className="text-green-500 text-xs font-medium">
                Reported: {params.row.reportedMeetings || 0}
              </span>
            </button>
          </div>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 260,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <div className="flex gap-3 justify-center items-center w-full px-2">
          <button
            onClick={() => handleSendEmailToMentor(params.row)}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
            bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
            focus:ring-2 focus:ring-blue-500/50 active:scale-95 flex items-center gap-1.5 whitespace-nowrap min-w-[120px] justify-center"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Send Email
          </button>
          <button
            onClick={() => generateReport(params.row.MUJid)}
            disabled={params.row.reportedMeetings <= 0}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
            ${
              params.row.reportedMeetings > 0
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:ring-2 focus:ring-emerald-500/50 active:scale-95"
                : "bg-gray-500 cursor-not-allowed opacity-50"
            } flex items-center gap-1.5 whitespace-nowrap min-w-[120px] justify-center`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Get Report
          </button>
        </div>
      ),
    },
  ];

  // Update the rows formatting for DataGrid
  const formatRowsForDataGrid = (data) => {
    return data.map((mentor) => ({
      id: mentor.MUJid, // Explicitly set id to MUJid
      ...mentor,
    }));
  };

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
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleViewMeetings(mentor.MUJid, "scheduled")
                    }
                    className="flex items-center justify-between bg-yellow-500/10 hover:bg-yellow-500/20 
                    rounded-lg p-2 transition-all duration-200 w-full group"
                  >
                    <span className="text-yellow-500 text-xs">Scheduled</span>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full mr-2 bg-yellow-500 group-hover:scale-110"></span>
                      <span className="text-yellow-500 text-xs font-medium">
                        {mentor.scheduledMeetings || 0}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleViewMeetings(mentor.MUJid, "reported")}
                    className="flex items-center justify-between bg-green-500/10 hover:bg-green-500/20 
                    rounded-lg p-2 transition-all duration-200 w-full group"
                  >
                    <span className="text-green-500 text-xs">Reported</span>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full mr-2 bg-green-500 group-hover:scale-110"></span>
                      <span className="text-green-500 text-xs font-medium">
                        {mentor.reportedMeetings || 0}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 p-3 flex flex-wrap gap-2">
          <button
            onClick={() => handleSendEmailToMentor(mentor)}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
              bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
              focus:ring-2 focus:ring-blue-500/50 active:scale-95 flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Send Email
          </button>
          <button
            onClick={() => generateReport(mentor.MUJid)}
            disabled={mentor.reportedMeetings <= 0}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
              ${
                mentor.reportedMeetings > 0
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:ring-2 focus:ring-emerald-500/50 active:scale-95"
                  : "bg-gray-500 cursor-not-allowed opacity-50"
              } flex items-center gap-1.5`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Get Report
          </button>
          <button
            onClick={() => handleExpandCard(mentor.MUJid)}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200
              bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-white/20 active:scale-95 flex items-center gap-1.5 ml-auto`}
          >
            {isExpanded ? "Show Less" : "Show More"}
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-white/10 pt-3">
            <div className="space-y-2 text-sm text-gray-300">
              <h4 className="text-orange-500 font-medium">
                Additional Details
              </h4>
              <p>Academic Year: {academicYear}</p>
              <p>Academic Session: {academicSession}</p>
              <p>Semester: {semester}</p>
              <div className="space-y-1 mt-2 pt-2 border-t border-white/5">
                <p className="text-sm font-medium">Meeting Status</p>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center justify-between bg-white/5 p-1.5 px-2 rounded">
                    <span>Scheduled (Pending Reports)</span>
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded font-medium">
                      {mentor.scheduledMeetings || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-1.5 px-2 rounded">
                    <span>Completed with Reports</span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded font-medium">
                      {mentor.reportedMeetings || 0}
                    </span>
                  </div>
                </div>
              </div>
              {mentor.meetingCount < 3 && (
                <p className="text-amber-500">
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format meeting status badge
  const getMeetingStatusBadge = (isReportFilled) => {
    return isReportFilled ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
        Completed
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">
        Scheduled
      </span>
    );
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
              <div className="flex flex-col gap-4">
                {/* Search Form */}
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <div className="space-y-1">
                    <input
                      type="text"
                      list="academicYears"
                      placeholder="Academic Year"
                      value={academicYear}
                      onChange={handleAcademicYearChange}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white placeholder:text-gray-500
                focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                    />
                    <datalist id="academicYears">
                      {academicYears.map((year, index) => (
                        <option key={index} value={year} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      list="academicSessions"
                      placeholder="Academic Session"
                      value={academicSession}
                      onChange={handleAcademicSessionChange}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white placeholder:text-gray-500
                focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm uppercase"
                    />
                    <datalist id="academicSessions">
                      {academicSessions.map((session, index) => (
                        <option key={index} value={session} />
                      ))}
                    </datalist>
                  </div>

                  <div ref={semesterRef} className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={1}
                      placeholder={
                        !academicYear
                          ? "Add academic year first"
                          : "Select semester number"
                      }
                      value={currentSemester}
                      onChange={handleSemesterInput}
                      onKeyDown={handleSemesterKeyDown}
                      onFocus={() => {
                        if (academicYear) {
                          setShowSemesterOptions(true);
                          setHighlightIndex(-1);
                        }
                      }}
                      disabled={!academicYear}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-gray-500 disabled:opacity-50 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />

                    {showSemesterOptions && availableSemesters.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-black/90 border border-white/10 rounded-lg shadow-lg">
                        {availableSemesters.map((sem, i) => (
                          <div
                            key={sem}
                            className={`px-4 py-2 hover:bg-white/10 cursor-pointer text-white ${
                              currentSemester === String(sem)
                                ? "bg-orange-500/20 border-l-2 border-orange-500"
                                : ""
                            } ${i === highlightIndex ? "bg-white/10" : ""}`}
                            onMouseEnter={() => setHighlightIndex(i)}
                            onMouseLeave={() => setHighlightIndex(-1)}
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

                  <button
                    type="submit"
                    disabled={loading || !semester}
                    className="h-9 px-4 rounded-lg font-medium transition-all
              bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600
              disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                  >
                    {loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      "Fetch Meetings"
                    )}
                  </button>
                </form>

                {/* Search Box - Only visible when there's data */}
                {mentorMeetings.length > 0 && (
                  <div className="mt-2">
                    <TextField
                      fullWidth
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, ID or phone..."
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon
                              sx={{ color: "rgba(255,255,255,0.5)" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.08)",
                          },
                          "& fieldset": {
                            borderColor: "rgba(255,255,255,0.1)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(255,255,255,0.2)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#f97316",
                          },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "rgba(255,255,255,0.5)",
                          opacity: 1,
                        },
                      }}
                    />
                  </div>
                )}
              </div>

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
                      {typeof window !== "undefined" && (
                        <Lottie
                          animationData={searchAnimation}
                          loop={true}
                          autoplay={true}
                        />
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-400">
                      Enter Semester to View Meetings
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Select the academic details and enter a semester number to
                      get started
                    </p>
                  </div>
                )}

                {!loading && showTable && noData && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    {/* <svg
                      className="mx-auto h-12 w-12 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    > 
                    
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg> */}
                    <Lottie
                      animationData={nodatafound}
                      loop={true}
                      autoplay={true}
                      className="w-32 h-32"
                    />
                    <h3 className="mt-2 text-sm font-medium">
                      No meetings found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try different search criteria
                    </p>
                  </div>
                )}

                {!loading && showTable && mentorMeetings.length > 0 && (
                  <div className="h-full w-full">
                    {isMobile ? (
                      <Box
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {/* Cards container with scrolling */}
                        <Box
                          sx={{
                            flex: 1,
                            overflowY: "auto",
                            px: 0.5, // Add padding for scrollbar
                            "&::-webkit-scrollbar": {
                              width: "8px",
                            },
                            "&::-webkit-scrollbar-track": {
                              background: "rgba(255, 255, 255, 0.05)",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              background: "rgba(249, 115, 22, 0.5)",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                              background: "#f97316",
                            },
                          }}
                        >
                          {getCurrentCards().map((mentor) => (
                            <MentorCard key={mentor.MUJid} mentor={mentor} />
                          ))}
                        </Box>

                        {/* Pagination at bottom */}
                        <Box
                          sx={{
                            mt: "auto",
                            pt: 2,
                            display: "flex",
                            justifyContent: "center",
                            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <Pagination
                            count={Math.ceil(
                              mentorMeetings.length / cardsPerPage
                            )}
                            page={currentPage}
                            onChange={handleCardPageChange}
                            sx={{
                              "& .MuiPaginationItem-root": {
                                color: "white",
                                "&.Mui-selected": {
                                  backgroundColor: "#f97316",
                                },
                                "&:hover": {
                                  backgroundColor: "rgba(249, 115, 22, 0.15)",
                                },
                                "&.MuiPaginationItem-previousNext": {
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
                            rows={
                              searchQuery
                                ? formatRowsForDataGrid(filteredMentors)
                                : formatRowsForDataGrid(mentorMeetings)
                            }
                            getRowId={(row) => row.MUJid} // Add this line to ensure unique ids
                            columns={columns.map((col) => ({
                              ...col,
                              width: undefined, // Remove fixed widths
                              flex: 1, // Make all columns flexible
                              minWidth: col.field === "actions" ? 200 : 130, // Set minimum widths
                            }))}
                            rowCount={totalRows}
                            page={page}
                            pageSize={pageSize}
                            paginationMode="server"
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            pageSizeOptions={[5, 10, 20]}
                            loading={loading}
                            disableRowSelectionOnClick
                            disableColumnMenu={true}
                            disableColumnFilter={false}
                            autoHeight={false}
                            sx={{
                              height: "100%",
                              width: "100%",
                              border: "none",
                              "& .MuiDataGrid-cell": {
                                borderBottom:
                                  "1px solid rgba(255, 255, 255, 0.05)",
                                padding: "8px",
                              },
                              "& .MuiDataGrid-columnHeaders": {
                                backgroundColor: "rgba(0, 0, 0, 0.3)",
                                borderBottom:
                                  "1px solid rgba(255, 255, 255, 0.1)",
                              },
                              "& .MuiDataGrid-row:hover": {
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                              },
                              "& .MuiDataGrid-footerContainer": {
                                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                              },
                              "& .MuiDataGrid-virtualScroller": {
                                overflow: "auto",
                                "&::-webkit-scrollbar": {
                                  display: "none", // Hide default scrollbar
                                },
                                msOverflowStyle: "none",
                                scrollbarWidth: "none",
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

        {/* Meeting Details Dialog */}
        <Dialog
          open={meetingDetailsDialog}
          onClose={() => setMeetingDetailsDialog(false)}
          maxWidth="lg"
          fullWidth
          keepMounted
          TransitionProps={{
            timeout: 300,
          }}
          sx={{
            ...dialogStyles.dialog,
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
            [darkTheme.breakpoints.down("sm")]: {
              "& .MuiDialog-paper": {
                transform: "none !important",
                transition: "opacity 0.3s ease-out !important",
                opacity: meetingDetailsDialog ? 1 : 0,
              },
            },
          }}
          PaperProps={{
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: darkTheme.breakpoints.down("sm")
                ? "1rem 1rem 0 0"
                : "1rem",
              color: "white",
              [darkTheme.breakpoints.down("sm")]: {
                margin: 0,
                width: "100%",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              p: darkTheme.breakpoints.down("sm") ? 1.5 : 2,
              "& .MuiTypography-root": {
                fontSize: darkTheme.breakpoints.down("sm")
                  ? "1.25rem"
                  : "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              },
            }}
          >
            <PersonIcon sx={{ color: "#f97316" }} />
            {selectedMeetingDetails?.mentorName}&apos;s{" "}
            {selectedMeetingDetails?.status === "scheduled"
              ? "Scheduled"
              : selectedMeetingDetails?.status === "reported"
              ? "Completed"
              : "All"}{" "}
            Meetings
          </DialogTitle>
          <DialogContent sx={dialogStyles.dialogContent}>
            <Box sx={dialogStyles.contentWrapper}>
              {loadingMeetingDetails ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "300px",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <CircularProgress color="primary" />
                  <Typography>Loading meeting details...</Typography>
                </Box>
              ) : (
                <>
                  {selectedMeetingDetails?.meetings?.length > 0 ? (
                    <Box sx={{ overflow: "auto" }}>
                      {selectedMeetingDetails.meetings.map((meeting, index) => (
                        <Box
                          key={meeting.meeting_id || index}
                          sx={{
                            mb: 2,
                            p: 2,
                            bgcolor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transition: "all 0.2s",
                            "&:hover": {
                              bgcolor: "rgba(255, 255, 255, 0.08)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: "bold", color: "#f97316" }}
                            >
                              Meeting {index + 1}
                            </Typography>
                            <Box>
                              {getMeetingStatusBadge(meeting.isReportFilled)}
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                              },
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="body2"
                                color="rgba(255, 255, 255, 0.6)"
                                gutterBottom
                              >
                                Date
                              </Typography>
                              <Typography>
                                {formatDate(meeting.meeting_date)}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                variant="body2"
                                color="rgba(255, 255, 255, 0.6)"
                                gutterBottom
                              >
                                Time
                              </Typography>
                              <Typography>
                                {meeting.meeting_time || "Not specified"}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                variant="body2"
                                color="rgba(255, 255, 255, 0.6)"
                                gutterBottom
                              >
                                Semester
                              </Typography>
                              <Typography>{meeting.semester}</Typography>
                            </Box>

                            <Box>
                              <Typography
                                variant="body2"
                                color="rgba(255, 255, 255, 0.6)"
                                gutterBottom
                              >
                                Venue
                              </Typography>
                              <Typography>
                                {meeting.meeting_notes?.venue ||
                                  "Not specified"}
                              </Typography>
                            </Box>
                          </Box>

                          {meeting.isReportFilled && (
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "rgba(16, 185, 129, 0.1)",
                                borderRadius: "4px",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: "#10b981" }}
                              >
                                <span className="font-medium">
                                  Report available
                                </span>{" "}
                                - Meeting completed with{" "}
                                {meeting.present_mentees?.length || 0} mentee(s)
                                present
                              </Typography>
                            </Box>
                          )}

                          {!meeting.isReportFilled && (
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "rgba(234, 179, 8, 0.1)",
                                borderRadius: "4px",
                                border: "1px solid rgba(234, 179, 8, 0.2)",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: "#eab308" }}
                              >
                                <span className="font-medium">
                                  Pending report
                                </span>{" "}
                                - Meeting scheduled for{" "}
                                {formatDate(meeting.meeting_date)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "200px",
                        flexDirection: "column",
                        p: 3,
                        textAlign: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "8px",
                        border: "1px dashed rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <svg
                        className="w-12 h-12 text-gray-500 mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <Typography variant="subtitle1">
                        No meetings found
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                      >
                        This mentor has not scheduled any meetings for the
                        current semester.
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              p: darkTheme.breakpoints.down("sm") ? 1.5 : 2,
              gap: 1,
              [darkTheme.breakpoints.down("sm")]: {
                position: "sticky",
                bottom: 0,
                bgcolor: "rgba(17, 17, 17, 0.95)",
                backdropFilter: "blur(10px)",
              },
            }}
          >
            <Button
              onClick={() => setMeetingDetailsDialog(false)}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Close
            </Button>
            {selectedMeetingDetails?.meetings?.some(
              (m) => m.isReportFilled
            ) && (
              <Button
                onClick={() => {
                  setMeetingDetailsDialog(false);
                  generateReport(selectedMeetingDetails.mentorId);
                }}
                variant="contained"
                startIcon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                sx={{
                  bgcolor: "#10b981",
                  "&:hover": {
                    bgcolor: "#059669",
                  },
                }}
              >
                Generate Report
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog
          open={emailPreview}
          onClose={() => setEmailPreview(false)}
          maxWidth="md"
          fullWidth
          keepMounted
          TransitionProps={{
            timeout: 300,
          }}
          sx={{
            ...dialogStyles.dialog,
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
            [darkTheme.breakpoints.down("sm")]: {
              "& .MuiDialog-paper": {
                transform: "none !important",
                transition: "opacity 0.3s ease-out !important",
                opacity: emailPreview ? 1 : 0,
              },
            },
          }}
          PaperProps={{
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: darkTheme.breakpoints.down("sm")
                ? "1rem 1rem 0 0"
                : "1rem",
              color: "white",
              [darkTheme.breakpoints.down("sm")]: {
                margin: 0,
                width: "100%",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              p: darkTheme.breakpoints.down("sm") ? 1.5 : 2,
              "& .MuiTypography-root": {
                fontSize: darkTheme.breakpoints.down("sm")
                  ? "1.25rem"
                  : "1.5rem",
              },
            }}
          >
            Email Preview
          </DialogTitle>
          <DialogContent sx={dialogStyles.dialogContent}>
            <Box sx={dialogStyles.contentWrapper}>
              <DialogContentText
                sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
              >
                Please review and edit the email content before sending:
              </DialogContentText>

              {/* Recipient Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Recipient:
                </Typography>
                <Box
                  sx={{
                    color: "white",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    p: 2,
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <PersonIcon sx={{ fontSize: "0.9rem", color: "#f97316" }} />
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
                  onChange={(e) =>
                    setEmailContent((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                      },
                    },
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
                  onChange={(e) =>
                    setEmailContent((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      fontFamily: "monospace",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              p: darkTheme.breakpoints.down("sm") ? 1.5 : 2,
              gap: 1,
              [darkTheme.breakpoints.down("sm")]: {
                position: "sticky",
                bottom: 0,
                bgcolor: "rgba(17, 17, 17, 0.95)",
                backdropFilter: "blur(10px)",
              },
            }}
          >
            <Button
              onClick={() => setEmailPreview(false)}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSendEmail}
              variant="contained"
              disabled={
                isSendingEmail ||
                !emailContent.subject.trim() ||
                !emailContent.body.trim()
              }
              startIcon={
                isSendingEmail ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                bgcolor: "#2563eb",
                "&:hover": {
                  bgcolor: "#1d4ed8",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(37, 99, 235, 0.5)",
                },
              }}
            >
              {isSendingEmail ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
          gap: 2,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
        }}
        open={globalLoading}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ color: "white" }}>
          Sending Email...
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          This may take a few moments
        </Typography>
      </Backdrop>
    </>
  );
};

export default ManageMeeting;
