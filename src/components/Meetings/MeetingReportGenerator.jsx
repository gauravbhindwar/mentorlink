'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { generateMOMPdf, generateConsolidatedPdf } from './PDFGenerator';
import { PDFDownloadComponent } from './PDFGenerator';
import FilterListIcon from '@mui/icons-material/FilterList'; // Add this import at the top

const MeetingReportGenerator = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [momDetails, setMomDetails] = useState({
    date: '',
    attendees: '',
    agenda: '',
    discussion: '',
    actionItems: ''
  });
  const [isMOMDialogOpen, setIsMOMDialogOpen] = useState(false);
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
  const [showFilters, setShowFilters] = useState(false); // Add this state

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
    // Try to get stored filter data
    const storedFilters = sessionStorage.getItem('reportFilters');
    
    if (storedFilters) {
        try {
            const filters = JSON.parse(storedFilters);
            
            // Set filter values from stored data
            setAcademicYear(filters.academicYear);
            setAcademicSession(filters.academicSession);
            setSemester(filters.semester);
            setSection(filters.section);
            setMentorMUJid(filters.mentorMUJid);

            // Automatically fetch meetings after setting filters
            setTimeout(() => {
                fetchMeetings();
            }, 0);

            // Clear the stored filters after using them
            sessionStorage.removeItem('reportFilters');
        } catch (error) {
            console.error('Error parsing stored filters:', error);
        }
    } else {
        // If no stored filters, set default academic year and session
        const currentAcadYear = getCurrentAcademicYear();
        const sessions = generateAcademicSessions(currentAcadYear);
        setAcademicYear(currentAcadYear);
        setAcademicSession(sessions[0]);
    }
    
    // Set academic years list
    setAcademicYears([
        // ...existing academic years logic...
    ]);
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

  const handleSectionChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (/^[A-Z]?$/.test(value)) {
      setSection(value);
    }
  };

  const handleMentorMUJidChange = (e) => {
    const value = e.target.value.toUpperCase();
    setMentorMUJid(value);
  };

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      if (!academicYear || !academicSession || !semester || !mentorMUJid) {
        alert('Please fill in all required fields including Mentor MUJ ID.');
        setLoading(false);
        return;
      }

      // Fetch mentor details from session storage
      const storedMentorMeetings = sessionStorage.getItem('mentorMeetings');
      const mentorMeetings = storedMentorMeetings ? JSON.parse(storedMentorMeetings) : [];
      const mentor = mentorMeetings.find(m => m.MUJid === mentorMUJid);
      const mentorName = mentor ? mentor.mentorName : '';

      // First try to get mentee details from sessionStorage
      const storedMenteeData = sessionStorage.getItem('menteeDetails');
      const parsedMenteeData = storedMenteeData ? JSON.parse(storedMenteeData) : null;
      
      // Store mentee details if available
      if (parsedMenteeData) {
        setMenteeDetails(parsedMenteeData);
      }

      // Rest of your existing fetch logic
      const storedData = sessionStorage.getItem('mentorMeetingsData');
      const parsedData = storedData ? JSON.parse(storedData) : null;
      
      // Check if stored data matches current search criteria
      if (parsedData && 
          parsedData.academicYear === academicYear &&
          parsedData.academicSession === academicSession &&
          parsedData.semester === semester &&
          parsedData.mentorMUJid === mentorMUJid &&
          parsedData.section === section) {
        setMeetings(parsedData.meetings);
        setMentorName(parsedData.mentorName); // Set mentor name from stored data
        setLoading(false);
        return;
      }

      // If no matching stored data, fetch from API
      const response = await axios.get('/api/meetings/mentor', {
        params: {
          year: academicYear.split('-')[0],
          session: academicSession,
          semester,
          section,
          mentorMUJid,
          includeAttendees: true // Add this parameter
        }
      });

      // Transform the response to include mentee details if they're not already included
      const meetingsWithDetails = response.data.map(meeting => ({
        ...meeting,
        mentee_details: meeting.mentee_ids?.map(id => {
          const menteeDetail = parsedMenteeData?.find(m => m.mujId === id);
          return menteeDetail || {
            mujId: id,
            name: 'Name not found', 
            // Add any other default fields you need
          };
        }) || []
      }));

      const newData = {
        meetings: meetingsWithDetails,
        academicYear,
        academicSession,
        semester,
        section,
        mentorMUJid,
        mentorName // Add mentor name to the data
      };
      
      sessionStorage.setItem('mentorMeetingsData', JSON.stringify(newData));
      setMeetings(meetingsWithDetails);
      setMentorName(mentorName); // Set mentor name in state

    } catch (error) {
      console.error('Error fetching meetings:', error);
      alert(error.response?.data?.error || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get data from URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    const mentorId = urlParams.get('mentorMUJid');

    if (encodedData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        setInitialStates(decodedData, mentorId);
        
        // Store in sessionStorage
        sessionStorage.setItem('mentorMeetingsData', JSON.stringify(decodedData));
        if (mentorId) {
          sessionStorage.setItem('mentorMUJid', mentorId);
        }
      } catch (error) {
        console.error('Error parsing URL data:', error);
      }
    } else {
      // Try to get from sessionStorage if URL params aren't available
      const storedData = sessionStorage.getItem('mentorMeetingsData');
      const storedMentorId = sessionStorage.getItem('mentorMUJid');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setInitialStates(parsedData, storedMentorId);
        } catch (error) {
          console.error('Error parsing stored data:', error);
        }
      }
    }
  }, []);

  // Helper function to set initial states
  const setInitialStates = (data, mentorId) => {
    setAcademicYear(data.academicYear);
    setAcademicSession(data.academicSession);
    setSemester(data.semester);
    setSection(data.section);
    setMentorMUJid(mentorId || data.mentorMUJid);
    setMeetings(data.meetings);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMomDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateMOM = () => {
    const selectedMeeting = meetings.find(m => m.meeting_id === momDetails.meetingId);
    if (selectedMeeting) {
      console.log('Generating MOM Report:', { selectedMeeting, momDetails });
    }
  };

  const handleGenerateConsolidate = () => {
    const reportData = {
      academicYear,
      academicSession,
      semester,
      section,
      mentorMUJid,
      meetings
    };
    console.log(reportData)
  };

  const renderFilterControls = () => (
    <div  className="bg-gray/50 backdrop-blur-md rounded-2xl p-4 h-[90%] overflow-y-[auto] border border-orange-500"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}>
      <h2 className="text-lg font-semibold text-white mb-3">Filters</h2> {/* Reduced text size and margin */}
      <form onSubmit={(e) => { e.preventDefault(); fetchMeetings(); }} className="space-y-3"> {/* Reduced spacing */}
        {/* Update input containers */}
        <div>
          <label className="block text-xs font-medium text-white mb-1">Academic Year</label> {/* Smaller text and margin */}
          <input
            type="text"
            list="academicYears"
            placeholder="YYYY-YYYY"
            value={academicYear}
            onChange={handleAcademicYearChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <datalist id="academicYears">
            {academicYears.map((year, index) => (
              <option key={index} value={year} />
            ))}
          </datalist>
        </div>
        {/* Apply same changes to other input groups */}
        <div>
          <label className="block text-xs font-medium text-white mb-1">Academic Session</label>
          <input
            type="text"
            list="academicSessions"
            placeholder="MONTH-MONTH YYYY"
            value={academicSession}
            onChange={handleAcademicSessionChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <datalist id="academicSessions">
            {academicSessions.map((session, index) => (
              <option key={index} value={session} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-white mb-1">Semester</label>
          <input
            type="text"
            placeholder="Enter Semester"
            value={semester}
            onChange={handleSemesterChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white mb-1">Section</label>
          <input
            type="text"
            placeholder="Enter Section"
            value={section}
            onChange={handleSectionChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white mb-1">Mentor MUJ ID</label>
          <input
            type="text"
            placeholder="Enter Mentor MUJ ID"
            value={mentorMUJid}
            onChange={handleMentorMUJidChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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

  // Add new helper function for MOM buttons
  const getMOMButtonLabel = (meetingIndex) => {
    return `MOM ${meetingIndex + 1}`; // Now returns MOM button label for all meetings
  };

  const fetchMenteeDetails = async (meeting) => {
    try {
      const response = await axios.get('/api/meetings/menteeDetails', {
        params: {
          mentorId: meeting.mentor_id || mentorMUJid,
          meetingId: meeting.meeting_id,
          year: academicYear.split('-')[0],
          session: academicSession
        }
      });

      const meetingWithDetails = {
        ...meeting,
        mentee_details: response.data.mentee_details
      };

      // Update the meeting in meetings array
      const updatedMeetings = meetings.map(m => 
        m.meeting_id === meeting.meeting_id ? meetingWithDetails : m
      );

      // Update both session storage items
      const meetingsData = {
        meetings: updatedMeetings,
        academicYear,
        academicSession,
        semester,
        section,
        mentorMUJid
      };

      sessionStorage.setItem('mentorMeetingsData', JSON.stringify(meetingsData));
      sessionStorage.setItem('selectedMeeting', JSON.stringify(meetingWithDetails));

      // Update state
      setMeetings(updatedMeetings);
      setSelectedMeeting(meetingWithDetails);

      return meetingWithDetails;
    } catch (error) {
      console.error('Error fetching mentee details:', error);
      return meeting;
    }
  };

  const handleMOMButtonClick = async (meeting) => {
    // Set initial meeting data for smooth transition
    setSelectedMeeting({
      ...meeting,
      mentee_details: meeting.mentee_details || [] // Ensure we have an empty array if no details yet
    });
    setIsMOMDetailDialogOpen(true);
    
    try {
      const meetingWithDetails = await fetchMenteeDetails(meeting);
      if (meetingWithDetails) {
        setSelectedMeeting(meetingWithDetails);
        sessionStorage.setItem('selectedMeeting', JSON.stringify(meetingWithDetails));
        const storedMentorMeetings = sessionStorage.getItem('mentorMeetings');
        const mentorMeetings = storedMentorMeetings ? JSON.parse(storedMentorMeetings) : [];
        const mentor = mentorMeetings.find(m => m.MUJid === mentorMUJid);
        setMentorName(mentor ? mentor.mentorName : ''); // Set mentor name in state
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    }
  };

  const renderMeetingsContent = () => (
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-md rounded-2xl">
      <div className="p-3 border-b border-white/10"> {/* Reduced padding */}
        <h2 className="text-lg font-semibold text-white">Meeting Reports</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 pr-2 custom-scrollbar"> {/* Reduced padding */}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/70">Loading...</div>
          </div>
        ) : !meetings.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/70">No meetings found</div>
          </div>
        ) : (
          <div className="space-y-3">  {/* Reduced spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"> {/* Changed to 4 columns and reduced gap */}
              {meetings.map((meeting, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-4 hover:bg-gradient-to-br hover:from-primary/30 hover:to-secondary/30 transition-all flex flex-col shadow-lg"
                > {/* Reduced padding and border radius */}
                  {/* Meeting Card Header */}
                  <div className="flex items-center justify-between mb-2"> {/* Removed border and padding */}
                    <div className="flex items-center gap-2"> {/* Reduced gap */}
                      <span className="text-sm font-semibold text-white">#{index + 1}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-white/70">
                          {new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
    
                  {/* Meeting Info */}
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs"> {/* Reduced gap and text size */}
                    <div>
                      <span className="text-xs font-medium text-white/90">Meeting ID</span>
                      <p className="text-xs text-white bg-white/5 p-1.5 rounded mt-1 truncate">
                        {meeting.meeting_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-white/90">Mentor ID</span>
                      <p className="text-xs text-white bg-white/5 p-1.5 rounded mt-1 truncate">
                        {meeting.mentor_id || mentorMUJid || 'N/A'}
                      </p>
                    </div>
                  </div>
    
                  {/* Topic and Attendees */}
                  <div className="flex justify-between items-start gap-2 mb-2"> {/* Reduced gap */}
                    <div className="flex-1">
                      <span className="text-xs font-medium text-white/90">Topic</span>
                      <p className="text-xs text-white bg-white/5 p-1.5 rounded mt-1 line-clamp-2">
                        {meeting.meeting_notes.TopicOfDiscussion || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center min-w-[60px]"> {/* Reduced min-width */}
                      <span className="text-xs font-medium text-white/90">Attendees</span>
                      <p className="text-xs text-white bg-white/5 px-2 py-1 rounded mt-1">
                        {meeting.mentee_ids?.length || 0}
                      </p>
                    </div>
                  </div>
    
                  {/* MOM Button */}
                  <div className="mt-10 pt-4 border-t border-white/10"> {/* Reduced padding */}
                    <button
                      onClick={() => handleMOMButtonClick({
                        ...meeting,
                        mentorMUJid: mentorMUJid || sessionStorage.getItem('mentorMUJid')
                      })}
                      className="w-full px-2 py-1 text-xs font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg"
                    >
                      {getMOMButtonLabel(index)}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
  
            {/* Consolidated Report Button - Only visible on desktop */}
            <div className="hidden lg:block">
              {meetings.length >= 3 ? (
                <button
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg backdrop-blur-md"
                >
                  Generate Consolidated Report
                </button>
              ) : meetings.length > 0 ? (
                <div className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-center">
                  <span className="text-sm text-white/70">
                    Complete {3 - meetings.length} more {3 - meetings.length === 1 ? 'meeting' : 'meetings'} to generate consolidated report
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Removed unused handleMOMClick function

  const renderMOMDetailDialog = () => (
    <AnimatePresence>
      {isMOMDetailDialogOpen && (
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-hidden" // Changed from overflow-y-auto
          open={isMOMDetailDialogOpen}
          onClose={() => setIsMOMDetailDialogOpen(false)}
          static // Add this to prevent unmounting
        >
          <div className="min-h-screen px-2 md:px-4 text-center">
            <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring",
                duration: 0.5,
                bounce: 0.3
              }}
              className="inline-block w-full max-w-[95vw] md:max-w-[85vw] h-[90vh] md:h-[85vh] text-left align-middle transform bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100 relative"
            >
              {/* Fixed Header */}
              <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200">
                <div className="flex justify-between items-center px-6 py-4">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                      Meeting Details
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
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
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors group"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg 
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Scrollable Container */}
              <div className="h-full overflow-y-auto">
                {/* Content Container with Padding */}
                <div className="pt-20 pb-20 px-4 md:px-6">
                  {/* Basic Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                    {[
                      { label: "Academic Year", value: academicYear },
                      { label: "Academic Session", value: academicSession },
                      { label: "Semester", value: semester },
                      { label: "Section", value: section },
                      { label: "Mentor MUJ ID", value: mentorMUJid },
                      { label: "Meeting ID", value: selectedMeeting?.meeting_id }
                    ].map((item, index) => (
                      item.value && (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                          <p className="text-sm font-medium text-gray-600">{item.label}</p>
                          <p className="mt-1 text-base font-semibold text-gray-900">{item.value}</p>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Meeting Notes Section */}
                  <div className="bg-white rounded-xl border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">Meeting Notes</h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {selectedMeeting?.meeting_notes && Object.entries(selectedMeeting.meeting_notes)
                          .filter(([ value]) => value) // Only show non-empty values
                          .map(([key, value]) => (
                            <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </h5>
                              <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[100px] overflow-y-auto max-h-[200px]">
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {value || 'N/A'}
                                </p>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Attendees Section */}
                  <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Attendees</h4>
          <p className="text-sm text-gray-500 mt-1">
            Total Attendees: {selectedMeeting?.mentee_details?.length || 0}
          </p>
        </div>
        <div className="p-6">
          {selectedMeeting?.mentee_details && selectedMeeting.mentee_details.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {selectedMeeting.mentee_details.map((mentee, index) => (
                <div 
                  key={mentee.mujId || index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {mentee.name?.charAt(0) || 'M'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">{mentee.mujId}</h5>
                    <p className="text-sm text-gray-500">{mentee.name || 'Name not available'}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Present
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No attendee details available</p>
            </div>
          )}
        </div>
      </div>

                  {/* Attendees Section */}
                  <div className="bg-white rounded-xl border border-gray-200 mb-8">
                {/* ...existing attendees content... */}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
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

  const handleExportPdf = (type, meeting = null) => {
    try {
      const storedMeetingData = sessionStorage.getItem('selectedMeetingData');
      const meetingData = storedMeetingData ? JSON.parse(storedMeetingData) : meeting;

      if (!meetingData) {
        console.error('No meeting data available');
        return null;
      }

      const document = type === 'mom' 
        ? generateMOMPdf({
            ...meetingData,
            section,
            semester,
            academicYear
          }, mentorName) // Pass mentorName here
        : generateConsolidatedPdf(meetings, academicYear, semester, section, mentorName); // Pass mentorName here

      const fileName = type === 'mom'
        ? `MOM_${meetingData.meeting_id}_${new Date().toLocaleDateString('en-US')}.pdf`
        : `Consolidated_Report_${academicYear}_${semester}_${new Date().toLocaleDateString('en-US')}.pdf`;

      return (
        <PDFDownloadComponent document={document} fileName={fileName}>
          Export Report
        </PDFDownloadComponent>
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  return (
    // Update the main container to account for navbar height
    <div className="fixed inset-0 pt-16 bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      {/* Main content - Update height calculation */}
      <div className="relative z-10 h-[calc(100vh-64px)] overflow-hidden px-2 sm:px-4 lg:px-6">
        {/* Header section with filter toggle */}
        <div className="flex items-center justify-center px-4 py-2 lg:px-6 relative">
          <motion.h1 
            className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Meeting Report Generator
          </motion.h1>
          
          {/* Add Filter Toggle Button */}
          <motion.button
            className="lg:hidden absolute right-4 p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20"
            onClick={() => setShowFilters(!showFilters)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FilterListIcon sx={{ color: '#f97316' }} />
          </motion.button>
        </div>

        {/* Update grid layout container for responsive filters */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-2 sm:gap-3 ">
          {/* Filter Panel - Updated for responsive behavior */}
          <motion.div 
            className={`
              lg:relative fixed top-[84px] left-0 z-[100] lg:z-auto
              ${showFilters ? 'flex' : 'lg:flex hidden'}
              transition-all duration-300 ease-in-out
              h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)]
              w-full lg:w-auto
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Overlay for mobile */}
            {showFilters && (
              <motion.div
                className="lg:hidden fixed inset-0 top-[80px] bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
              />
            )}
            
            {/* Filter Content */}
            <div className={`
              relative lg:w-full w-[280px]
              h-full
              ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              transition-transform duration-300 ease-in-out
              overflow-hidden
            `}>
              {renderFilterControls()}
            </div>
          </motion.div>

          {/* Right Column - Meeting Cards */}
          <div className="h-full overflow-hidden">
            <div  className="bg-gray/50 backdrop-blur-md rounded-2xl p-4 h-[98%] overflow-y-[auto] border border-orange-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              {renderMeetingsContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Update dialogs and other content */}
      <AnimatePresence>
        {isMOMDetailDialogOpen && renderMOMDetailDialog()}
        {isMOMDialogOpen && (
          <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" open={isMOMDialogOpen} onClose={() => setIsMOMDialogOpen(false)}>
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
                  Generate MOM Report
                </Dialog.Title>
                <div className="mt-2">
                  <input
                    type="date"
                    name="date"
                    value={momDetails.date}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Date"
                  />
                  <input
                    type="text"
                    name="attendees"
                    value={momDetails.attendees}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Attendees"
                  />
                  <textarea
                    name="agenda"
                    value={momDetails.agenda}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Agenda"
                    rows="2"
                  />
                  <textarea
                    name="discussion"
                    value={momDetails.discussion}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Discussion"
                    rows="2"
                  />
                  <textarea
                    name="actionItems"
                    value={momDetails.actionItems}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Action Items"
                    rows="2"
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={handleGenerateMOM}
                  >
                    Generate Report
                  </button>
                </div>
              </motion.div>
            </div>
          </Dialog>
        )}
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
            className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-0"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }} 
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-[320px] sm:max-w-md">
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
  );
};

export default MeetingReportGenerator;
