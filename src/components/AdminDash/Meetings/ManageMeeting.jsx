"use client"
import React, { useState, useEffect } from 'react';
import NavbarNew from '@/components/subComponents/NavbarNew';
import axios from 'axios';
import LoadingComponent from '@/components/LoadingComponent';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import { determineAcademicPeriod, generateAcademicSessions } from '../mentee/utils/academicUtils';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const ManageMeeting = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [mentorMeetings, setMentorMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalRows, setTotalRows] = useState(0);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { academicYear: currentAcadYear, academicSession: currentSession } = determineAcademicPeriod();
      const sessions = generateAcademicSessions(currentAcadYear);
      
      // Set initial values
      setAcademicYear(currentAcadYear);
      setAcademicSession(currentSession);
      setAcademicYears([
        currentAcadYear,
        `${parseInt(currentAcadYear.split('-')[0]) - 1}-${parseInt(currentAcadYear.split('-')[1]) - 1}`,
        `${parseInt(currentAcadYear.split('-')[0]) - 2}-${parseInt(currentAcadYear.split('-')[1]) - 2}`
      ]);
      setAcademicSessions(sessions);
    };

    init();
  }, []);

  const fetchMentorMeetings = async (year = academicYear, session = academicSession, sem = semester, pg = page, size = pageSize) => {
    setLoading(true);
    try {
      const params = {
        year,
        session,
        semester: sem,
        page: pg,
        limit: size
      };
      
      const response = await axios.get('/api/admin/manageMeeting', { params });
      
      if (response.data) {
        setMentorMeetings(response.data.meetings);
        setTotalRows(response.data.total);
        sessionStorage.setItem('mentorMeetings', JSON.stringify(response.data.meetings));
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to fetch mentor meetings');
      setMentorMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchMentorMeetings(academicYear, academicSession, semester, newPage, pageSize);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(0);
    fetchMentorMeetings(academicYear, academicSession, semester, 0, newPageSize);
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
    if (value === '' || (/^[1-8]$/.test(value))) {
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
        
        const subject = 'Mentor Meeting Follow-up';
        const body = `Dear Mentor,

        I hope this email finds you well.
        ${mentorMeetings.find(m => m.mentorEmail === mentorEmail)?.meetingCount >= 3 
          ? 'Congratulations on completing all required mentor meetings!' 
          : 'This is a reminder that you still need to complete the required mentor meetings.'}

        Current Status:
        - Meetings Completed: ${mentorMeetings.find(m => m.mentorEmail === mentorEmail)?.meetingCount || 0}
        - Required Meetings: 3

        Please ensure all meeting details are properly documented in the system.

        Best regards,
        Admin Team`;

        window.location.href = `mailto:${mentorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  };

  const generateReport = async (mentorMUJid) => {
    try {
      const mentorData = mentorMeetings.find(m => m.MUJid === mentorMUJid);

      // Store the report data
      const initialData = {
        meetings: [mentorData],
        academicYear,
        academicSession,
        semester,
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
    { field: 'MUJid', headerName: 'MUJ ID',flex:0.7, width: 130, sortable: true,headerAlign: 'center',align: 'center' },
    { field: 'mentorName', headerName: 'Name',flex:0.8, width: 180,sortable: true,headerAlign: 'center',align: 'center' },
    { field: 'mentorEmail', headerName: 'Email',flex:1, width: 220 ,sortable: true,headerAlign: 'center',align: 'center' },
    { field: 'mentorPhone', headerName: 'Phone',flex:0.8, width: 130 ,sortable: true,headerAlign: 'center',align: 'center' },
    { field: 'meetingCount', headerName: 'Meetings',flex:0.5, width: 100,sortable: true,headerAlign: 'center',align: 'center' },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 300,
        headerAlign: 'center',
        align: 'center',

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

      <NavbarNew />

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
              </div>
            </div>

            <div className="space-y-3 flex-1 min-w-[200px]">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Enter Semester (1-8)"
                  value={semester}
                  onChange={handleSemesterChange}
                  onKeyDown={(e) => {
                    // Prevent typing non-numeric characters
                    if (!/[0-9]|\Backspace|\Tab/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={1}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

          {loading && showTable && <LoadingComponent />}
        
          {!loading && showTable && mentorMeetings.length > 0 && (
            <div className="mt-6 h-[400px] w-full custom-scrollbar">
              <ThemeProvider theme={darkTheme}>
                <DataGrid
                  rows={rows}
                  columns={columns}
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
                  sx={{
                    '& .MuiDataGrid-virtualScroller': {
                      overflowX: 'auto',
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px'
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(249, 115, 22, 0.5)',
                        borderRadius: '4px',
                        '&:hover': {
                          background: 'rgba(249, 115, 22, 0.7)'
                        }
                      }
                    }
                  }}
                />
              </ThemeProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageMeeting;
