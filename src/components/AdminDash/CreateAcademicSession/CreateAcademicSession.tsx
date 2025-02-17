"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface AcademicSessionType {
  start_year: number;
  end_year: number;
  sessions: {
    name: string;
    semesters: {
      semester_number: number;
    }[];
  }[];
}

const CreateAcademicSession = () => {
  const router = useRouter();
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [customAlert, setCustomAlert] = useState('');
  const [loading, setLoading] = useState(false);
  const [yearSuggestions, setYearSuggestions] = useState<string[]>([]);
  const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);
  const [semesters, setSemesters] = useState('');
  const [semesterError, setSemesterError] = useState('');
  const [existingSessions, setExistingSessions] = useState<AcademicSessionType[]>([]);
  const [showPastYearWarning, setShowPastYearWarning] = useState(false);
  const [pendingYearValue, setPendingYearValue] = useState('');
  const [activeButton, setActiveButton] = useState<'cancel' | 'confirm'>('cancel');
  const dialogRef = useRef<HTMLDivElement>(null);

  const validateAndParseSemesters = (input: string): number[] | null => {
    const semesterArray: number[] = input.split(',').map(s => parseInt(s.trim()));
    const isValid: boolean = semesterArray.every(s =>
      !isNaN(s) && s >= 1 && s <= 8 &&
      ((academicSession.includes('JULY-DECEMBER') && s % 2 === 1) ||
        (academicSession.includes('JANUARY-JUNE') && s % 2 === 0))
    );

    if (!isValid) {
      setSemesterError('Invalid semesters. Must be comma-separated odd (1,3,5,7) for July-Dec or even (2,4,6,8) for Jan-June');
      return null;
    }
    setSemesterError('');
    return semesterArray;
  };

  const handleCreateAcademicSession = async () => {
    setLoading(true);
    try {
      const semesterArray = validateAndParseSemesters(semesters);

      if (!semesterArray) {
        setLoading(false);
        return;
      }

      const [startYear, endYear] = academicYear.split('-').map(Number);
      const sessionData = {
        start_year: startYear,
        end_year: endYear,
        sessions: [{
          name: academicSession,
          semesters: semesterArray.map(semester_number => ({
            semester_number,
            meetings: [] // Remove sections array
          }))
        }],
        created_at: new Date(),
        updated_at: new Date()
      };

      const response = await axios.post('/api/admin/academicSession', sessionData);

      if (response.status === 200) {
        setCustomAlert('Academic session created successfully');
        setShowRedirectDialog(true);

        // Start countdown
        let timeLeft = 3;
        const countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);

          if (timeLeft === 0) {
            clearInterval(countdownInterval);
            router.push('/pages/admin/admindashboard');
          }
        }, 1000);

        // Clear form
        setAcademicYear('');
        setAcademicSession('');
        setSemesters('');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) {
          setCustomAlert('This academic session already exists');
        } else {
          setCustomAlert(error.response.data?.error || 'Error creating academic session');
        }
      } else {
        setCustomAlert('Error creating academic session');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateYearSuggestions = (input: string) => {
    if (!input) return [];
    const currentYear = new Date().getFullYear();
    const suggestions = [];

    // Only allow current year and next year
    for (let i = 0; i < 2; i++) {
      const year = currentYear + i;
      const academicYear = `${year}-${year + 1}`;
      if (academicYear.startsWith(input)) {
        suggestions.push(academicYear);
      }
    }
    return suggestions;
  };

  const generateSessionSuggestions = (input: string) => {
    if (!academicYear || !input) return [];
    const [startYear, endYear] = academicYear.split('-');
    const possibleSessions = [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`
    ];

    return possibleSessions.filter(session =>
      session.toLowerCase().includes(input.toLowerCase())
    );
  };

  const handlePastYearConfirmation = () => {
    setAcademicYear(pendingYearValue);
    setShowPastYearWarning(false);
    const sessions = generateSessionSuggestions(pendingYearValue);
    if (sessions.length > 0) {
      setAcademicSession(sessions[0]);
    }
  };

  const handleAcademicYearInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    const currentYear = new Date().getFullYear();

    if (value.length === 4 && !value.includes('-')) {
      const startYear = parseInt(value);
      // Auto-complete year range for any valid year
      if (!isNaN(startYear)) {
        value = `${value}-${startYear + 1}`;
      }
    }

    // Validate the full year range
    if (/^\d{4}-\d{4}$/.test(value)) {
      const [startYear, endYear] = value.split('-').map(Number);
      
      // Only show warning for past years
      if (startYear < currentYear) {
        setPendingYearValue(value);
        setShowPastYearWarning(true);
        return;
      }
      
      // Validate that end year is start year + 1
      if (endYear !== startYear + 1) {
        value = '';
        setCustomAlert('Invalid year range. End year must be start year + 1');
      } else {
        setShowYearOptions(false);
      }
    } else if (value.length > 0) {
      setYearSuggestions(generateYearSuggestions(value));
      setShowYearOptions(true);
    } else {
      setYearSuggestions([]);
      setShowYearOptions(false);
    }

    setAcademicYear(value);
  };

  const handleAcademicSessionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();

    if (value.startsWith('JUL')) {
      value = `JULY-DECEMBER ${academicYear?.split('-')[0]}`;
      setShowSessionOptions(false);
    } else if (value.startsWith('JAN')) {
      value = `JANUARY-JUNE ${academicYear?.split('-')[1]}`;
      setShowSessionOptions(false);
    } else if (value.length > 0) {
      setSessionSuggestions(generateSessionSuggestions(value));
      setShowSessionOptions(true);
    } else {
      setSessionSuggestions([]);
      setShowSessionOptions(false);
    }

    setAcademicSession(value);
  };

  const formatSemesters = (input: string) => {
    // Split by commas and handle multiple commas
    const parts = input.split(/,+/).filter((part: string) => part.trim() !== '');

    // Process each part to extract numbers
    const numbers: string = parts.map((part: string) => part.replace(/[^0-9]/g, '')).join('');

    // Filter valid numbers based on session
    const validNumbers = [...numbers].filter(n => {
      const num = parseInt(n);
      return academicSession.includes('JULY-DECEMBER') ?
        (num % 2 === 1 && num <= 7) :
        (num % 2 === 0 && num <= 8);
    });

    // Return empty string if no valid numbers
    if (validNumbers.length === 0) return '';

    // Join with commas
    return validNumbers.join(',');
  };

  const handleSemesterInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Allow commas in input
    if (value.endsWith(',,')) {
      value = value.slice(0, -1);
    }
    const formatted = formatSemesters(value);
    setSemesters(formatted);

    const showError = value.length > 0 && formatted.length === 0;
    setSemesterError(showError ? 'Invalid semesters' : '');
  };

  const handleDialogKeyDown = (e: KeyboardEvent) => {
    if (!showPastYearWarning) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault(); // Prevent any default escape behavior
        setShowPastYearWarning(false);
        break;
      case 'ArrowRight':
        setActiveButton('confirm');
        break;
      case 'ArrowLeft':
        setActiveButton('cancel');
        break;
      case 'Enter':
        if (activeButton === 'cancel') {
          setShowPastYearWarning(false);
        } else {
          handlePastYearConfirmation();
        }
        break;
    }
  };

  useEffect(() => {
    if (showPastYearWarning) {
      document.addEventListener('keydown', handleDialogKeyDown);
      dialogRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
    };
  }, [showPastYearWarning, activeButton]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYearOptions(false);
      }
      if (sessionRef.current && !sessionRef.current.contains(event.target as Node)) {
        setShowSessionOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/admin/academicSession');
        setExistingSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <AnimatePresence>
      <motion.div className="h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] overflow-hidden">

        {/* Redirect Dialog */}
        <AnimatePresence>
          {showRedirectDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-900 border border-white/10 rounded-xl p-6 shadow-2xl max-w-md w-full"
              >
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Academic Session Created Successfully
                  </h3>
                  <p className="text-gray-400">
                    Redirecting to dashboard in {countdown} seconds...
                  </p>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 3, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPastYearWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                ref={dialogRef}
                tabIndex={-1}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-900 border border-white/10 rounded-xl p-6 shadow-2xl max-w-md w-full"
              >
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Past Academic Year Warning
                  </h3>
                  <p className="text-gray-400">
                    You are creating an academic session for a past year. Are you sure you want to continue?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPastYearWarning(false)}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-white ${
                        activeButton === 'cancel'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                      onFocus={() => setActiveButton('cancel')}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePastYearConfirmation}
                      className={`flex-1 px-4 py-2 rounded-lg transition-all text-white ${
                        activeButton === 'confirm'
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onFocus={() => setActiveButton('confirm')}
                    >
                      Continue Anyway
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[calc(100vh-64px)] mt-16 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
                  Create Academic Session
                </h1>

                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/5">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    {/* Year and Session Inputs Row */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Academic Year Input */}
                      <div ref={yearRef} className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Academic Year
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="YYYY-YYYY"
                            value={academicYear}
                            onChange={handleAcademicYearInput}
                            onClick={() => setShowYearOptions(true)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                          />
                          {showYearOptions && (
                            <div className="absolute z-20 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-2xl backdrop-blur-xl">
                              {yearSuggestions.map(year => (
                                <div
                                  key={year}
                                  className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white text-sm transition-colors"
                                  onClick={() => {
                                    setAcademicYear(year);
                                    setShowYearOptions(false);
                                    const sessions = generateSessionSuggestions(year);
                                    if (sessions.length > 0) {
                                      setAcademicSession(sessions[0]);
                                    }
                                  }}
                                >
                                  {year}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Academic Session Input */}
                      <div ref={sessionRef} className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Academic Session
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="MONTH-MONTH YYYY"
                            value={academicSession}
                            onChange={handleAcademicSessionInput}
                            onClick={() => setShowSessionOptions(true)}
                            disabled={!academicYear}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all disabled:opacity-50"
                          />
                          {showSessionOptions && sessionSuggestions.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-2xl backdrop-blur-xl">
                              {sessionSuggestions.map((session, index) => (
                                <div
                                  key={index}
                                  className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white text-sm transition-colors"
                                  onClick={() => {
                                    setAcademicSession(session);
                                    setShowSessionOptions(false);
                                    // Clear any existing semester and section data
                                    setSemesters('');
                                  }}
                                >
                                  {session}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Semesters Row */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Semesters
                        </label>
                        <input
                          type="text"
                          placeholder={academicSession.includes('JULY-DECEMBER') ? "1,3,5,7" : "2,4,6,8"}
                          value={semesters}
                          onChange={handleSemesterInput}
                          disabled={!academicSession}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all disabled:opacity-50"
                        />
                        {semesterError && (
                          <p className="text-red-500 text-xs mt-1">{semesterError}</p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${loading
                            ? 'bg-orange-500/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'
                          }`}
                        disabled={loading}
                        onClick={handleCreateAcademicSession}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                          </span>
                        ) : (
                          'Create Academic Session'
                        )}
                      </button>
                      {customAlert && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className='text-sm text-center mt-3 font-medium text-orange-500'
                        >
                          {customAlert}
                        </motion.p>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>

              {/* Existing Sessions Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full"
              >
                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/5">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Existing Academic Sessions
                  </h2>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {existingSessions.map((session, index) => (
                      <div
                        key={index}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-orange-500/30 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-medium">
                              {session.start_year}-{session.end_year}
                            </h3>
                            {session.sessions.map((s, idx) => (
                              <div key={idx} className="mt-2">
                                <p className="text-gray-400 text-sm">{s.name}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Semesters: {s.semesters.map(sem => sem.semester_number).join(', ')}
                                </p>
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                            {session.sessions.length} session{session.sessions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}

                    {existingSessions.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No academic sessions found
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAcademicSession;