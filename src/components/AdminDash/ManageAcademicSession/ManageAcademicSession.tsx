"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
// import { useRouter } from 'next/navigation';
import Loader from '@/components/AdminDash/ManageAcademicSession/Loader';
import CustomAlert from './CustomAlert';
import dynamic from 'next/dynamic';
import animation from '@/assets/animations/animation.json';
import ToastAlert from './ToastAlert';

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface SessionType {
  name: string;
  isCurrent: boolean;
  semesters: {
    semester_number: number;
  }[];
}

interface AcademicSessionType {
  start_year: number;
  end_year: number;
  archivedAt: string | null;
  sessions: SessionType[];
  isCurrent: boolean;
}

interface SessionInfo {
  academicYear: string;
  sessionName: string;
  semesters: number[];
}

const getUpcomingSessionInfo = (currentSession: AcademicSessionType | null) => {
  if (!currentSession) return null;
  
  const currentName = currentSession.sessions[0].name;
  const isJulyDecember = currentName.includes('JULY-DECEMBER');
  const year = parseInt(currentName.split(' ').pop() || '');
  
  return {
    academicYear: `${year}-${year + 1}`,
    sessionName: isJulyDecember ? `JANUARY-JUNE ${year + 1}` : `JULY-DECEMBER ${year}`,
    start_year: isJulyDecember ? year : year,
    end_year: isJulyDecember ? year + 1 : year + 1
  };
};

