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

  const sendEmail = async (mentorEmail) => {
    const subject = "Mentor Meeting Follow-up";
    const body = `Dear Mentor,

        I hope this email finds you well.
        ${
          mentorMeetings.find((m) => m.mentorEmail === mentorEmail)
            ?.meetingCount >= 3
            ? "Congratulations on completing all required mentor meetings!"
            : "This is a reminder that you still need to complete the required mentor meetings."
        }

        Current Status:
        - Meetings Completed: ${
          mentorMeetings.find((m) => m.mentorEmail === mentorEmail)
            ?.meetingCount || 0
        }
        - Required Meetings: 3

        Please ensure all meeting details are properly documented in the system.

        Best regards,
        Admin Team`;

    window.location.href = `mailto:${mentorEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
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
        <div className='flex gap-2 mt-2 justify-center'>
          <button
            onClick={() => sendEmail(params.row.mentorEmail)}
            className='px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
      rounded-lg text-sm text-white font-medium transition-all duration-200 
      shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40'>
            Send Mail 📧
          </button>
          <button
            onClick={() => generateReport(params.row.MUJid)}
            className='px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 
      rounded-lg text-sm text-white font-medium transition-all duration-200
      shadow-lg shadow-emerald-500/30 hover:shadow-emerald-600/40'>
            Generate Report 📄
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

  return (
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
                          '-ms-overflow-style': 'none',
                          'scrollbar-width': 'none'
                        },
                      }}
                      className="custom-scrollbar"
                    />
                  </ThemeProvider>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ManageMeeting;
