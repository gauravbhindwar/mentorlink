"use client";
import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import {
  generateConsolidatedPdf,
  PDFDownloadComponent,
} from "@/components/Meetings/PDFGenerator";

const ConsolidatedReport = () => {
  const [mentorId, setMentorId] = useState("");
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [meetings, setMeetings] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [hasRealChanges, setHasRealChanges] = useState(false);

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
      } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON response");
      }
      setMentees(data);
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
      } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON response");
      }

      setMeetings(data);
    } catch (error) {
      console.error("Error fetching meetings data:", error);
      setMeetings([]);
    }
  };

  const handleRemarksChange = (MUJid, remarks) => {
    const originalRemarks = mentees.find(m => m.MUJid === MUJid)?.mentorRemarks ?? '';
    const hasChanged = remarks.trim() !== originalRemarks.trim();
    
    setPendingChanges(prev => ({
      ...prev,
      [MUJid]: remarks,
    }));

    // Only set hasChanges if there are actual differences from original
    if (hasChanged) {
      setHasChanges(true);
      setHasRealChanges(true);
    } else {
      // Check if there are any other real changes
      const otherChanges = Object.entries(pendingChanges).some(([id, value]) => {
        if (id === MUJid) return false;
        const originalValue = mentees.find(m => m.MUJid === id)?.mentorRemarks ?? '';
        return value.trim() !== originalValue.trim();
      });
      setHasRealChanges(otherChanges);
      setHasChanges(otherChanges);
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

      // First reset all states
      setPendingChanges({});
      setHasChanges(false);
      setHasRealChanges(false);

      // Then reload data
      await fetchMenteeData(mentorId);
      await fetchMeetingsData(mentorId);

      // Ensure states are reset after reload
      setTimeout(() => {
        setHasChanges(false);
        setHasRealChanges(false);
      }, 0);

    } catch (error) {
      console.error("Error updating remarks:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to ensure states are properly reset when data changes
  useEffect(() => {
    if (mentees.length > 0) {
      setHasChanges(false);
      setHasRealChanges(false);
    }
  }, [mentees]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-700/50 rounded-lg w-1/4"></div>
          <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 px-4 md:px-6 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4">
            Consolidated Report
          </motion.h1>
        </motion.div>

        {/* Updated Table Section with Fixed Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* Add Meetings Summary */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-orange-500">Mentee Summary</h2>
              <div className="bg-orange-500/20 px-4 py-2 rounded-full">
                <span className="text-orange-400">Total Meetings: {meetings.length}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Fixed Header */}
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-orange-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-orange-500">MUJ ID</th>
                  <th className="px-6 py-3 text-left font-medium text-orange-500">Meetings Attended</th>
                  <th className="px-6 py-3 text-left font-medium text-orange-500">Remarks</th>
                </tr>
              </thead>
            </table>

            {/* Updated Scrollable Body with increased height */}
            <div className="overflow-y-auto max-h-[600px]">
              <table className="w-full">
                <tbody className="divide-y divide-gray-800/50">
                  {mentees.map((mentee) => (
                    <tr 
                      key={mentee.MUJid}
                      className="hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="px-6 py-3 text-gray-200">{mentee.name}</td>
                      <td className="px-6 py-3 text-gray-300">{mentee.MUJid}</td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                          {mentee.meetingsAttended || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <textarea
                          value={pendingChanges[mentee.MUJid] ?? mentee.mentorRemarks ?? ''}
                          onChange={(e) => handleRemarksChange(mentee.MUJid, e.target.value)}
                          className="w-full bg-gray-800/50 text-gray-200 rounded-lg p-2 border border-gray-700 
                            focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 
                            resize-none hover:bg-gray-700/50"
                          rows="1"
                          placeholder="Enter remarks..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Updated Actions Section */}
          <div className="sticky bottom-0 flex justify-end gap-4 p-4 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800">
            <PDFDownloadComponent
              document={(!hasRealChanges && mentees.length > 0 && meetings.length > 0) ? generateConsolidatedPdf(
                mentees.map(mentee => ({
                  ...mentee,
                  remarks: pendingChanges[mentee.MUJid] ?? mentee.mentorRemarks ?? '',
                  totalMeetings: meetings.length,
                })),
                new Date().getFullYear().toString(),
                "Current",
                "All",
                mentorName || 'Mentor'
              ) : null}
              fileName="consolidated-report.pdf"
            >
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 
                  hover:to-pink-600 text-white rounded-lg shadow-lg transition-all duration-300 transform 
                  hover:scale-105 font-medium flex items-center gap-2 disabled:opacity-50 
                  disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                disabled={hasRealChanges || mentees.length === 0 || meetings.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {hasRealChanges ? 'Save changes to download' : 'Download Report'}
              </button>
            </PDFDownloadComponent>
            
            {hasChanges && (
              <button
                onClick={saveAllChanges}
                disabled={loading}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg 
                  transition-all duration-300 transform hover:scale-105 font-medium flex items-center gap-2 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConsolidatedReport;
