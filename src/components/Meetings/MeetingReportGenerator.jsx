'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { generateMOMPdf, generateConsolidatedPdf } from './PDFGenerator';
import { PDFDownloadComponent } from './PDFGenerator';

const MeetingReportGenerator = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  // const [momDetails, setMomDetails] = useState({
  //   date: '',
  //   attendees: '',
  //   agenda: '',
  //   discussion: '',
  //   actionItems: ''
  // });
  const [isConsolidateDialogOpen, setIsConsolidateDialogOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    reportType: '',
    selectedMOM: ''
  });
  const [mentorMUJid, setMentorMUJid] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isMOMDetailDialogOpen, setIsMOMDetailDialogOpen] = useState(false);
  const [mentorName, setMentorName] = useState('');
  const [isGeneratingConsolidated, setIsGeneratingConsolidated] = useState(false);

  // const [mentees, setMentees] = useState([]);

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
    const value = e.target.value.toUpperCase();
    setMentorMUJid(value);
  };

  const fetchMeetingsWithData = async (data) => {
    if (!data || !data.academicYear || !data.academicSession || 
        !data.semester || !data.mentorMUJid) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const [startYear] = data.academicYear.split('-');
      const endYear = parseInt(startYear) + 1;
      const queryYear = data.academicSession.includes('JULY-DECEMBER') ? startYear : endYear;
      
      const response = await axios.get('/api/meetings/mentor', {
        params: {
          year: queryYear,
          session: data.academicSession.trim(),
          semester: data.semester,
          mentorMUJid: data.mentorMUJid
        }
      });

      if (response.data?.success) {
        const transformedMeetings = response.data.meetings.map(meeting => ({
          ...meeting,
          meeting_date: meeting.meeting_date || meeting.created_at,
          meeting_time: meeting.meeting_time || new Date(meeting.created_at).toLocaleTimeString(),
          mentor_id: meeting.mentorMUJid || data.mentorMUJid
        }));

        setMeetings(transformedMeetings);
        
        if (transformedMeetings.length === 0) {
          toast('No meetings found for the selected criteria', {
            icon: 'ℹ️',
          });
        }
        
        const completeData = {
          meetings: transformedMeetings,
          ...data
        };
        sessionStorage.setItem('mentorMeetingsData', JSON.stringify(completeData));
      }

    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    try {
      const reportData = sessionStorage.getItem('reportData');
      if (reportData) {
        const parsedData = JSON.parse(reportData);
        
        // Set states from parsed data
        setAcademicYear(parsedData.academicYear || '');
        setAcademicSession(parsedData.academicSession || '');
        setSemester(parsedData.semester || '');
        
        // Handle mentor data
        if (parsedData.meetings?.[0]) {
          setMentorName(parsedData.meetings[0].mentorName || '');
          setMentorMUJid(parsedData.meetings[0].MUJid || '');
          
          // Automatically fetch meetings with complete data
          fetchMeetingsWithData({
            academicYear: parsedData.academicYear,
            academicSession: parsedData.academicSession,
            semester: parsedData.semester,
            mentorMUJid: parsedData.meetings[0].MUJid
          });
        }
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }, []);

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setMomDetails(prev => ({
  //     ...prev,
  //     [name]: value
  //   }));
  // };

  // const handleGenerateMOM = () => {
  //   try {
  //     // Get data from sessionStorage
  //     const storedMeeting = JSON.parse(sessionStorage.getItem('selectedMeeting'));
      
  //     if (!storedMeeting) {
  //       throw new Error('No meeting data available');
  //     }
  
  //     // Format data according to PDFGenerator's expected structure
  //     const meetingData = {
  //       ...storedMeeting,
  //       // Map present_mentees_details to menteeDetails format expected by PDFGenerator
  //       menteeDetails: storedMeeting.present_mentees_details?.map(mentee => ({
  //         MUJid: mentee.MUJid,
  //         name: mentee.name,
  //         mujId: mentee.MUJid // This is what PDFGenerator expects for registration number
  //       })),
  //       present_mentees: storedMeeting.present_mentees || [], // Keep the original present_mentees array
  //       semester: semester,
  //       attendance: {
  //         total: storedMeeting.mentee_ids?.length || 0,
  //         present: storedMeeting.present_mentees?.length || 0,
  //         percentage: Math.round(
  //           (storedMeeting.present_mentees?.length || 0) / 
  //           (storedMeeting.mentee_ids?.length || 1) * 100
  //         )
  //       }
  //     };
  
  //     console.log('Formatted Meeting Data for PDF:', meetingData);
  //     return generateMOMPdf(meetingData, mentorName);
  //   } catch (error) {
  //     console.error('Error generating MOM:', error);
  //     toast.error('Failed to generate MOM report');
  //     return null;
  //   }
  // };

  const handleGenerateConsolidate = async () => {
    try {
      setIsGeneratingConsolidated(true);
      
      // Process meetings and attendance
      const attendanceCount = {};
      const processedMentees = new Map();
      
      // Process each meeting
      meetings.forEach(meeting => {
        const presentMentees = meeting.present_mentees || [];
        
        // Count attendance for present mentees
        presentMentees.forEach(menteeMUJid => {
          attendanceCount[menteeMUJid] = (attendanceCount[menteeMUJid] || 0) + 1;
        });

        // Process all mentees in the meeting
        meeting.mentee_ids?.forEach(menteeId => {
          if (!processedMentees.has(menteeId)) {
            processedMentees.set(menteeId, {
              MUJid: menteeId,
              name: meeting.mentee_details?.find(m => m.mujId === menteeId)?.name || 'Unknown',
              meetingsCount: 0,
              semester: semester
            });
          }
        });
      });

      // Update meetings count for each mentee
      processedMentees.forEach((mentee, MUJid) => {
        mentee.meetingsCount = attendanceCount[MUJid] || 0;
      });

      // Create consolidated data
      const consolidatedData = {
        meetings,
        academicYear,
        semester,
        mentorName,
        mentees: Array.from(processedMentees.values()),
        selectedSemester: semester
      };

      // Store consolidated data
      sessionStorage.setItem('consolidatedData', JSON.stringify(consolidatedData));

      return handleExportPdf('consolidated', consolidatedData);
    } catch (error) {
      console.error('Error generating consolidated report:', error);
      toast.error('Failed to generate consolidated report');
      return null;
    } finally {
      setIsGeneratingConsolidated(false);
    }
  };

  const renderFilterControls = () => (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-4 lg:mb-6">Filters</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        const data = {
          academicYear,
          academicSession,
          semester,
          mentorMUJid
        };
        fetchMeetingsWithData(data);
      }} className="space-y-4 lg:space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Academic Year</label>
          <input
            type="text"
            list="academicYears"
            placeholder="YYYY-YYYY"
            value={academicYear}
            onChange={handleAcademicYearChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <datalist id="academicYears">
            {academicYears.map((year, index) => (
              <option key={index} value={year} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Academic Session</label>
          <input
            type="text"
            list="academicSessions"
            placeholder="MONTH-MONTH YYYY"
            value={academicSession}
            onChange={handleAcademicSessionChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <datalist id="academicSessions">
            {academicSessions.map((session, index) => (
              <option key={index} value={session} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Semester</label>
          <input
            type="text"
            placeholder="Enter Semester"
            value={semester}
            onChange={handleSemesterChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Mentor MUJ ID</label>
          <input
            type="text"
            placeholder="Enter Mentor MUJ ID"
            value={mentorMUJid}
            onChange={handleMentorMUJidChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="pt-6 mt-auto">
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch Meetings'}
          </button>
        </div>
      </form>
    </div>
  );
  console.log("FUll Meeting Data: ", meetings);
  console.log('Selected Meetings Data with Notes:', selectedMeeting?.meeting_notes);
  console.log('Selected Meetings Present Mentees :', selectedMeeting?.present_mentees);
  // Add new helper function for MOM buttons
  const getMOMButtonLabel = (meetingIndex) => {
    return `MOM ${meetingIndex + 1}`; // Now returns MOM button label for all meetings
  };

  // Update the fetchMenteeDetails function
const fetchMenteeDetails = async (meeting) => {
    try {
        const response = await axios.get('/api/meetings/menteeDetails', {
            params: {
                mentorId: meeting.mentor_id || mentorMUJid,
                meetingId: meeting.meeting_id,
                year: academicYear.split('-')[1],
                session: academicSession
            }
        });

        if (response.data?.success) {
            // Log present mentees with their details
            console.log('Present Mentees with Details:', response.data.present_mentees);
            
            const meetingWithDetails = {
                ...meeting,
                meeting_notes: response.data.meeting_notes || meeting.meeting_notes || {},
                present_mentees_details: response.data.present_mentees || [], // Store the detailed information
                mentee_details: response.data.present_mentees || []
            };

            const updatedMeetings = meetings.map(m => 
                m.meeting_id === meeting.meeting_id ? meetingWithDetails : m
            );

            setMeetings(updatedMeetings);
            setSelectedMeeting(meetingWithDetails);
            sessionStorage.setItem('selectedMeeting', JSON.stringify(meetingWithDetails));
            return meetingWithDetails;
        } else {
            toast.error('Failed to load meeting details');
            return meeting;
        }
    } catch (error) {
        console.error('Error fetching mentee details:', error);
        toast.error('Error loading meeting details');
        return meeting;
    }
};

  // Add this console log in handleMOMButtonClick
const handleMOMClick = async (meeting) => {
    try {
        // First get meeting details
        const meetingDetails = await fetchMenteeDetails(meeting);
        
        if (meetingDetails) {
            // Format data for PDF generation
            const pdfData = {
                ...meetingDetails,
                semester,
                menteeDetails: meetingDetails.present_mentees_details?.map(mentee => ({
                    MUJid: mentee.MUJid,
                    name: mentee.name,
                    mujId: mentee.registrationNumber || mentee.MUJid
                })) || [],
                meeting_notes: meetingDetails.meeting_notes || {},
                meeting_date: meetingDetails.meeting_date,
                meeting_time: meetingDetails.meeting_time,
                meeting_id: meetingDetails.meeting_id
            };

            // Generate PDF document
            const document = generateMOMPdf(pdfData, mentorName);
            const fileName = `MOM_${meetingDetails.meeting_id}_${new Date().toLocaleDateString('en-US')}.pdf`;

            // Render download component directly
            return (
                <PDFDownloadComponent 
                    document={document}
                    fileName={fileName}
                    autoDownload={true}
                >
                    Download MOM Report
                </PDFDownloadComponent>
            );
        }
    } catch (error) {
        console.error('Error generating MOM:', error);
        toast.error('Failed to generate MOM report');
    }
};

  const renderAttendeeCount = (meeting) => (
    <div className="text-center min-w-[80px]">
      <span className="text-sm font-medium text-white/90">Attendees</span>
      <div className="flex flex-col gap-1 mt-1">
        <p className="text-sm text-white bg-white/5 px-3 py-2 rounded">
          {meeting.present_mentees?.length || 0} / {meeting.mentee_ids?.length || 0}
        </p>
        <span className={`text-xs ${
          ((meeting.present_mentees?.length || 0) / (meeting.mentee_ids?.length || 1) * 100) >= 75 
            ? 'text-green-400' 
            : 'text-orange-400'
        }`}>
          {Math.round((meeting.present_mentees?.length || 0) / (meeting.mentee_ids?.length || 1) * 100)}% attended
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
      className="bg-white/10 backdrop-blur-md rounded-xl p-4 hover:bg-white/15 transition-all flex flex-col"
    >
      {/* Meeting Card Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div className="flex gap-3 items-center">
          <span className="text-sm font-medium text-white">#{index + 1}</span>
          <span className="text-sm text-white/90">
            {new Date(meeting.meeting_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          <span className="text-sm text-white/90 bg-white/5 px-3 py-1 rounded-full">
            {meeting.meeting_time}
          </span>
        </div>
      </div>

      {/* Meeting Info */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <span className="text-sm font-medium text-white/90">Meeting ID</span>
          <p className="text-sm text-white bg-white/5 p-2 rounded mt-1 truncate">
            {meeting.meeting_id || 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-white/90">Mentor ID</span>
          <p className="text-sm text-white bg-white/5 p-2 rounded mt-1 truncate">
            {meeting.mentor_id || mentorMUJid || 'N/A'}
          </p>
        </div>
      </div>

      {/* Topic and Attendees */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <span className="text-sm font-medium text-white/90">Topic</span>
          <p className="text-sm text-white bg-white/5 p-2 rounded mt-1 line-clamp-2">
            {meeting.meeting_notes?.TopicOfDiscussion || 'N/A'}
          </p>
        </div>
        {renderAttendeeCount(meeting)}
      </div>

      {/* Dynamic MOM Button */}
      <div className="flex gap-3 mt-auto pt-3 border-t border-white/10">
        <PDFDownloadComponent
            document={generateMOMPdf({
                ...meeting,
                semester,
                menteeDetails: meeting.present_mentees_details?.map(mentee => ({
                    MUJid: mentee.MUJid,
                    name: mentee.name,
                    mujId: mentee.registrationNumber || mentee.MUJid
                })) || [],
                meeting_notes: meeting.meeting_notes || {},
            }, mentorName)}
            fileName={`MOM_${meeting.meeting_id}_${new Date().toLocaleDateString('en-US')}.pdf`}
        >
            {getMOMButtonLabel(index)}
        </PDFDownloadComponent>
      </div>
    </motion.div>
  );

  const renderMeetingsContent = () => (
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-md rounded-2xl">
      <div className="p-4 lg:p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Meeting Reports</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pr-2 lg:pr-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/70">Loading...</div>
          </div>
        ) : !meetings.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/70">No meetings found</div>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-6">  {/* Removed pb-16 */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3 lg:gap-4">
              {meetings.map((meeting, index) => renderMeetingCard(meeting, index))}
            </div>
  
            {/* Consolidated Report Button - Show in both mobile and desktop */}
            {meetings.length >= 3 ? (
              <button
                onClick={handleGenerateConsolidate}
                disabled={isGeneratingConsolidated}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingConsolidated ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Report...
                  </>
                ) : (
                  'Generate Consolidated Report'
                )}
              </button>
            ) : meetings.length > 0 ? (
              <div className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-center">
                <span className="text-sm text-white/70">
                  Complete {3 - meetings.length} more {3 - meetings.length === 1 ? 'meeting' : 'meetings'} to generate consolidated report
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );




const renderMOMDetailDialog = () => (
  <AnimatePresence>
    {isMOMDetailDialogOpen && (
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-hidden"
        open={isMOMDetailDialogOpen}
        onClose={() => setIsMOMDetailDialogOpen(false)}
        static
      >
        <div className="min-h-screen px-2 md:px-4 text-center">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="inline-block w-full max-w-[95vw] md:max-w-[85vw] h-[85vh] md:h-[80vh] text-left align-middle transform bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-slate-700/50 relative"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-800 to-transparent z-10">
              <div className="flex justify-between items-center px-6 py-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                    Meeting Details
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedMeeting && new Date(selectedMeeting.meeting_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsMOMDetailDialogOpen(false)}
                  className="rounded-full p-2 hover:bg-slate-700/50 transition-colors"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-700 px-4 py-4">
              <div className="pt-20 pb-20 px-6">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: "📅", label: "Academic Year", value: academicYear },
                    { icon: "🗓", label: "Academic Session", value: academicSession },
                    { icon: "📚", label: "Semester", value: semester },
                    { icon: "👤", label: "Mentor ID", value: mentorMUJid },
                    { icon: "🔑", label: "Meeting ID", value: selectedMeeting?.meeting_id }
                  ].map((item, index) => (
                    item.value && (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300">{item.label}</p>
                            <p className="text-base font-semibold text-white mt-1">{item.value}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  ))}
                </div>

                {/* Meeting Notes */}
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 mb-8">
                  <div className="p-6 border-b border-slate-700/50">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">📝</span> Meeting Notes
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {selectedMeeting?.meeting_notes && Object.entries(selectedMeeting.meeting_notes)
                        .map(([key, value], index) => (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                          >
                            <h5 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                              <span className="text-lg">📌</span>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {value || 'N/A'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Attendees Section */}
                {renderAttendeesList(selectedMeeting)}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
              <div className="flex justify-end gap-3 px-6 py-4">
                {handleExportPdf('mom', selectedMeeting)}
              </div>
            </div>
          </motion.div>
        </div>
      </Dialog>
    )}
  </AnimatePresence>
);

  const handleExportPdf = (type, data = null) => {
    try {
      let document;
      let fileName;

      if (type === 'mom') {
        // Format meeting data according to PDFGenerator's structure
        const formattedData = {
            ...data,
            semester,
            menteeDetails: data.present_mentees_details?.map(mentee => ({
                MUJid: mentee.MUJid,
                name: mentee.name,
                mujId: mentee.registrationNumber || mentee.MUJid
            })) || [],
            present_mentees: data.present_mentees || [],
            meeting_notes: data.meeting_notes || {},
            meeting_date: data.meeting_date,
            meeting_time: data.meeting_time,
            meeting_id: data.meeting_id
        };

        document = generateMOMPdf(formattedData, mentorName);
        fileName = `MOM_${data.meeting_id}_${new Date().toLocaleDateString('en-US')}.pdf`;

        return (
            <PDFDownloadComponent document={document} fileName={fileName}>
                Export Report
            </PDFDownloadComponent>
        );
    } else if (type === 'consolidated') {
        const consolidatedData = data || JSON.parse(sessionStorage.getItem('consolidatedData'));
        if (!consolidatedData) {
          throw new Error('No consolidated data available');
        }
        document = generateConsolidatedPdf(
          consolidatedData.meetings,
          consolidatedData.academicYear,
          consolidatedData.semester,
          consolidatedData.mentorName
        );
        fileName = `Consolidated_Report_${academicYear}_${semester}_${new Date().toLocaleDateString('en-US')}.pdf`;
      }

      return (
        <PDFDownloadComponent document={document} fileName={fileName}>
          Export Report
        </PDFDownloadComponent>
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error.message);
      return null;
    }
  };

  useEffect(() => {
    try {
      // Get report data from sessionStorage
      const storedReportData = sessionStorage.getItem('reportData');

      if (storedReportData) {
        const reportData = JSON.parse(storedReportData);
        
        // Set mentor details if available
        if (reportData.meetings?.[0]) {
          const mentorDetails = reportData.meetings[0];
          setMentorName(mentorDetails.mentorName || '');
          setMentorMUJid(mentorDetails.MUJid || '');
        }

        // Safely set the state values
        setAcademicYear(reportData.academicYear || getCurrentAcademicYear());
        setAcademicSession(reportData.academicSession || '');
        setSemester(reportData.semester || '');
        
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
          academicSession: reportData.academicSession || '',
          semester: reportData.semester || '',
          mentorMUJid: reportData.mentorMUJid || reportData.meetings?.[0]?.MUJid || ''
        };

        if (fetchData.academicYear && fetchData.academicSession && 
            fetchData.semester && fetchData.mentorMUJid) {
          fetchMeetingsWithData(fetchData);
        }
      }

      // Clean up storage after loading
      sessionStorage.removeItem('reportData');
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }, []);

  const renderAttendeesList = (meeting) => {
    if (!meeting) return null;

    // Filter only present mentees
    const presentMentees = meeting?.mentee_details?.filter(mentee => mentee.isPresent) || [];

    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">👥</span> Present Attendees
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {meeting?.attendance?.present || 0} present of {meeting?.attendance?.total || 0}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                (meeting?.attendance?.percentage || 0) >= 75 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-orange-500/10 text-orange-400'
              }`}>
                {meeting?.attendance?.percentage || 0}% Attendance
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {presentMentees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentMentees.map((mentee, index) => (
                <motion.div
                  key={mentee.MUJid || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border transition-all group
                    bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50"
                >
                  <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg
                    bg-gradient-to-br from-green-500 to-emerald-500"
                  >
                    {mentee.name?.charAt(0) || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate transition-colors
                      text-white group-hover:text-green-400"
                    >
                      {mentee.name || 'Name not available'}
                    </h5>
                    <p className="text-sm text-slate-400 truncate">{mentee.registrationNumber || mentee.MUJid}</p>
                    {mentee.yearOfRegistration && mentee.yearOfRegistration !== 'N/A' && (
                      <p className="text-xs text-slate-500">Reg. Year: {mentee.yearOfRegistration}</p>
                    )}7
                  </div>
                  <span className="text-green-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No attendees present in this meeting</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" /> {/* Add Toaster component */}
      <div className="min-h-screen bg-[#0a0a0a] overflow-y-auto"> {/* Removed pt-14 */}
        {/* Background effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Main content */}
        <div className="relative z-10 container mx-auto px-4 h-[calc(100vh-4rem)] pt-16">
          {/* Header */}
          <h1 className="text-3xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-3 text-center mt-2">
            Meeting Report Generator
          </h1>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full"> 
            <div className="lg:col-span-3">
              <div className="bg-white/8 px-4 rounded-2xl h-full">
                {renderFilterControls()}
              </div>
            </div>

            {/* Meeting Cards - Right Side */}
            <div className="lg:col-span-9 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar space-y-4">
                  {renderMeetingsContent()}
                </div>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <AnimatePresence mode="wait">
          {isMOMDetailDialogOpen && renderMOMDetailDialog()}
          {isConsolidateDialogOpen && (
            <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" open={isConsolidateDialogOpen} onClose={() => setIsConsolidateDialogOpen(false)}>
              <div className="min-h-screen px-4 text-center">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
                >
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Generate Consolidated Report
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Click the button below to generate a consolidated report of all meetings.
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                      onClick={handleGenerateConsolidate}
                    >
                      Generate Report
                    </button>
                  </div>
                </motion.div>
              </div>
            </Dialog>
          )}
        </AnimatePresence>
        {/* Action Menu */}
        {actionMenu.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setActionMenu(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }} 
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Report Options</h2>
                    <button
                      onClick={() => setActionMenu(prev => ({ ...prev, isOpen: false }))}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                  <button
                    onClick={() => handleReportAction('show', actionMenu.reportType, actionMenu.selectedMOM)}
                    className="block w-full text-left px-6 py-3 mb-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-lg"
                  >
                    Show Report
                  </button>
                  <button
                    onClick={() => handleReportAction('download', actionMenu.reportType, actionMenu.selectedMOM)}
                    className="block w-full text-left px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-lg"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
};

export default MeetingReportGenerator;