const ManageAcademicSession = () => {
  // const router = useRouter();
  const [customAlert] = useState('');
  const [existingSessions, setExistingSessions] = useState<AcademicSessionType[]>([]);
  const [upcomingSession, setUpcomingSession] = useState<SessionInfo | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [showUpcomingOption, setShowUpcomingOption] = useState(false);
  const [isSessionExists, setIsSessionExists] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'status'
  const [toastInfo, setToastInfo] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'warning' | 'info' 
  });
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: 0,
    message: ''
  });
  const [changingCurrent, setChangingCurrent] = useState(false);  // Add this line

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastInfo({ visible: true, message, type });
  };

  const setLoading = (isLoading: boolean, progress: number = 0, message: string = 'Processing...') => {
    setLoadingState({ isLoading, progress, message });
  };

  const determineUpcomingSession = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // const currentYear = 2027;
    // const currentMonth = 1;
    
    // const currentYear = 2025;
    // const currentMonth = 7;
    // const currentYear = 2026;
    // const currentMonth = 1;

    // Determine current session first
    const currentSessionInfo = {
      academicYear: currentMonth <= 6 
        ? `${currentYear-1}-${currentYear}`
        : `${currentYear}-${currentYear+1}`,
      sessionName: currentMonth <= 6
        ? `JANUARY-JUNE ${currentYear}`
        : `JULY-DECEMBER ${currentYear}`,
      semesters: currentMonth <= 6 ? [2, 4, 6, 8] : [1, 3, 5, 7]
    };

    // Determine upcoming session
    const upcomingSessionInfo = currentMonth <= 6 
      ? {
          academicYear: `${currentYear}-${currentYear+1}`,
          sessionName: `JULY-DECEMBER ${currentYear}`,
          semesters: [1, 3, 5, 7]
        }
      : {
          academicYear: `${currentYear}-${currentYear+1}`,
          sessionName: `JANUARY-JUNE ${currentYear+1}`,
          semesters: [2, 4, 6, 8]
        };

    return { currentSessionInfo, upcomingSessionInfo };
  };

  const handleCreateAcademicSession = async () => {
    if ((!upcomingSession && !currentSession) || isSessionExists) return;

    setLoading(true);
    try {
      const sessionToCreate = upcomingSession || currentSession;
      if (!sessionToCreate) {
        showToast('No session selected to create', 'error');
        return;
      }

      const [startYear, endYear] = sessionToCreate.academicYear.split('-').map(Number);
      const sessionData = {
        start_year: startYear,
        end_year: endYear,
        sessions: [{
          name: sessionToCreate.sessionName,
          semesters: sessionToCreate.semesters.map(semester_number => ({
            semester_number,
            meetings: []
          }))
        }],
        // Note: isCurrent will be set automatically by the backend
        created_at: new Date(),
        updated_at: new Date()
      };

      const response = await axios.post('/api/admin/academicSession', sessionData);

      if (response.status === 200) {
        // Refresh the sessions list to get the updated current session
        const updatedSessions = await axios.get('/api/admin/academicSession');
        setExistingSessions(updatedSessions.data);
        
        showToast('Academic session created successfully', 'success');
        
        // Check for new sessions after creation
        const { currentSessionInfo, upcomingSessionInfo } = determineUpcomingSession();
        
        // Update state based on what exists
        const currentExists = updatedSessions.data.some(
          (session: AcademicSessionType) => 
          session.sessions.some(s => s.name === currentSessionInfo.sessionName)
        );
        const upcomingExists = updatedSessions.data.some(
          (session: AcademicSessionType) => 
          session.sessions.some(s => s.name === upcomingSessionInfo.sessionName)
        );

        setCurrentSession(currentExists ? null : currentSessionInfo);
        setUpcomingSession(upcomingExists ? null : upcomingSessionInfo);
        setShowUpcomingOption(!currentExists);
        setIsSessionExists(currentExists && upcomingExists);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        showToast(error.response.data?.error || 'Error creating academic session', 'error');
      } else {
        showToast('Error creating academic session', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveSession = async (startYear: number, endYear: number) => {
    setAlertConfig({
      title: 'Archive Session',
      message: 'Are you sure you want to archive this academic session?\nThis action cannot be undone.',
      onConfirm: async () => {
        try {
          setLoading(true, 0, 'Starting archive process...');
          
          const response = await axios.put('/api/admin/academicSession/archive', {
            start_year: startYear,
            end_year: endYear
          });

          if (response.status === 200) {
            setLoading(true, 50, 'Archive complete, refreshing data...');
            
            // Refresh the sessions list
            const updatedSessions = await axios.get('/api/admin/academicSession');
            setExistingSessions(updatedSessions.data);
            
            setLoading(true, 100, 'Completed!');
            showToast('Session archived successfully', 'success');
            
            // Display statistics
            const stats = response.data.stats;
            if (stats) {
              showToast(
                `Archived ${stats.archivedMeetings} meetings and processed ${stats.graduatedMentees} graduating mentees`,
                'info'
              );
            }
          }
        } catch (error) {
          console.error('Archive error:', error);
          if (axios.isAxiosError(error) && error.response) {
            showToast(
              `Error: ${error.response.data?.error || 'Failed to archive session'}`,
              'error'
            );
          } else {
            showToast('Failed to archive session', 'error');
          }
        } finally {
          setLoading(false);
          setShowAlert(false);
        }
      }
    });
    setShowAlert(true);
  };

  const handleChangeCurrentSession = async () => {
    const currentSession = existingSessions.find(s => s.isCurrent);
    if (!currentSession) {
      showToast('No current session found', 'error');
      return;
    }
  
    const upcomingInfo = getUpcomingSessionInfo(currentSession);
    if (!upcomingInfo) {
      showToast('Could not determine upcoming session', 'error');
      return;
    }
  
    // Find the upcoming session in existing sessions
    const upcomingSession = existingSessions.find(s => 
      s.start_year === upcomingInfo.start_year && 
      s.sessions.some(sess => sess.name === upcomingInfo.sessionName)
    );
  
    if (!upcomingSession) {
      showToast('Upcoming session not found. Please create it first.', 'error');
      return;
    }  
    setAlertConfig({
      title: 'Change Current Session',
      message: `Are you sure you want to change the current session?\n\nThis will:\n1. Archive the current session\n2. Increment all mentees' semesters\n3. Update academic years for mentors and mentees\n4. Set ${upcomingInfo.sessionName} as the current session`,
      onConfirm: async () => {
        setChangingCurrent(true);  // Add this line
        setLoading(true, 0, 'Initiating session change...');
        try {
          setLoading(true, 25, 'Updating current session...');
          const response = await axios.put('/api/admin/academicSession/changeToUpcoming', {
            currentSession: {
              start_year: currentSession.start_year,
              end_year: currentSession.end_year
            },
            upcomingSession: {
              start_year: upcomingInfo.start_year,
              end_year: upcomingInfo.end_year,
              sessionName: upcomingInfo.sessionName
            }
          });
      
          if (response.status === 200) {
            setLoading(true, 75, 'Refreshing session data...');
            const updatedSessions = await axios.get('/api/admin/academicSession');
            setExistingSessions(updatedSessions.data);
            setLoading(true, 100, 'Completed!');
            showToast('Session changed successfully', 'success');
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            showToast(error.response.data?.error || 'Error changing session', 'error');
          } else {
            showToast('Error changing session', 'error');
          }
        } finally {
          setTimeout(() => {
            setLoading(false);
            setChangingCurrent(false);  // Add this line
          }, 500);
        }
      }
    });
    setShowAlert(true);
  };

  const getSessionStatus = (session: AcademicSessionType) => {
    if (session.archivedAt) return 'archived';  // Changed from isArchived to archivedAt check
    if (session.isCurrent) return 'current';
    
    const currentSession = existingSessions.find(s => s.isCurrent);
    if (!currentSession) return 'archived';
  
    const upcomingInfo = getUpcomingSessionInfo(currentSession);
    const isUpcoming = upcomingInfo && 
      session.start_year === upcomingInfo.start_year && 
      session.sessions.some(s => s.name === upcomingInfo.sessionName);
  
    return isUpcoming ? 'upcoming' : 'archived';
  };

  const renderStatusChip = (status: string) => {
    const statusConfig = {
      current: {
        bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
        border: 'border-green-500/30',
        text: 'text-green-400',
        icon: (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
        ),
        label: 'Current'
      },
      upcoming: {
        bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: (
          <span className="w-2 h-2 rounded-full bg-blue-400"/>
        ),
        label: 'Upcoming'
      },
      archived: {
        bg: 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20', 
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
          </svg>
        ),
        label: 'Archived'
      }
    };
  
    const config = statusConfig[status as keyof typeof statusConfig];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border} backdrop-blur-sm flex items-center gap-1.5 shadow-sm`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getFilteredAndSortedSessions = () => {
    let filtered = [...existingSessions];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        `${session.start_year}-${session.end_year}`.includes(searchTerm) ||
        session.sessions.some(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.start_year - b.start_year;
        case 'status':
          const statusOrder = {
            current: 1,
            upcoming: 2,
            archived: 3
          };
          const statusA = getSessionStatus(a);
          const statusB = getSessionStatus(b);
          return statusOrder[statusA as keyof typeof statusOrder] - 
                 statusOrder[statusB as keyof typeof statusOrder];
        default: // 'newest'
          return b.start_year - a.start_year;
      }
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/admin/academicSession');
        setExistingSessions(response.data);
        
        const { currentSessionInfo, upcomingSessionInfo } = determineUpcomingSession();
        
        // Check if current session exists
        const currentExists = response.data.some((session: AcademicSessionType) => 
          session.sessions.some(s => s.name === currentSessionInfo.sessionName)
        );

        // Check if upcoming session exists
        const upcomingExists = response.data.some((session: AcademicSessionType) => 
          session.sessions.some(s => s.name === upcomingSessionInfo.sessionName)
        );

        if (!currentExists) {
          setCurrentSession(currentSessionInfo);
          setUpcomingSession(null);
          setShowUpcomingOption(false);
        } else if (!upcomingExists) {
          setCurrentSession(null);
          setUpcomingSession(upcomingSessionInfo);
          setShowUpcomingOption(true);
        }

        setIsSessionExists(currentExists && upcomingExists);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen pt-8 sm:pt-16 bg-[#0a0a0a] bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#2a2a2a]">
      <ToastAlert
        isVisible={toastInfo.visible}
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo(prev => ({ ...prev, visible: false }))}
      />
      {/* Custom Alert */}
      <CustomAlert
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
      />

      {/* Loading Overlay */}
      {loadingState.isLoading && (
        <Loader 
          size="lg"
          percentage={loadingState.progress}
          message={loadingState.message}
          showOverlay={true}
          color="white"
        />
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Academic Session Management
          </h1>
          <div className="h-0.5 w-20 sm:w-24 mx-auto bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full mt-2" />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Left Column - Create Session */}
          <div className="lg:col-span-5 space-y-3 sm:space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/5 shadow-xl h-auto sm:h-[calc(100vh-340px)]"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Session
                </h2>
                {isSessionExists && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-400 rounded-md">
                      Up to Date
                    </span>
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Session Cards - Show only if not up to date */}
              {!isSessionExists ? (
                <div className="space-y-2 sm:space-y-3">
                  {currentSession && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
                    >
                      {/* Current Session Content */}
                      <div className="relative z-10">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
                          Active Period
                        </span>
                        <h3 className="text-xl text-white mt-3">{currentSession.academicYear}</h3>
                        <p className="text-gray-400 text-sm mt-0.5">{currentSession.sessionName}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {currentSession.semesters.map((sem) => (
                            <span key={sem} className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300">
                              Sem {sem}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleCreateAcademicSession()}
                          disabled={loadingState.isLoading}
                          className="mt-3 sm:mt-4 w-full py-1.5 sm:py-2 px-3 rounded-md text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loadingState.isLoading ? (
                            <>
                              <Loader size="sm" />
                              <span>Creating...</span>
                            </>
                          ) : (
                            'Create Current Session'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Upcoming Session Card - Similar compact styling */}
                  {showUpcomingOption && upcomingSession && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
                    >
                      {/* Similar compact styling for upcoming session content */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            Upcoming Session
                          </span>
                          <h3 className="text-xl text-white mt-3 font-medium">{upcomingSession.academicYear}</h3>
                          <p className="text-gray-400 mt-1">{upcomingSession.sessionName}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {upcomingSession.semesters.map((sem) => (
                              <span key={sem} className="px-2 py-1 rounded-md text-xs bg-white/5 text-gray-400">
                                Semester {sem}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateAcademicSession()}
                        disabled={loadingState.isLoading}
                        className="mt-4 w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
                      >
                        {loadingState.isLoading ? 'Creating...' : 'Create Upcoming Session'}
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
                  <div className="w-40 h-40 sm:w-56 sm:h-56 mb-6 sm:mb-8"> {/* Increased size from w-48 h-48 */}
                    {typeof window !== 'undefined' && (
                      <Lottie
                        animationData={animation}
                        loop={true}
                        autoplay={true}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-4" // Increased spacing
                  >
                    <h3 className="text-2xl font-medium bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                      All Sessions On Track!
                    </h3>
                    <p className="text-sm text-gray-400 max-w-md"> {/* Increased max-width */}
                      Your academic calendar is fully synchronized and up to date. The system is actively monitoring session timelines and will notify you when the next academic period needs to be created.
                    </p>
                    {/* <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <svg className="w-4.5 h-4.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-400">Calendar Synchronized</span>
                    </div> */}
                  </motion.div>
                </div>
              )}

              {/* Alert Messages */}
              {customAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-orange-500/10 rounded-md p-3"
                >
                  <p className="text-xs text-center text-orange-500">{customAlert}</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Session History */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/5 shadow-xl"
            >
              {/* Session History Header */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Sessions
                  </h2>
                  <button
                    onClick={handleChangeCurrentSession}
                    disabled={changingCurrent}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    {changingCurrent ? (
                      <>
                        <Loader size="sm" />
                        <span>Changing...</span>
                      </>
                    ) : (
                      'Change to Upcoming'
                    )}
                  </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <svg 
                      className="absolute right-3 top-2.5 w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                    <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-black/30 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/20 transition-all duration-200 hover:bg-black/40"
                    >
                      <option value="newest" className="bg-gray-900">Newest First</option>
                      <option value="oldest" className="bg-gray-900">Oldest First</option>
                      <option value="status" className="bg-gray-900">By Status</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    </div>
                </div>
              </div>

              {/* Session List */}
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 max-h-[60vh] sm:max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar pr-2">
                {getFilteredAndSortedSessions().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-gray-900/30 rounded-lg border border-white/5">
                    <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-400 text-sm">
                      {searchTerm ? 'No sessions match your search' : 'No sessions found'}
                    </p>
                  </div>
                ) : (
                  getFilteredAndSortedSessions().map((session, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all duration-300"
                    >
                      {/* Simplified session card content with adjusted spacing */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl text-white font-medium">
                                {session.start_year}-{session.end_year}
                              </h3>
                              <div className="flex gap-2">
                                {renderStatusChip(getSessionStatus(session))}
                              </div>
                            </div>
                            
                            {/* Show archive history for current session */}
                            {session.isCurrent && session.archivedAt && (
                              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Last archived: {formatDateTime(session.archivedAt)}
                              </span>
                            )}
                          </div>
                          
                          {session.sessions.map((s, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300">{s.name}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {s.semesters.map((sem, semIdx) => (
                                  <span key={semIdx} className="px-2 py-1 rounded-md text-xs bg-white/5 text-gray-400">
                                    Semester {sem.semester_number}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2">
                          {session.isCurrent && (
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleArchiveSession(session.start_year, session.end_year)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/20 transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
                              disabled={loadingState.isLoading}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                              </svg>
                              {loadingState.isLoading ? 'Archiving...' : 'Archive Session'}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
};

export default ManageAcademicSession;