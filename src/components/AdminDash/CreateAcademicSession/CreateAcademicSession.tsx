"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import NavbarNew from '@/components/subComponents/NavbarNew';

const CreateAcademicSession = () => {
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
        // Clear form after successful creation
        setAcademicYear('');
        setAcademicSession('');
        setSemesters('');
      } else {
        setCustomAlert('Failed to create academic session');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setCustomAlert(error.response.data?.error || 'Error creating academic session');
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
    
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
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

  const handleAcademicYearInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    if (value.length === 4 && !value.includes('-')) {
      value = `${value}-${parseInt(value) + 1}`;
    }
    
    if (value.length > 0) {
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
    } else if (value.startsWith('JAN')) {
      value = `JANUARY-JUNE ${academicYear?.split('-')[1]}`;
    }
    
    if (value.length > 0) {
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

  return (
    <AnimatePresence>
      <motion.div className="h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] overflow-hidden">
        <NavbarNew />

        <div className="h-[calc(100vh-64px)] mt-16 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto" // Changed from max-w-6xl to make form narrower
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
                      className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                        loading 
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
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAcademicSession;