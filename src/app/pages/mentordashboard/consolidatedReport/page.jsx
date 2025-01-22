"use client";
import { useState, useEffect } from "react";
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
    setPendingChanges((prev) => ({
      ...prev,
      [MUJid]: remarks,
    }));
    setHasChanges(true);
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

      setPendingChanges({});
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating remarks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className='text-orange-500'>Loading...</div>;

  return (
    <div className='p-6 bg-gray-900 min-h-screen relative'>
      <h2 className='text-2xl font-bold mb-4 text-orange-500'>
        Consolidated Report
      </h2>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-gray-800 border border-gray-700'>
          <thead className='bg-gray-900'>
            <tr>
              <th className='border border-gray-700 px-4 py-2 text-orange-500'>
                Sr. No.
              </th>
              <th className='border border-gray-700 px-4 py-2 text-orange-500'>
                MUJ ID
              </th>
              <th className='border border-gray-700 px-4 py-2 text-orange-500'>
                Name
              </th>
              <th className='border border-gray-700 px-4 py-2 text-orange-500'>
                Meetings Attended
              </th>
              <th className='border border-gray-700 px-4 py-2 text-orange-500'>
                Mentor Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {mentees.map((mentee, index) => (
              <tr key={mentee.MUJid} className='hover:bg-gray-900'>
                <td className='border border-gray-700 px-4 py-2 text-gray-300'>
                  {index + 1}
                </td>
                <td className='border border-gray-700 px-4 py-2 text-gray-300'>
                  {mentee.MUJid}
                </td>
                <td className='border border-gray-700 px-4 py-2 text-gray-300'>
                  {mentee.name}
                </td>
                <td className='border border-gray-700 px-4 py-2 text-gray-300'>
                  {mentee.meetingsCount}
                </td>
                <td className='border border-gray-700 px-4 py-2 text-gray-300'>
                  <input
                    type='text'
                    defaultValue={mentee.mentorRemarks || ""}
                    className='bg-gray-700 text-white px-2 py-1 rounded w-full'
                    onChange={(e) =>
                      handleRemarksChange(mentee.MUJid, e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='fixed bottom-8 right-8 flex gap-4'>
        {hasChanges && (
          <button
            onClick={saveAllChanges}
            className='bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-300'
            disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        )}

        {meetings.length > 0 && (
          <PDFDownloadComponent
            document={generateConsolidatedPdf(
              meetings,
              new Date().getFullYear().toString(),
              meetings[0]?.semester || "",
              meetings[0]?.section || "",
              mentorName
            )}
            fileName='consolidated-report.pdf'>
            <div className='bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-300'>
              Download Report
            </div>
          </PDFDownloadComponent>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedReport;
