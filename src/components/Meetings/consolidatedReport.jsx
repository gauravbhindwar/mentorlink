"use client";
import { useState, useEffect } from "react";
import RemarksDialog from "./RemarksDialog";
// import ConfirmDialog from "./ConfirmDialog";
import { PDFDownloadComponent, ConsolidatedDocument } from "./PDFGenerator";

const ConsolidatedReport = () => {
  // const [mentorId, setMentorId] = useState("");
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mentorName, setMentorName] = useState("");
  const [originalRemarks, setOriginalRemarks] = useState({});
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    currentMUJid: null,
    currentValue: "",
  });
  const [currentFocus, setCurrentFocus] = useState(-1);
  // const [meetingsBySemester, setMeetingsBySemester] = useState({});
  // const [parsedMeetingdata, setParsedMeetingdata] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const currentMonth = new Date().getMonth();
    return currentMonth >= 0 && currentMonth <= 5 ? 4 : 3; // Default to 4 for even, 3 for odd
  });
  // const [meetingsCount, setMeetingsCount] = useState({});
  const [meetings, setMeetings] = useState([]);  // Ensure meetings state is properly initialized

  useEffect(() => {
    const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
    if (mentorData && mentorData.MUJid) {
      // setMentorId(mentorData.MUJid);
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
      // setParsedMeetingdata(parsedData);

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
      // setMeetingsBySemester(meetingsBySemester);

      // Set remarks map
      const remarksMap = uniqueMentees.reduce((acc, mentee) => {
        acc[mentee.MUJid] = mentee.mentorRemarks || '';
        return acc;
      }, {});
      setOriginalRemarks(remarksMap);
      // setMeetingsCount(attendanceCount);

    } catch (error) {
      console.error("Error fetching mentee data from session storage:", error);
      console.error("Error details:", error.stack);
      setMentees([]);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemarksClick = (MUJid, currentRemarks) => {
    setDialogState({
      isOpen: true,
      currentMUJid: MUJid,
      currentValue: currentRemarks || "",
    });
  };

  const handleDialogSave = async (remarks) => {
    if (dialogState.currentMUJid) {
      try {
        // Save to database
        await fetch("/api/mentee/meetings-attended", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            MUJid: dialogState.currentMUJid,
            mentorRemarks: remarks
          }),
        });

        // Update session storage
        const meetingData = JSON.parse(sessionStorage.getItem("meetingData") || "[]");
        const updatedMeetingdata = meetingData.map(meetingEntry => {
          const updatedMenteeDetails = meetingEntry.menteeDetails?.map(mentee => {
            if (mentee.MUJid === dialogState.currentMUJid) {
              return {
                ...mentee,
                mentorRemarks: remarks
              };
            }
            return mentee;
          });

          return {
            ...meetingEntry,
            menteeDetails: updatedMenteeDetails
          };
        });

        sessionStorage.setItem("meetingData", JSON.stringify(updatedMeetingdata));

        // Update local state
        setMentees(prevMentees => 
          prevMentees.map(mentee => 
            mentee.MUJid === dialogState.currentMUJid 
              ? { ...mentee, mentorRemarks: remarks }
              : mentee
          )
        );

        setOriginalRemarks(prev => ({
          ...prev,
          [dialogState.currentMUJid]: remarks
        }));

        // Close dialog
        setDialogState({ isOpen: false, currentMUJid: null, currentValue: "" });

      } catch (error) {
        console.error("Error saving remarks:", error);
        alert("Failed to save remarks. Please try again.");
      }
    }
  };

  // Add keyboard navigation handler
  const handleKeyDown = (e, index, type = 'row') => {
    switch(e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (type === "row") {
          handleRemarksClick(
            mentees[index].MUJid,
            mentees[index].mentorRemarks
          );
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
          setDialogState((prev) => ({ ...prev, isOpen: false }));
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
            onClick={() =>
              handleRemarksClick(
                mentee.MUJid,
                mentee.mentorRemarks
              )
            }
            className={`w-full border rounded-lg px-4 py-2 text-sm cursor-pointer transition-all min-h-[2.5rem] whitespace-pre-wrap break-words focus:outline-none focus:ring-2 focus:ring-orange-500
            bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 text-white`}
            aria-label={Edit remarks for ${mentee.name}}>
            <div className='line-clamp-3'>
              {mentee.mentorRemarks || (
                <span className='text-gray-400'>Click to add remarks...</span>
              )}
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
    const academicYear = ${currentDate.getFullYear()}-${currentDate.getFullYear() + 1};
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
      const doc = generatePDFDocument();
      if (doc === null) {
        console.error("Failed to generate PDF document");
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

  // Add this check for no data
  const filteredMentees = mentees.filter((mentee) => mentee.semester === selectedSemester);
  const hasNoData = filteredMentees.length === 0;

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
              {!hasNoData && (
                <div className='bg-gray-900/95 backdrop-blur-sm z-10'>
                  <table className='w-full'>
                    <colgroup>
                      <col className='w-24' />
                      <col className='w-44' />
                      <col className='w-64' />
                      <col className='w-44' />
                      <col />
                    </colgroup>
                    <thead>
                      <tr className='bg-gray-900/50'>
                        <th className='px-6 py-4 text-sm font-semibold text-orange-500 text-center'>
                          Sr. No.
                        </th>
                        <th className='px-6 py-4 text-sm font-semibold text-orange-500'>
                          Registration No.
                        </th>
                        <th className='px-6 py-4 text-sm font-semibold text-orange-500'>
                          Student Name
                        </th>
                        <th className='px-6 py-4 text-sm font-semibold text-orange-500 text-center'>
                          No. of Meetings Attended
                        </th>
                        <th className='px-6 py-4 text-sm font-semibold text-orange-500'>
                          Mentor Remark/Special Cases
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>
              )}

              {/* Scrollable Body or No Data Message */}
              {hasNoData ? (
                <div className='flex-1 flex items-center justify-center'>
                  <div className='text-center space-y-4'>
                    <svg
                      className='w-16 h-16 mx-auto text-gray-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 14h.01M12 16h.01M12 18h.01M12 20h.01M12 22h.01'
                      />
                    </svg>
                    <h3 className='text-xl font-medium text-gray-400'>
                      No Data Found
                    </h3>
                    <p className='text-gray-500'>
                      There are no mentees assigned for Semester {selectedSemester}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='flex-1 overflow-y-auto custom-scrollbar min-h-0'>
                  <table className='w-full'>
                    <colgroup>
                      <col className='w-24' />
                      <col className='w-44' />
                      <col className='w-64' />
                      <col className='w-44' />
                      <col />
                    </colgroup>
                    <tbody className='divide-y divide-gray-700'>
                      {mentees
                        .filter((mentee) => mentee.semester === selectedSemester)
                        .map((mentee, index) => (
                          <TableRow
                            key={mentee.MUJid}
                            mentee={mentee}
                            index={index}
                          />
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
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

            {/* PDF Download Section */}
            {(() => {
              const semesterMeetings = meetings.filter(
                (meeting) => meeting && meeting.semester === selectedSemester
              );

              return semesterMeetings.length < 3 ? (
                <div className='w-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl'>
                  <div className='flex items-center gap-2 text-yellow-500 mb-2'>
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                    <span className='font-medium'>Not Enough Meetings</span>
                  </div>
                  <p className='text-sm text-red-400'>
                    Please conduct at least three meetings in this semester
                    before generating the report.
                  </p>
                </div>
              ) : (
                <PDFDownloadComponent
                  document={generatePDFDocument()}
                  page={consolidatedReport}
                  fileName={`consolidated_report_${mentorName.replace(
                    /\s+/g,
                    "_"
                  )}_sem${selectedSemester}.pdf`}>
                  <div className='w-full flex items-center justify-center px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium shadow-lg transition-all duration-300'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                      />
                    </svg>
                    Download PDF Report
                  </div>
                </PDFDownloadComponent>
              );
            })()}
          </div>
        </div>

        {/* Dialog Component */}
        <RemarksDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
          initialValue={dialogState.currentValue}
          originalValue={dialogState.currentMUJid ? originalRemarks[dialogState.currentMUJid] : ""}
          onSave={handleDialogSave}
        />
      </div>
    </div>
  );
};

export default ConsolidatedReport;