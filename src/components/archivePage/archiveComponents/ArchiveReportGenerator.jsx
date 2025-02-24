"use client";
import React, { useState } from 'react';
import { 
  Box, Typography, Grid, CircularProgress,
  Dialog, DialogContent
} from '@mui/material';
import { BsFiletypePdf, BsDownload,BsFileEarmarkSpreadsheet } from 'react-icons/bs';
import axios from 'axios';
import JSZip from 'jszip';
import { generateMOMPdf, generateConsolidatedPdf } from '@/components/Meetings/PDFGenerator';
import { pdf } from '@react-pdf/renderer';

// Update the sanitizeFileName function to handle null/undefined
const sanitizeFileName = (name) => {
  if (!name) return 'unknown';
  return name
    .toString()
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Add this helper function for date formatting
const formatDate = (dateString) => {
  try {
    // First try to parse as ISO string
    let date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If date is in DD/MM/YYYY format, convert it
      const [day, month, year] = dateString.split('/');
      date = new Date(year, month - 1, day);
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date parsing error:', error);
    return 'invalid-date';
  }
};

// Status component for progress dialog
const ProgressStatus = ({ currentStep, error }) => {
  const steps = [
    { key: 'fetching', text: 'Fetching session data...' },
    { key: 'processing', text: 'Processing meetings...' },
    { key: 'generating', text: 'Generating reports...' },
    { key: 'packing', text: 'Packing files...' },
    { key: 'complete', text: 'Download complete!' }
  ];

  return (
    <Box sx={{ py: 3 }}>
      {steps.map((step, index) => (
        <Box
          key={step.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1,
            opacity: index <= currentStep ? 1 : 0.5
          }}
        >
          {index === currentStep && !error ? (
            <CircularProgress size={20} sx={{ color: '#f97316' }} />
          ) : index < currentStep ? (
            <Box sx={{ 
              width: 20, 
              height: 20, 
              borderRadius: '50%', 
              bgcolor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px'
            }}>✓</Box>
          ) : (
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
          )}
          <Typography sx={{ color: index <= currentStep ? 'white' : 'gray' }}>
            {step.text}
          </Typography>
        </Box>
      ))}
      {error && (
        <Typography sx={{ color: '#ef4444', mt: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

const ArchiveReportGenerator = ({ searchParams, inlineModeStyles }) => {
  const [fileFormat, setFileFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setCurrentStep(0);
    setError(null);

    try {
      if (fileFormat === 'excel') {
        // Direct Excel download
        const response = await axios.get('/api/archive/downloadReport', {
          params: {
            academicYear: searchParams.academicYear,
            academicSession: searchParams.academicSession,
            downloadType: 'all'
          },
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `archive-report-${searchParams.academicYear}-${searchParams.academicSession}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        setCurrentStep(4);
        setTimeout(() => setIsGenerating(false), 1000);
        return;
      }

      // Create base ZIP folder with error checking
      const zip = new JSZip();
      if (!zip) {
        throw new Error('Failed to initialize ZIP file');
      }

      // Update the API endpoint to use the correct path
      const response = await axios.get('/api/archive/getSessionData', {
        params: {
          academicYear: searchParams.academicYear,
          academicSession: searchParams.academicSession,
          pageSize: 'all'
        }
      });

      if (!response.data || !response.data.currentSession) {
        throw new Error('No data available for the selected session');
      }

      setCurrentStep(1);

      const { currentSession } = response.data;
      if (!currentSession?.mentors?.length) {
        throw new Error('No valid mentor data available');
      }

      // Process meetings with validation
      const processedMeetings = (currentSession.semesters || [])
        .filter(semester => semester && semester.meetingPages)
        .flatMap(semester => 
          semester.meetingPages
            .filter(page => page && page.meetings)
            .flatMap(page => 
              page.meetings
                .filter(meeting => {
                  if (!meeting || !meeting.mentorDetails?.email) { // Changed from mentorMUJid
                    console.warn('Invalid meeting found:', meeting);
                    return false;
                  }
                  const meetingDate = new Date(meeting.meeting_date);
                  return meetingDate <= new Date() && meeting.isReportFilled;
                })
                .map(meeting => ({
                  meeting_id: meeting.meeting_id,
                  mentor_email: meeting.mentorDetails?.email, // Changed from mentor_id
                  mentorName: meeting.mentorDetails?.name || 'Unknown',
                  meeting_date: meeting.meeting_date,
                  meeting_time: meeting.meeting_time,
                  semester: semester.semester_number,
                  section: meeting.section || semester.semester_number.toString(),
                  mentee_details: (meeting.mentees || [])
                    .filter(mentee => mentee && mentee.MUJid && mentee.name)
                    .map(mentee => ({
                      mujId: mentee.MUJid,
                      name: mentee.name,
                      section: meeting.section || semester.semester_number.toString(),
                      isPresent: mentee.isPresent
                    })),
                  present_mentees: (meeting.mentees || [])
                    .filter(mentee => mentee && mentee.MUJid && mentee.isPresent)
                    .map(mentee => mentee.MUJid),
                  meeting_notes: {
                    TopicOfDiscussion: meeting.meeting_notes?.TopicOfDiscussion || "Not specified",
                    TypeOfInformation: meeting.meeting_notes?.TypeOfInformation || "Not specified",
                    feedbackFromMentee: meeting.meeting_notes?.feedbackFromMentee || "Not specified",
                    outcome: meeting.meeting_notes?.outcome || "Not specified",
                    closureRemarks: meeting.meeting_notes?.closureRemarks || "Not specified"
                  }
                }))
            )
        );

      console.log('Processed meetings count:', processedMeetings.length);

      // Define mentorGroups only once
      const mentorGroups = {};
      processedMeetings.forEach(meeting => {
        if (!meeting.mentor_email) { // Changed from mentor_id
          console.warn('Meeting missing mentor email:', meeting);
          return;
        }
        const mentor = currentSession.mentors.find(m => m.email === meeting.mentor_email); // Changed from MUJid
        if (!mentor) {
          console.warn('Mentor not found for meeting:', meeting.mentor_email);
          return;
        }
        if (!mentorGroups[meeting.mentor_email]) { // Changed from mentor_id
          mentorGroups[meeting.mentor_email] = {
            mentorName: mentor.name || 'Unknown',
            meetings: []
          };
        }
        mentorGroups[meeting.mentor_email].meetings.push(meeting);
      });

      console.log('Created mentor groups:', Object.keys(mentorGroups).length);

      // Process PDFs with safer folder creation
      if (fileFormat === 'pdf' && processedMeetings.length > 0) {
        for (const [mentorEmail, data] of Object.entries(mentorGroups)) { // Changed from mentorId
          try {
            const safeMentorName = sanitizeFileName(data.mentorName || 'unknown_mentor');
            const mentorFolder = zip.folder(safeMentorName);
            if (!mentorFolder) continue;

            // Create separate folders for MOM and consolidated reports
            const momFolder = mentorFolder.folder('Meeting_Minutes');
            const consolidatedFolder = mentorFolder.folder('Consolidated_Reports');
            if (!momFolder || !consolidatedFolder) continue;

            // Process MOM PDFs
            for (const meeting of (data.meetings || [])) {
              try {
                const momDoc = generateMOMPdf(meeting, data.mentorName);
                if (!momDoc?.props) continue;

                const momBlob = await pdf(momDoc).toBlob();
                const safeFileName = `${formatDate(meeting.meeting_date)}_MOM_${meeting.meeting_id}.pdf`;
                await momFolder.file(safeFileName, momBlob);
              } catch (err) {
                console.warn(`Failed to process meeting ${meeting.meeting_id}:`, err);
              }
            }

            // Get mentor data
            const mentorData = currentSession.mentors.find(m => m.email === mentorEmail); // Changed from MUJid
            if (!mentorData?.mentees) continue;

            // Group meetings by semester
            const meetingsBySemester = data.meetings.reduce((acc, meeting) => {
              const sem = meeting.semester;
              if (!acc[sem]) acc[sem] = [];
              acc[sem].push(meeting);
              return acc;
            }, {});

            // Generate consolidated report for each semester
            for (const [semester, semesterMeetings] of Object.entries(meetingsBySemester)) {
              // Process mentees for this semester
              const semesterMentees = mentorData.mentees
                .filter(mentee => mentee.semester === parseInt(semester))
                .map(mentee => {
                  const attendedMeetings = semesterMeetings.filter(meeting => 
                    meeting.present_mentees?.includes(mentee.MUJid)
                  ).length;

                  return {
                    ...mentee,
                    meetingsCount: attendedMeetings,
                    total_meetings: semesterMeetings.length
                  };
                });

              // Generate consolidated PDF for this semester
              const pdfDoc = generateConsolidatedPdf(
                semesterMeetings,
                parseInt(semester),
                data.mentorName,
                semesterMentees,
                parseInt(semester)
              );

              if (!pdfDoc) continue;

              try {
                const consolidatedBlob = await pdf(pdfDoc).toBlob();
                await consolidatedFolder.file(
                  `Consolidated_Report_Semester_${semester}.pdf`,
                  consolidatedBlob
                );
              } catch (err) {
                console.error(`Failed to generate PDF for semester ${semester}:`, err);
              }
            }
          } catch (err) {
            console.error(`Failed to process mentor ${data.mentorName}:`, err);
          }
        }
      }

      // Step 3: Pack files
      setCurrentStep(3);
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 5 }
      });

      // Download handling
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `archive-report-${searchParams.academicYear}-${searchParams.academicSession}-${fileFormat}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Complete
      setCurrentStep(4);
      setTimeout(() => setIsGenerating(false), 1000);

    } catch (err) {
      console.error('Download error details:', err);
      let errorMessage = 'Failed to generate reports: ';
      
      if (err.response) {
        // Handle specific HTTP error responses
        switch (err.response.status) {
          case 404:
            errorMessage += 'Session data not found';
            break;
          case 500:
            errorMessage += 'Internal server error';
            break;
          default:
            errorMessage += err.response.data?.message || err.message;
        }
      } else if (err.request) {
        errorMessage += 'Network error, please check your connection';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setIsGenerating(false);
      setCurrentStep(-1);
    }
  };

  return (
    <>
      <Box sx={{ ...inlineModeStyles }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{
              borderRadius: 3,
              p: 3,
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              mb: 3
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#f97316', 
                  fontWeight: 600,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <BsFileEarmarkSpreadsheet size={24} />
                Report Format Selection
              </Typography>
              <Typography sx={{ color: 'gray', fontSize: '0.9rem' }}>
                Choose your preferred format for downloading the reports.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box
                  onClick={() => setFileFormat('pdf')}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: `2px solid ${fileFormat === 'pdf' ? '#22c55e' : 'rgba(249, 115, 22, 0.2)'}`,
                    background: fileFormat === 'pdf' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(26, 26, 26, 0.6)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: fileFormat === 'pdf' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.1)',
                      color: fileFormat === 'pdf' ? '#22c55e' : '#f97316'
                    }}>
                      <BsFiletypePdf size={30} />
                    </Box>
                    <Box>
                      <Typography sx={{ 
                        color: fileFormat === 'pdf' ? '#22c55e' : '#f97316',
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}>
                        PDF Format
                      </Typography>
                      <Typography sx={{ color: 'gray', fontSize: '0.9rem' }}>
                        Download reports in PDF format
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  onClick={() => setFileFormat('excel')}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: `2px solid ${fileFormat === 'excel' ? '#22c55e' : 'rgba(249, 115, 22, 0.2)'}`,
                    background: fileFormat === 'excel' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(26, 26, 26, 0.6)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: fileFormat === 'excel' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.1)',
                      color: fileFormat === 'excel' ? '#22c55e' : '#f97316'
                    }}>
                      <BsFileEarmarkSpreadsheet size={30} />
                    </Box>
                    <Box>
                      <Typography sx={{ 
                        color: fileFormat === 'excel' ? '#22c55e' : '#f97316',
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}>
                        Excel Format
                      </Typography>
                      <Typography sx={{ color: 'gray', fontSize: '0.9rem' }}>
                        Download reports in Excel format
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 
                       hover:to-orange-700 text-white py-4 px-6 rounded-xl transition-all 
                       flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
              style={{
                backdropFilter: 'blur(10px)'
              }}
            >
              {isGenerating ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                <>
                  <BsDownload size={20} />
                  <span className="text-lg font-semibold">
                    Generate {fileFormat.toUpperCase()} Report
                  </span>
                </>
              )}
            </button>
          </Grid>
        </Grid>
      </Box>

      <Dialog 
        open={isGenerating} 
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            borderRadius: '1rem',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }
        }}
      >
        <DialogContent>
          <ProgressStatus currentStep={currentStep} error={error} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ArchiveReportGenerator;
