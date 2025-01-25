"use client"
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/subComponents/NavbarNew';
import axios from 'axios';
import LoadingComponent from '@/components/LoadingComponent';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
// import { Dialog } from '@headlessui/react';

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
  // const [detailsDialog, setDetailsDialog] = useState({
  //   open: false,
  //   data: null
  // });

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
      try {
        const parsed = JSON.parse(storedMentorMeetings);
        setMentorMeetings(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Error parsing stored meetings:', e);
        setMentorMeetings([]);
      }
    }
  }, []);

  const fetchMentorMeetings = async () => {
    setLoading(true);
    if (!academicYear || !academicSession || !semester) {
      alert('Please select an academic year, session, and semester.');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`/api/admin/manageMeeting`, {
        params: {
          year: academicYear,
          session: academicSession,
          semester: semester
        }
      });
      
      // Store the raw response data
      sessionStorage.setItem('mentorMeetingsDetailed', JSON.stringify(response.data));
      
      // Set the data directly as it's already in the correct format
      setMentorMeetings(response.data || []);
    } catch (error) {
      console.error('Error fetching mentor meetings:', error);
      alert(error.response?.data?.error || 'Failed to fetch mentor meetings');
      setMentorMeetings([]); // Reset to empty array on error
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

  const sendEmail = async (mentorEmail) => {
    try {
        // Implement email sending logic
        window.location.href = `mailto:${mentorEmail}`;
    } catch{
        alert('Failed to send email');
    }
  };

  const generateReport = async (mentorMUJid) => {
    try {
        const queryParams = new URLSearchParams({
            year: academicYear.split('-')[0], // Take only the start year
            session: academicSession,
            semester: semester,
            section: section,
            mentorMUJid: mentorMUJid.toUpperCase() // Changed from mentorId
        }).toString();
        
        // Use Next.js router or window.location to navigate
        window.location.href = `/pages/meetings/mreport?${queryParams}`;
    } catch (error) {
        console.error('Error navigating to report:', error);
        alert('Failed to generate report');
    }
  };

  const columns = [
    { field: 'MUJid', headerName: 'MUJ ID', width: 130 },
    { field: 'mentorName', headerName: 'Name', width: 180 },
    { field: 'mentorEmail', headerName: 'Email', width: 220 },
    { field: 'mentorPhone', headerName: 'Phone', width: 130 },
    { field: 'meetingCount', headerName: 'Meetings', width: 100 },
    { field: 'totalMentees', headerName: 'Total Mentees', width: 120 },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 200,
        renderCell: (params) => (
            <div className="flex gap-2">
                <button
                    onClick={() => sendEmail(params.row.mentorEmail)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm text-white"
                >
                    Send Email
                </button>
                <button
                    onClick={() => generateReport(params.row.MUJid)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-md text-sm text-white"
                >
                    Generate Report
                </button>
            </div>
        ),
    }
  ];


  return (
    <div className="min-h-screen h-auto bg-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      

      <div className="relative z-10 container mx-auto px-4 pt-24 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-6">
            Manage Meetings
          </h1>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
            <div className="space-y-3 flex-1 min-w-[200px]">
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

            <div className="space-y-3 flex-1 min-w-[200px]">
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
                  placeholder="Enter Section"
                  value={section}
                  onChange={handleSectionChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="space-y-3 flex-1 min-w-[200px]">
              <button 
                type="submit" 
                className="w-full btn-orange disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Fetching...' : 'Fetch Mentor Meetings'}
              </button>
            </div>
          </form>

          {loading ? (
            <LoadingComponent />
          ) : (
            Array.isArray(mentorMeetings) && mentorMeetings.length > 0 && (
              <div className="mt-6 h-[400px] w-full">
                <ThemeProvider theme={darkTheme}>
                  <DataGrid
                    rows={mentorMeetings}
                    getRowId={(row) => row.MUJid}
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
      {renderDetailsDialog()}
    </div>
  );
};

export default ManageMeeting;
