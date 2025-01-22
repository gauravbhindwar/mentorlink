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
  const [meetings, setMeetings] = useState([]);
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

  useEffect(() => {
    const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
    if (mentorData && mentorData.MUJid) {
      setMentorId(mentorData.MUJid);
      setMentorName(mentorData.name);
      fetchMenteeData(mentorData.MUJid);
      fetchMeetingsData(mentorData.MUJid);
    }
  }, []);

  const fetchMenteeData = async (mentor_id) => {
    try {
      const response = await fetch(
        `/api/mentee/meetings-attended?mentor_id=${mentor_id}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.log("Failed to parse JSON:", error);
        throw new Error("Invalid JSON response");
      }
      setMentees(data);
      const remarksMap = data.reduce((acc, mentee) => {
        acc[mentee.MUJid] = mentee.mentorRemarks || '';
        return acc;
      }, {});
      setOriginalRemarks(remarksMap);
    } catch (error) {
      console.error("Error fetching mentee data:", error);
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingsData = async (mentor_id) => {
    try {
      const response = await fetch(`/api/meetings?mentor_id=${mentor_id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.log("Failed to parse JSON:", error);
        throw new Error("Invalid JSON response");
      }
      setMeetings(data);
    } catch (error) {
      console.log("Error fetching meetings data:", error);
      setMeetings([]);
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
      setMentees(
        mentees.map((mentee) => ({
          ...mentee,
          mentorRemarks: pendingChanges[mentee.MUJid] || mentee.mentorRemarks,
        }))
      );

      setOriginalRemarks((prev) => ({
        ...prev,
        ...pendingChanges
      }));
      setPendingChanges({});
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating remarks:", error);
    } finally {
      setLoading(false);
    }
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

  // Add new function to generate PDF document
  const generatePDFDocument = () => {
    const currentDate = new Date();
    const academicYear = `${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`;
    const semester = currentDate.getMonth() < 6 ? "Even" : "Odd"; // Basic logic for semester

    return (
      <ConsolidatedDocument
        meetings={meetings}
        academicYear={academicYear}
        semester={semester}
        section={mentees[0]?.section || ""}
        mentorName={mentorName}
        mentees={mentees} // pass mentees array here
      />
    );
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
                    <col className="w-[100px] text-left " /> {/* Sr. No. - increased from 80px */}
                    <col className="w-[180px] text-left" /> {/* MUJ ID - increased from 140px */}
                    <col className="w-[250px] text-left" /> {/* Name - increased from 200px */}
                    <col className="w-[150px] text-left" /> {/* Meetings - increased from 120px */}
                    <col className="w-[250px] text-left" /> {/* Remarks - fixed width instead of flexible */}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-900/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-500">Sr. No.</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-500">MUJ ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-500">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-500">Meetings</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-500">Remarks</th>
                    </tr>
                  </thead>
                </table>
              </div>
              
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0"> {/* Added min-h-0 */}
                <table className="w-full">
                  <colgroup>
                    <col className="w-[100px]" />
                    <col className="w-[180px]" />
                    <col className="w-[250px]" />
                    <col className="w-[150px]" />
                    <col className="w-[250px]" />
                  </colgroup>
                  <tbody className="divide-y divide-gray-700">
                    {mentees.map((mentee, index) => (
                      <tr 
                        key={mentee.MUJid} 
                        className={`hover:bg-gray-700/30 transition-colors ${
                          currentFocus === index ? 'bg-gray-700/50 ring-2 ring-orange-500/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-300">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{mentee.MUJid}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{mentee.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
                            {mentee.meetingsCount} meetings
                          </span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side Actions - Updated Logic */}
          <div className="w-60 space-y-4 flex-shrink-0 overflow-y-auto">
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
                fileName={`consolidated_report_${mentorName.replace(/\s+/g, '_')}.pdf`}
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
