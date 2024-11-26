'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { generateMOMPdf, generateConsolidatedPdf } from './PDFGenerator';
import { PDFViewer } from '@react-pdf/renderer';
import { PDFDownloadComponent } from './PDFGenerator';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isMOMDetailDialogOpen, setIsMOMDetailDialogOpen] = useState(false);
  const [pdfContent, setPdfContent] = useState(null);
  const [mentorName, setMentorName] = useState('');

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
        setReportData(decodedData);
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
      const storedData = sessionStorage.getItem('mentorMeeting');
      const storedMentorId = sessionStorage.getItem('mentorMUJid');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setReportData(parsedData);
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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-4 lg:mb-6">Filters</h2>
      <form onSubmit={(e) => { e.preventDefault(); fetchMeetings(); }} className="space-y-4 lg:space-y-6">
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
          <label className="block text-sm font-medium text-white mb-2">Section</label>
          <input
            type="text"
            placeholder="Enter Section"
            value={section}
            onChange={handleSectionChange}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3 lg:gap-4">
              {meetings.map((meeting, index) => (
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
                        {meeting.meeting_notes.TopicOfDiscussion || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <span className="text-sm font-medium text-white/90">Attendees</span>
                      <p className="text-sm text-white bg-white/5 px-3 py-2 rounded mt-1">
                        {meeting.mentee_ids?.length || 0}
                      </p>
                    </div>
                  </div>
    
                  {/* Dynamic MOM Button */}
                  <div className="flex gap-3 mt-auto pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleMOMButtonClick({
                        ...meeting,
                        mentorMUJid: mentorMUJid || sessionStorage.getItem('mentorMUJid')
                      })}
                      className="w-full px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium"
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

  const renderMeetingPreviewDialog = () => (
    <Dialog 
      as="div" 
      className="fixed inset-0 z-50 overflow-y-auto" 
      open={isPreviewOpen} 
      onClose={() => setIsPreviewOpen(false)}
    >
      <div className="min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
        >
          {previewData && (
            <>
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                  {previewData.momType} Details
                </Dialog.Title>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Meeting Basic Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Meeting Date</h4>
                    <p className="mt-1 text-sm text-gray-900">{previewData.displayDate}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Meeting Time</h4>
                    <p className="mt-1 text-sm text-gray-900">{previewData.meeting_time}</p>
                  </div>
                </div>

                {/* Meeting Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Meeting ID</h4>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {previewData.meeting_id}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Topic of Discussion</h4>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {previewData.meeting_notes?.TopicOfDiscussion || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Attendees</h4>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {previewData.mentee_ids?.length || 0} students
                    </p>
                  </div>

                  {previewData.meeting_notes?.Agenda && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Agenda</h4>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {previewData.meeting_notes.Agenda}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-end gap-3 border-t">
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setMomDetails({
                        ...momDetails,
                        meetingId: previewData.meeting_id,
                        date: previewData.meeting_date
                      });
                      setIsMOMDialogOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Generate MOM
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </Dialog>
  );

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
              <button
                onClick={() => handlePreviewPdf('mom', selectedMeeting)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
              >
                Preview Report
              </button>
              {handleExportPdf('mom', selectedMeeting)}
            </div>
          </div>
        </motion.div>
      </div>
    </Dialog>
      )}
    </AnimatePresence>
  );

  const handlePreviewPdf = (type, meeting = null) => {
    let PdfDocument;
    if (type === 'mom') {
      PdfDocument = generateMOMPdf(meeting, mentorName); // Pass mentorName here
    } else {
      PdfDocument = generateConsolidatedPdf(meetings, academicYear, semester, section, mentorName); // Pass mentorName here
    }
    
    setPdfContent(PdfDocument);
    setIsPreviewOpen(true);
  };

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

  const renderPdfPreviewDialog = () => (
    <Dialog
      as="div"
      className="fixed inset-0 z-50 overflow-y-auto"
      open={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <motion.div className="inline-block w-full max-w-5xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Meeting Report Preview
            </Dialog.Title>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="h-[80vh] w-full">
            <PDFViewer width="100%" height="100%">
              {pdfContent}
            </PDFViewer>
          </div>
        </motion.div>
      </div>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 min-h-screen">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4">
          Meeting Report Generator
        </h1>

        {/* Content Grid - Modified for mobile scrolling */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-20 lg:mb-0 lg:h-[calc(100vh-9rem)]">
          {/* Filters - Left Side */}
          <div className="lg:col-span-3 h-auto lg:h-full">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 h-full overflow-y-auto">
              {renderFilterControls()}
            </div>
          </div>

          {/* Meeting Cards - Right Side */}
          <div className="lg:col-span-9 h-auto lg:h-full">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl flex flex-col h-full">
              {renderMeetingsContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Modified Consolidated Report Button Container for mobile */}
      {meetings.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] to-transparent lg:hidden">
          <div className="max-w-3xl mx-auto">
            {meetings.length >= 3 ? (
              <button className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all text-sm font-medium shadow-lg backdrop-blur-md">
                Generate Consolidated Report
              </button>
            ) : (
              <div className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-center">
                <span className="text-sm text-white/70">
                  Complete {3 - meetings.length} more {3 - meetings.length === 1 ? 'meeting' : 'meetings'} to generate consolidated report
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs with modified mobile styles */}
      <AnimatePresence mode="wait">
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
        {isPreviewOpen && renderMeetingPreviewDialog()}
      </AnimatePresence>

      {/* Add PDF Preview Dialog */}
      {isPreviewOpen && renderPdfPreviewDialog()}

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
  );
};

export default MeetingReportGenerator;
