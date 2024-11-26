"use client"
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';
import LoadingComponent from '@/components/LoadingComponent';
import { DataGrid } from '@mui/x-data-grid';
import SendIcon from '@mui/icons-material/Send';
import DocumentIcon from '@mui/icons-material/Description';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import WarningIcon from '@mui/icons-material/Warning';
import CelebrationIcon from '@mui/icons-material/Celebration';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const ManageMeeting = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [mentorMeetings, setMentorMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);

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
    const [startYear, endYear] = academicYear.split('-');
    return [
        `JULY-DECEMBER ${startYear}`,
        `JANUARY-JUNE ${endYear}`
    ];
  };

  useEffect(() => {
    const currentAcadYear = getCurrentAcademicYear();
    const sessions = generateAcademicSessions(currentAcadYear);
    setAcademicYear(currentAcadYear);
    setAcademicSession(sessions[0]);
    setAcademicYears([
      currentAcadYear,
      `${parseInt(currentAcadYear.split('-')[0]) - 1}-${parseInt(currentAcadYear.split('-')[1]) - 1}`,
      `${parseInt(currentAcadYear.split('-')[0]) - 2}-${parseInt(currentAcadYear.split('-')[1]) - 2}`
    ]);
    setAcademicSessions(sessions);
  }, []);

  useEffect(() => {
    const storedMentorMeetings = sessionStorage.getItem('mentorMeetings');
    if (storedMentorMeetings) {
      setMentorMeetings(JSON.parse(storedMentorMeetings));
    }
  }, []);

  const fetchMentorMeetings = async () => {
    setLoading(true);
    if (!academicYear || !academicSession) {
      alert('Please select an academic year and session.');
      setLoading(false);
      return;
    }
    try {
      const params = {
        year: academicYear.split('-')[0], // Take only the start year
        session: academicSession
      };
      
      // Add optional parameters
      if (semester) {
        params.semester = semester;
      }
      if (section) {
        params.section = section;
      }

      const response = await axios.get(`/api/admin/manageMeeting`, { params });
      setMentorMeetings(response.data);
      sessionStorage.setItem('mentorMeetings', JSON.stringify(response.data));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to fetch mentor meetings');
    } finally {
      setLoading(false);
    }
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
    setAcademicSession(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  const handleSectionChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z]?$/.test(value)) {
      setSection(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchMentorMeetings();
  };

  const getEmailTemplate = (mentorName, meetingCount, isAlert = false) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (isAlert) {
      return `
Dear ${mentorName},

⚠️ Important Notice Regarding Mentor Meetings ⚠️

I hope this email finds you well. I am writing to bring to your attention that you have currently conducted ${meetingCount} mentor meetings this semester, which is below the minimum requirement of 3 meetings.

🗓️ Current Status:
• Meetings Conducted: ${meetingCount}/3
• Pending Meetings: ${3 - meetingCount}
• Academic Session: ${academicSession}
• Semester: ${semester}

⏰ Action Required:
Please schedule the remaining meetings at your earliest convenience to meet the semester requirements.

If you need any assistance or have questions, please don't hesitate to reach out.

Best regards,
Admin Team
MentorLink System

📅 ${currentDate}
      `.trim();
    }

    return `
Dear ${mentorName},

🎉 Congratulations on Meeting Completion! 🎉

I am pleased to acknowledge that you have successfully conducted ${meetingCount} mentor meetings this semester, meeting and exceeding our requirement of 3 meetings.

✨ Your Achievement:
• Meetings Conducted: ${meetingCount}/3
• Status: Complete ✅
• Academic Session: ${academicSession}
• Semester: ${semester}

🌟 Thank you for your dedication to mentoring and supporting our students!

Best regards,
Admin Team
MentorLink System

📅 ${currentDate}
    `.trim();
  };

  const sendEmail = async (mentorEmail, mentorName, meetingCount) => {
    try {
      const isAlert = meetingCount < 3;
      const subject = isAlert 
        ? `⚠️ Action Required: Mentor Meeting Status Update - ${meetingCount}/3 Meetings Completed`
        : `🎉 Congratulations: Mentor Meeting Requirements Fulfilled - ${meetingCount}/3 Meetings`;

      const emailBody = getEmailTemplate(mentorName, meetingCount, isAlert);
      const mailtoLink = `mailto:${mentorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      window.location.href = mailtoLink;
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const generateReport = async (mentorMUJid) => {
    try {
        // Create the data object with current filter values
        const filterData = {
            academicYear,
            academicSession,
            semester,
            section,
            mentorMUJid
        };

        // Store filter data in sessionStorage
        sessionStorage.setItem('reportFilters', JSON.stringify(filterData));
        
        // Navigate to report page
        window.location.href = `/pages/meetings/mreport`;
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report');
    }
  };

  const columns = [
    { field: 'MUJid', headerName: 'MUJ ID', width: 130 },
    { field: 'mentorName', headerName: 'Name', width: 180 },
    { field: 'mentorEmail', headerName: 'Email', width: 260 },
    { field: 'mentorPhone', headerName: 'Phone', width: 130 },
    { field: 'meetingCount', headerName: 'Meetings', width: 100 },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 350,
        renderCell: (params) => (
            <div className="flex gap-3 mt-1.5">
                <button
                    onClick={() => sendEmail(params.row.mentorEmail, params.row.mentorName, params.row.meetingCount)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-white shadow-md transition-all transform hover:scale-105 flex items-center gap-1.5
                      ${params.row.meetingCount >= 3 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                      }`}
                >
                    {params.row.meetingCount >= 3 ? (
                      <>
                        <CelebrationIcon className="h-3 w-3.5 animate-bounce" />
                        <span>Send Congratulations</span>
                      </>
                    ) : (
                      <>
                        <WarningIcon className="h-3 w-3.5 animate-pulse" />
                        <span>Send Reminder</span>
                      </>
                    )}
                </button>
                <button
                    onClick={() => generateReport(params.row.MUJid)}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-md text-xs font-medium text-white shadow-sm transition-transform transform hover:scale-105 flex items-center gap-1.5"
                >
                    <DocumentIcon className="h-4 w-4" />
                    <span>Generate Report</span>
                </button>
            </div>
        ),
    },
  ];

  // Format data for DataGrid
  const rows = mentorMeetings.map(mentor => ({
      id: mentor.MUJid, // Use MUJid as the unique identifier
      ...mentor
  }));

  return (
    <div className="min-h-screen h-auto bg-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 container mx-auto px-4 pt-24 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-6">
            Manage Meetings
          </h1>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
            <div className="space-y-3 flex-1 min-w-[200px] max-w-[400px]">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Academic Year</label>
                <input
                  type="text"
                  list="academicYears"
                  placeholder="YYYY-YYYY"
                  value={academicYear}
                  onChange={handleAcademicYearChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
                <datalist id="academicYears">
                  {academicYears.map((year, index) => (
                    <option key={index} value={year} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Academic Session</label>
                <input
                  type="text"
                  list="academicSessions"
                  placeholder="MONTH-MONTH YYYY"
                  value={academicSession}
                  onChange={handleAcademicSessionChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
                <datalist id="academicSessions">
                  {academicSessions.map((session, index) => (
                    <option key={index} value={session} />
                  ))}
                </datalist>
                <small className="text-green-500">Type &apos;jul&apos; or &apos;jan&apos; for quick selection</small>
              </div>
            </div>

            <div className="space-y-3 flex-1 min-w-[200px] max-w-[400px]">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
                <input
                  type="text"
                  placeholder="Enter Semester"
                  value={semester}
                  onChange={handleSemesterChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="Enter Section(Optional)"
                  value={section}
                  onChange={handleSectionChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-center min-w-[200px]">
              <button 
                type="submit" 
                className="w-full btn-orange text-lg font-semibold rounded-lg p-2 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" className="ml-2" />
                ) : (
                  <MeetingRoomIcon className="h-6 w-6" />
                )}
                <span>{loading ? 'Fetching...' : 'Fetch Mentor Meetings'}</span>
              </button>
            </div>
          </form>

          {loading ? (
            <LoadingComponent />
          ) : (
            mentorMeetings.length > 0 && (
              <div className="mt-6 h-[400px] w-full">
                <ThemeProvider theme={darkTheme}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 5 },
                      },
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    checkboxSelection
                    disableRowSelectionOnClick
                  />
                </ThemeProvider>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageMeeting;
