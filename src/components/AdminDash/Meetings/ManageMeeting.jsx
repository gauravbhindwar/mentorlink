"use client"
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';
import LoadingComponent from '@/components/LoadingComponent';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';

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
    
    // Clear mentor meetings data on component mount
    setMentorMeetings([]);
    sessionStorage.removeItem('mentorMeetings');

    // Cleanup on component unmount
    return () => {
      sessionStorage.removeItem('mentorMeetings');
    };
  }, []);

  const fetchMentorMeetings = async () => {
    setLoading(true);
    if (!academicYear || !academicSession || !semester) {
      toast.error('Please select all required fields.');
      setLoading(false);
      return;
    }

    try {
      // Get the correct year based on session type
      const isJulyDecember = academicSession.includes('JULY-DECEMBER');
      const [startYear] = academicYear.split('-');
      const queryYear = isJulyDecember ? startYear : parseInt(startYear) + 1;

      const params = {
        year: queryYear,
        session: academicSession,
        semester,
        ...(section && { section })
      };
      
      const response = await axios.get('/api/admin/manageMeeting', { params });
      
      if (response.data) {
        setMentorMeetings(response.data);
        sessionStorage.setItem('mentorMeetings', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to fetch mentor meetings');
      setMentorMeetings([]);
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
    setAcademicSession(e.target.value.toUpperCase());
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
      const mentorData = mentorMeetings.find(m => m.MUJid === mentorMUJid);
      let sectionToUse = section;

      // If section is empty, fetch it from the database
      if (!section) {
        try {
          const response = await axios.get('/api/meetings/mentor/section', {
            params: {
              mentorMUJid,
              academicYear,
              academicSession,
              semester
            }
          });
          
          if (response.data?.section) {
            sectionToUse = response.data.section;
          } else {
            // Use empty string but don't show error
            sectionToUse = '';
          }
        } catch (error) {
          console.error('Error fetching section:', error);
          // Continue with empty section
          sectionToUse = '';
        }
      }

      // Store the report data
      const initialData = {
        meetings: [mentorData],
        academicYear,
        academicSession,
        semester,
        section: sectionToUse,
        mentorMUJid,
        mentorName: mentorData?.mentorName || ''
      };
      
      // Store in sessionStorage and navigate
      sessionStorage.setItem('reportData', JSON.stringify(initialData));
      window.open('/pages/meetings/mreport', '_blank');
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const columns = [
    { field: 'MUJid', headerName: 'MUJ ID', width: 130 },
    { field: 'mentorName', headerName: 'Name', width: 180 },
    { field: 'mentorEmail', headerName: 'Email', width: 220 },
    { field: 'mentorPhone', headerName: 'Phone', width: 130 },
    { field: 'meetingCount', headerName: 'Meetings', width: 100 },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 300,
        renderCell: (params) => (
            <div className="flex gap-2 mt-2 justify-center">
                <button
                    onClick={() => sendEmail(params.row.mentorEmail)}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
      rounded-lg text-sm text-white font-medium transition-all duration-200 
      shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40"
                >
                   Send Mail 📧
                </button>
                <button
                    onClick={() => generateReport(params.row.MUJid)}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 
      rounded-lg text-sm text-white font-medium transition-all duration-200
      shadow-lg shadow-emerald-500/30 hover:shadow-emerald-600/40"
                >
                   Generate Report 📄
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
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm uppercase"
                />
                <datalist id="academicSessions">
                  {academicSessions.map((session, index) => (
                    <option key={index} value={session} />
                  ))}
                </datalist>
                <small className="text-green-500">Type &apos;JUL&apos; or &apos;JAN&apos; for quick selection</small>
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

            <div className="space-y-3 flex-1 min-w-[200px] mt-6 ">
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
