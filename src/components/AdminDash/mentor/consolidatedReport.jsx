"use client";
import { useState, useEffect } from "react";
import RemarksDialog from "./RemarksDialog";
import ConfirmDialog from './ConfirmDialog';
import { PDFDownloadComponent, ConsolidatedDocument } from "../../../components/Meetings/PDFGenerator";

const ConsolidatedReport = () => {
  const [mentorId, setMentorId] = useState("");
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [mentorName, setMentorName] = useState("");
  const [originalRemarks, setOriginalRemarks] = useState({});
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    currentMUJid: null,
    currentValue: "",
  });
  const [changeCount, setChangeCount] = useState(0);  // Add this new state
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [currentFocus, setCurrentFocus] = useState(-1);
  const [meetingsBySemester, setMeetingsBySemester] = useState({});
  const [parsedMeetingdata, setParsedMeetingdata] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const currentMonth = new Date().getMonth();
    return currentMonth >= 0 && currentMonth <= 5 ? 4 : 3; // Default to 4 for even, 3 for odd
  });
  const [meetingsCount, setMeetingsCount] = useState({});
  const [meetings, setMeetings] = useState([]);  // Ensure meetings state is properly initialized

  useEffect(() => {
    const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
    if (mentorData && mentorData.MUJid) {
      setMentorId(mentorData.MUJid);
      setMentorName(mentorData.name);
      fetchLocalMeetingData();
    }
  }, []);

  useEffect(() => {
    console.log("Fetching meeting data from session storage on mount");
    fetchLocalMeetingData();  
  }, []);

  const fetchLocalMeetingData = async () => {
    console.log("Fetching meeting data from session storage");
    try {
      const meetingData = sessionStorage.getItem('meetingData');
      if (!meetingData) {
        throw new Error("No meeting data found in session storage");
      }
      const parsedData = JSON.parse(meetingData);
      setParsedMeetingdata(parsedData);
      
      // Extract meetings data from parsedData
      const allMeetings = parsedData.flatMap(entry => ({
        ...entry.meeting,
        semester: entry.semester,
        section: entry.section,
        sessionName: entry.sessionName
      }));
      setMeetings(allMeetings);

      // Process meetings and attendance
      const attendanceCount = {};
      const processedMentees = new Map();
      const meetingsBySemester = {};

      // Process each meeting entry
      parsedData.forEach(meetingEntry => {
        const { meeting, menteeDetails, semester } = meetingEntry;
        const presentMentees = meeting.present_mentees || [];

        // Initialize meetingsBySemester if not already
        if (!meetingsBySemester[semester]) {
          meetingsBySemester[semester] = [];
        }
        meetingsBySemester[semester].push(meetingEntry);

        // Count attendance for present mentees
        presentMentees.forEach(menteeMUJid => {
          attendanceCount[menteeMUJid] = (attendanceCount[menteeMUJid] || 0) + 1;
        });

        // Process all mentees in the meeting
        if (Array.isArray(menteeDetails)) {
          menteeDetails.forEach(mentee => {
            if (!processedMentees.has(mentee.MUJid)) {
              processedMentees.set(mentee.MUJid, {
                ...mentee,
                meetingsCount: 0,
                meetingsTotal: 0 // will be updated later
              });
            }
          });
        }
      });

      // Update meetings count for each mentee
      processedMentees.forEach((mentee, MUJid) => {
        mentee.meetingsCount = attendanceCount[MUJid] || 0;
        mentee.meetingsTotal = meetingsBySemester[mentee.semester]?.length || 0;
      });

      // Convert processed mentees to array
      const uniqueMentees = Array.from(processedMentees.values());
      setMentees(uniqueMentees);
      setMeetingsBySemester(meetingsBySemester);

      // Set remarks map
      const remarksMap = uniqueMentees.reduce((acc, mentee) => {
        acc[mentee.MUJid] = mentee.mentorRemarks || '';
        return acc;
      }, {});
      setOriginalRemarks(remarksMap);
      setMeetingsCount(attendanceCount);

    } catch (error) {
      console.error("Error fetching mentee data from session storage:", error);
      console.error("Error details:", error.stack);
      setMentees([]);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAllChanges = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(pendingChanges).map(([MUJid, remarks]) =>
        fetch("/api/mentee/meetings-attended", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ MUJid, mentorRemarks: remarks }),
        })
      );

      await Promise.all(promises);

      // Update local state
      const updatedMentees = mentees.map((mentee) => ({
        ...mentee,
        mentorRemarks: pendingChanges[mentee.MUJid] || mentee.mentorRemarks,
      }));

      setMentees(updatedMentees);

      setOriginalRemarks((prev) => ({
        ...prev,
        ...pendingChanges
      }));

      // Update session storage
      const updatedParsedMeetingdata = parsedMeetingdata.map((meetingEntry) => {
        const updatedMenteeDetails = meetingEntry.menteeDetails.map((mentee) => {
          if (pendingChanges[mentee.MUJid]) {
            return {
              ...mentee,
              mentorRemarks: pendingChanges[mentee.MUJid],
            };
          }
          return mentee;
        });

        return {
          ...meetingEntry,
          menteeDetails: updatedMenteeDetails,
        };
      });

      sessionStorage.setItem('meetingData', JSON.stringify(updatedParsedMeetingdata));

      // Make API call to save updated data to the database
      await fetch("/api/mentee/meetings-attended", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updatedParsedMeetingdata }),
      });

      setPendingChanges({});
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating remarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemarksChange = (MUJid, remarks) => {
    setPendingChanges((prev) => {
      const newChanges = { ...prev };
      
      // Only store changes that differ from original
      if (remarks === '' || remarks === originalRemarks[MUJid]) {
        delete newChanges[MUJid];
      } else {
        newChanges[MUJid] = remarks;
      }
      
      // Count actual changes and update state
      const changesCount = Object.keys(newChanges).length;
      setChangeCount(changesCount);
      setHasChanges(changesCount > 0);
      
      return newChanges;
    });
  };

  const handleDiscardAll = () => {
    setPendingChanges({});
    setHasChanges(false);
    setChangeCount(0);
    setShowConfirmDiscard(false);
  };

  const handleRemarksClick = (MUJid, currentRemarks) => {
    setDialogState({
      isOpen: true,
      currentMUJid: MUJid,
      currentValue: currentRemarks || "",
    });
  };

  const handleDialogSave = (remarks) => {
    if (dialogState.currentMUJid) {
      handleRemarksChange(dialogState.currentMUJid, remarks);
    }
  };

  const handleDialogReset = () => {
    if (dialogState.currentMUJid) {
      setPendingChanges((prev) => {
        const newChanges = { ...prev };
        delete newChanges[dialogState.currentMUJid];
        
        // Check if there are any remaining changes after deletion
        const hasRemainingChanges = Object.keys(newChanges).length > 0;
        setHasChanges(hasRemainingChanges);
        
        return newChanges;
      });

      // Close dialog
      setDialogState(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Add helper function to check if remark is modified
  const isRemarkModified = (MUJid) => {
    return pendingChanges[MUJid] !== undefined && 
           pendingChanges[MUJid] !== '' && 
           pendingChanges[MUJid] !== originalRemarks[MUJid];
  };

  // Add keyboard navigation handler
  const handleKeyDown = (e, index, type = 'row') => {
    switch(e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (type === 'row') {
          handleRemarksClick(mentees[index].MUJid, pendingChanges[mentees[index].MUJid] || mentees[index].mentorRemarks);
        } else if (type === 'save') {
          saveAllChanges();
        } else if (type === 'discard') {
          setShowConfirmDiscard(true);
        }
        break;
      case 'ArrowDown':
        if (type === 'row') {
          e.preventDefault();
          setCurrentFocus(prev => Math.min(prev + 1, mentees.length - 1));
        }
        break;
      case 'ArrowUp':
        if (type === 'row') {
          e.preventDefault();
          setCurrentFocus(prev => Math.max(prev - 1, 0));
        }
        break;
      case 'Escape':
        if (dialogState.isOpen) {
          setDialogState(prev => ({ ...prev, isOpen: false }));
        }
        if (showConfirmDiscard) {
          setShowConfirmDiscard(false);
        }
        break;
    }
  };

  // Add TableRow component
  const TableRow = ({ mentee, index }) => {
    return (
      <tr 
        className={`hover:bg-gray-700/30 transition-colors ${
          currentFocus === index ? 'bg-gray-700/50 ring-2 ring-orange-500/50' : ''
        }`}
      >
        <td className="px-6 py-4 text-sm text-gray-300 text-center">{index + 1}</td>
        <td className="px-6 py-4 text-sm text-center text-gray-300">{mentee.MUJid}</td>
        <td className="px-6 py-4 text-sm text-center text-gray-300">{mentee.name}</td>
        <td className="px-6 py-4 text-center">
          <div className="flex flex-col gap-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
              {mentee.meetingsCount} / {mentee.meetingsTotal} meetings
            </span>
            <span className="text-xs text-gray-400">
              {Math.round((mentee.meetingsCount / mentee.meetingsTotal) * 100) || 0}% attendance
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div 
            tabIndex={0}
            role="button"
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={() => handleRemarksClick(mentee.MUJid, pendingChanges[mentee.MUJid] || mentee.mentorRemarks)}
            className={`w-full border rounded-lg px-4 py-2 text-sm cursor-pointer transition-all min-h-[2.5rem] whitespace-pre-wrap break-words focus:outline-none focus:ring-2 focus:ring-orange-500
            ${isRemarkModified(mentee.MUJid) 
              ? 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20 text-red-300' 
              : 'bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 text-white'
            }`}
            aria-label={`Edit remarks for ${mentee.name}`}
          >
            <div className="line-clamp-3">
              {pendingChanges[mentee.MUJid] || mentee.mentorRemarks || 
                <span className="text-gray-400">Click to add remarks...</span>}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Update generatePDFDocument function
  const generatePDFDocument = () => {
    if (!mentees || !meetings) return null;

    const currentDate = new Date();
    const academicYear = `${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`;
    const semester = currentDate.getMonth() < 6 ? "Even" : "Odd";
    
    try {
      // Filter meetings for the selected semester
      const semesterMeetings = meetings.filter(meeting => 
        meeting && meeting.semester === selectedSemester
      );

      return (
        <ConsolidatedDocument
          meetings={semesterMeetings}
          academicYear={academicYear}
          semester={semester}
          section={mentees[0]?.section || ""}
          mentorName={mentorName}
          mentees={mentees}
          selectedSemester={selectedSemester}
        />
      );
    } catch (error) {
      console.error('Error in generatePDFDocument:', error);
      return null;
    }
  };

  const handleSemesterChange = (sem) => {
    try {
      setSelectedSemester(sem);
      // Force regeneration of PDF document
      if (!hasChanges) {
        const doc = generatePDFDocument();
        if (doc === null) {
          console.error('Failed to generate PDF document');
        }
      }
    } catch (error) {
      console.error('Error in handleSemesterChange:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 pt-16">
        <div className="animate-pulse space-y-4 p-8">
          <div className="h-8 w-64 bg-gray-800 rounded"></div>
          <div className="h-[calc(100vh-10rem)] bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      <div className="h-[calc(100vh-4rem)] max-w-[85rem] mx-auto p-8 flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
        <div className="flex gap-6 flex-1 min-h-0"> {/* Added min-h-0 to allow flex child to shrink */}
          {/* Left side container for header and table */}
          <div className="flex-1 max-w-[calc(100%-16rem)] flex flex-col min-h-0"> {/* Added min-h-0 */}
            {/* Static Header - now matches table width */}
            <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg backdrop-blur-sm mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                    Consolidated Report
                  </h2>
                  <p className="text-gray-400">View and manage all mentee reports</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-300">{mentorName}</span>
                </div>
              </div>
            </div>

            {/* Table Container with Fixed Header and Scrollable Body */}
            <div className="flex-1 bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col min-h-0"> {/* Added min-h-0 */}
              {/* Fixed Header */}
              <div className="bg-gray-900/95 backdrop-blur-sm z-10">
                <table className="w-full">
                  <colgroup>
                    <col className="w-24"/> {/* Sr. No. */}
                    <col className="w-44"/> {/* Registration No. */}
                    <col className="w-64"/> {/* Student Name */}
                    <col className="w-44"/> {/* No. of Meetings */}
                    <col /> {/* Remarks - takes remaining space */}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-900/50">
                      <th className="px-6 py-4 text-sm font-semibold text-orange-500 text-center">Sr. No.</th>
                      <th className="px-6 py-4 text-sm font-semibold text-orange-500">Registration No.</th>
                      <th className="px-6 py-4 text-sm font-semibold text-orange-500">Student Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-orange-500 text-center">No. of Meetings Attended</th>
                      <th className="px-6 py-4 text-sm font-semibold text-orange-500">Mentor Remark/Special Cases</th>
                    </tr>
                  </thead>
                </table>
              </div>
              
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0"> {/* Added min-h-0 */}
                <table className="w-full">
                  <colgroup>
                    <col className="w-24"/>
                    <col className="w-44"/>
                    <col className="w-64"/>
                    <col className="w-44"/>
                    <col />
                  </colgroup>
                  <tbody className="divide-y divide-gray-700">
                    {mentees
                      .filter((mentee) => mentee.semester === selectedSemester)
                      .map((mentee, index) => (
                        <TableRow key={mentee.MUJid} mentee={mentee} index={index} />
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side Actions - Updated Logic */}
          <div className="w-60 space-y-4 flex-shrink-0 overflow-y-auto">
            {/* Semester Selection Chips */}
            <div className="bg-gray-800/50 p-4 rounded-xl shadow-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Select Semester</h3>
              <div className="grid grid-cols-2 gap-2">
                {new Date().getMonth() >= 0 && new Date().getMonth() <= 5 ? (
                  <>
                    {[2, 4, 6, 8].map((sem) => (
                      <button
                        key={sem}
                        onClick={() => handleSemesterChange(sem)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${selectedSemester === sem
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                      >
                        Sem {sem}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[1, 3, 5, 7].map((sem) => (
                      <button
                        key={sem}
                        onClick={() => handleSemesterChange(sem)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${selectedSemester === sem
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                      >
                        Sem {sem}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {hasChanges ? (
              // Show Save and Discard buttons when there are changes
              <div className="space-y-2">
                <button
                  onClick={saveAllChanges}
                  disabled={loading}
                  onKeyDown={(e) => handleKeyDown(e, null, 'save')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium shadow-lg transition-all duration-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label={changeCount === 1 ? 'Save change' : `Save all ${changeCount} changes`}
                  tabIndex={0}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      {Object.keys(pendingChanges).length === 1 ? 'Save Change' : 'Save All Changes'}
                      {Object.keys(pendingChanges).length > 1 && (
                        <span className="ml-1">({Object.keys(pendingChanges).length})</span>
                      )}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowConfirmDiscard(true)}
                  onKeyDown={(e) => handleKeyDown(e, null, 'discard')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 hover:text-white font-medium shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label="Discard all changes"
                  tabIndex={0}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Discard Changes
                </button>
              </div>
            ) : (
              // Show PDF Download button when there are no changes
              <PDFDownloadComponent
                document={generatePDFDocument()}
                fileName={`consolidated_report_${mentorName.replace(/\s+/g, '_')}_sem${selectedSemester}.pdf`}
              >
                <div className="w-full flex items-center justify-center px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium shadow-lg transition-all duration-300">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF Report
                </div>
              </PDFDownloadComponent>
            )}
          </div>
        </div>

        {/* Dialog Component */}
        <RemarksDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
          initialValue={dialogState.currentValue}
          originalValue={dialogState.currentMUJid ? originalRemarks[dialogState.currentMUJid] : ""}
          onSave={handleDialogSave}
          onReset={handleDialogReset}
        />

        {/* Add Confirm Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDiscard}
          onClose={() => setShowConfirmDiscard(false)}
          onConfirm={handleDiscardAll}
        />
      </div>
    </div>
  );
};

export default ConsolidatedReport;
