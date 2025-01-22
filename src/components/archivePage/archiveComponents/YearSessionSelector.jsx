'use client';
import { useState, useEffect } from 'react';
import { 
  getCurrentAcademicYear, 
  generateAcademicSessions, 
  validateAcademicYear 
} from '@/utils/academicYear';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const YearSessionSelector = ({ onSearch }) => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [sessions, setSessions] = useState([]);
  const [yearError, setYearError] = useState('');
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    const currentYear = getCurrentAcademicYear();
    setAcademicYear(currentYear.startYear + '-' + currentYear.endYear);
  }, []);

  useEffect(() => {
    if (validateAcademicYear(academicYear)) {
      const availableSessions = generateAcademicSessions(academicYear);
      setSessions(availableSessions);
      setYearError('');
    } else {
      setSessions([]);
      if (academicYear) {
        setYearError('Invalid academic year format (YYYY-YYYY)');
      }
    }
  }, [academicYear]);

  const handleSearch = () => {
    if (!academicYear || !academicSession) {
      if (!academicYear) setYearError('Academic year is required');
      if (!academicSession) setSessionError('Academic session is required');
      return;
    }
    onSearch({ academicYear, academicSession });
  };

  return (
    <div className="year-selector-container">
      <div className="header">
        <SearchIcon />
        <h2>Archive Filters</h2>
      </div>
      
      <label className="input-label">Academic Year</label>
      <input
        type="text"
        value={academicYear}
        onChange={(e) => {
          const value = e.target.value;
          if (value.length === 4 && /^\d{4}$/.test(value)) {
            setAcademicYear(`${value}-${parseInt(value) + 1}`);
          } else if (e.nativeEvent.inputType === 'deleteContentBackward') {
            setAcademicYear('');
          } else if (value.length < 4 && !isNaN(parseInt(value))) {
            setAcademicYear(value);
          }
        }}
        placeholder="Enter academic year"
        className={`custom-input ${yearError ? 'error' : ''}`}
      />
      {yearError && <span className="error-text">{yearError}</span>}
      
      <label className="input-label">Academic Session</label>
      <select
        value={academicSession}
        onChange={(e) => setAcademicSession(e.target.value)}
        className={`custom-select ${sessionError ? 'error' : ''}`}
        disabled={!academicYear}
      >
        <option value="">Select a session</option>
        {sessions.map((session) => (
          <option key={session} value={session}>
            {session}
          </option>
        ))}
      </select>
      {sessionError && <span className="error-text">{sessionError}</span>}

      <button
        className={`search-button ${(!academicYear || !academicSession) ? 'disabled' : ''}`}
        onClick={handleSearch}
        disabled={!academicYear || !academicSession}
      >
        <SearchIcon />
        <span>Search Archives</span>
      </button>

      <style jsx>{`
        .year-selector-container {
          height: 100%;
          border-radius: 24px;
          border: 1px solid rgba(249, 115, 22, 0.2);
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
          border-bottom: 2px dashed rgba(249, 115, 22, 0.4);
          padding-bottom: 16px;
          color: #f97316;
        }

        .header h2 {
          font-weight: 600;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .input-label {
          color: #f97316;
          font-weight: 600;
          letter-spacing: 0.5px;
          font-size: 0.875rem;
        }

        .custom-input, .custom-select {
          width: 100%;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid rgba(249, 115, 22, 0.3);
          background-color: #e0e0e0; /* Redesigned color */
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          color: #000000;
          &::placeholder {
            color: rgba(49, 49, 49, 0.5);
          }
        }

        .custom-input:hover, .custom-select:hover {
          border-color: #f97316;
        }

        .custom-input:focus, .custom-select:focus {
          border-color: #f97316;
          border-width: 2px;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
          outline: none;
        }

        .error {
          border-color: #dc2626;
        }

        .error-text {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .search-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background-color: #f97316;
          color: white;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 16px;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .search-button:hover:not(.disabled) {
          background-color: #ea580c;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
        }

        .search-button.disabled {
          background-color: #262626;
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default YearSessionSelector;