"use client";

import React, { useEffect, useState } from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  BlobProvider,
  Font,
} from "@react-pdf/renderer";

// Add font registration before styles
Font.register({
  family: "Cambria",
  src: "/fonts/cambria.ttf", // You need to provide the actual path to Cambria font file
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 12,
  },
  logo: {
    width: 150, // Increased from 100
    height: 37, // Decreased from 50
    marginBottom: 15,
    alignSelf: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  table: {
    display: "table",
    width: "auto",
    marginBottom: 20,
  },
  tableContainer: {
    flexDirection: "row",
    justifyContent: "center",
    border: "1pt solid black",
  },
  tableHalf: {
    width: "50%",
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid black",
  },
  tableCol: {
    padding: 5,
    borderRight: "1pt solid black",
  },
  tableColSr: {
    width: "15%", // smaller width for Sr No
  },
  tableColReg: {
    width: "35%", // more width for Reg No
  },
  tableColName: {
    width: "50%", // most width for Name
  },
  tableCell: {
    textAlign: "left",
  },
  feedback: {
    marginTop: 20,
    padding: 10,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center", // Add this for vertical alignment
  },
  detailLabel: {
    marginRight: 5, // Add spacing between label and value
  },
  noteSection: {
    marginBottom: 15,
  },
  noteLabel: {
    fontSize: 13, // Increased from 12
    fontWeight: "bold",
    marginBottom: 5,
    fontFamily: "Helvetica",
    textTransform: "uppercase", // Make the labels uppercase
  },
  noteContent: {
    fontSize: 11,
    paddingLeft: 20,
    paddingTop: 5,
    paddingBottom: 5,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Cambria",
  },
  signatureSection: {
    marginTop: 30, // Reduced from 50
    paddingTop: 20,
    width: "60%",
    alignSelf: "flex-start", // Align to left
    marginLeft: 20, // Added for left margin
  },
  signatureText: {
    fontSize: 11,
    marginTop: 5,
  },
  signatureDate: {
    fontSize: 11,
    marginTop: 15, // Added space between signature and date
  },
  tableBottomBorder: {
    borderBottom: "1pt solid black",
  },
  reportTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 10,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    borderBottom: "1pt solid black",
  },
  tableCellLast: {
    padding: 8,
    fontSize: 10,
    textAlign: "left",
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    color: 'grey',
  },
});

const Header = () => (
  <>
    <Image
      style={styles.logo}
      src='/muj-logo.jpg' // Changed from jpg to svg
      alt='MUJ Logo'
    />
    <View style={styles.header}>
      <Text style={{ fontSize: 16, fontWeight: "bold", fontFamily: "Cambria" }}>
        Department of Computer Science and Engineering
      </Text>
      <Text>School of Computer Science and Engineering</Text>
      <View
        style={{
          width: "80%",
          height: 1,
          backgroundColor: "#000",
          alignSelf: "center",
          marginVertical: 10,
        }}
      />
    </View>
    <Text style={styles.pageTitle}>Mentor Consolidated Feedback Sheet</Text>
  </>
);

const Footer = ({ pageNumber, totalPages }) => (
  <View style={styles.footer} fixed>
    <Text>Page {pageNumber} of {totalPages}</Text>
  </View>
);

// mom document template
export const MOMDocument = ({
  meeting,
  semester,
  section,
  mentorName,
  presentMenteeDetails,
}) => {
  let students;
  if (presentMenteeDetails && presentMenteeDetails.length > 0) {
    students =
      presentMenteeDetails?.map((mentee, index) => ({
        srNo: index + 1,
        regNo: mentee?.MUJid,
        name: mentee.name,
        section: mentee.section, // Ensure section is fetched
      })) || [];
  } else {
    students =
      meeting.mentee_details?.map((mentee, index) => ({
        srNo: index + 1,
        regNo: mentee.mujId,
        name: mentee.name,
        section: mentee.section, // Ensure section is fetched
      })) || [];
  }

  const firstHalf = students.slice(0, Math.ceil(students.length / 2));
  const secondHalf = students.slice(Math.ceil(students.length / 2));

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <Header />

        <View style={styles.section}>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailItem, { flex: 2 }]}>
              Name of Mentor: {mentorName || meeting.mentor_id}
            </Text>
            <View
              style={[
                styles.detailItem,
                { justifyContent: "flex-end", marginRight: 0 },
              ]}>
              <Text style={styles.detailLabel}>Mentorship Meeting:</Text>
              <Text>{meeting.meeting_id}</Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailItem}>
              Date of Meeting:{" "}
              {new Date(meeting.meeting_date).toLocaleDateString()}
            </Text>
            <Text style={styles.detailItem}>Time: {meeting.meeting_time}</Text>
            <Text style={styles.detailItem}>
              Section/Semester: {students[0]?.section || section}/{semester}
            </Text>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHalf}>
            <View style={styles.tableRow}>
              <Text
                style={[styles.tableCol, styles.tableColSr, styles.tableCell]}>
                Sr No
              </Text>
              <Text
                style={[styles.tableCol, styles.tableColReg, styles.tableCell]}>
                Reg. No
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.tableColName,
                  styles.tableCell,
                ]}>
                Student Name
              </Text>
            </View>
            {firstHalf.map((student, index) => (
              <View
                style={[
                  styles.tableRow,
                  {
                    borderBottom:
                      index === firstHalf.length - 1
                        ? "none"
                        : "1pt solid black",
                  },
                ]}
                key={student.srNo}>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableColSr,
                    styles.tableCell,
                  ]}>
                  {student.srNo}
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableColReg,
                    styles.tableCell,
                  ]}>
                  {student.regNo}
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableColName,
                    { ...styles.tableCell, borderRight: "1pt solid black" },
                  ]}>
                  {student.name}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.tableHalf}>
            <View style={styles.tableRow}>
              <Text
                style={[styles.tableCol, styles.tableColSr, styles.tableCell]}>
                Sr No
              </Text>
              <Text
                style={[styles.tableCol, styles.tableColReg, styles.tableCell]}>
                Reg. No
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.tableColName,
                  { ...styles.tableCell, borderRight: "none" },
                ]}>
                Student Name
              </Text>
            </View>
            {secondHalf.map((student, index) => (
              <View
                style={[
                  styles.tableRow,
                  {
                    borderBottom:
                      index === secondHalf.length - 1
                        ? "none"
                        : "1pt solid black",
                  },
                ]}
                key={student.srNo}>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableColSr,
                    styles.tableCell,
                  ]}>
                  {student.srNo}
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableColReg,
                    styles.tableCell,
                  ]}>
                  {student.regNo}
                </Text>
                <Text
                  style={[
                    styles.tableCol,
                    styles.tableColName,
                    { ...styles.tableCell, borderRight: "none" },
                  ]}>
                  {student.name}
                </Text>
              </View>
            ))}
            <View style={styles.tableBottomBorder} />{" "}
            {/* Add bottom border after the last student */}
          </View>
        </View>
        <Footer pageNumber={1} totalPages={2} />
      </Page>

      {/* Page 2 - Meeting Notes */}
      <Page size='A4' style={styles.page}>
        <Header />

        <View style={styles.feedback}>
          <Text style={styles.pageTitle}>Meeting Notes</Text>

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>1. Topic of Discussion</Text>
            <Text style={styles.noteContent}>
              {meeting.meeting_notes?.TopicOfDiscussion || "Not specified"}
            </Text>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>
              2. Type of Information Provided
            </Text>
            <Text style={styles.noteContent}>
              {meeting.meeting_notes?.TypeOfInformation || "Not specified"}
            </Text>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>3. Feedback from Mentees</Text>
            <Text style={styles.noteContent}>
              {meeting.meeting_notes?.feedbackFromMentee || "Not specified"}
            </Text>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>4. Issues Raised/Resolved</Text>
            <Text style={styles.noteContent}>
              {meeting.meeting_notes?.outcome || "Not specified"}
            </Text>
          </View>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>5. Closure Remarks</Text>
          <Text style={styles.noteContent}>
            {meeting.meeting_notes?.closureRemarks || "Not specified"}
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureText}>Name & Signature of Mentor</Text>
          <Text style={styles.signatureDate}>
            Date: ___________________________
          </Text>
        </View>
        <Footer pageNumber={2} totalPages={2} />
      </Page>
    </Document>
  );
};

// consolidated document template
export const ConsolidatedDocument = ({
  meetings,
  academicYear,
  semester,
  mentorName,
  mentees
}) => {
  // Split mentees into chunks of 12
  const chunkedMentees = mentees?.reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index/12);
    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []) || [];

  return (
    <Document>
      {chunkedMentees.map((menteeGroup, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          <Header />
          <View style={styles.section}>
            {pageIndex === 0 && ( // Only render on first page
              <>
                <Text style={styles.detailItem}>
                  Name of Mentor: {mentorName || "N/A"}
                </Text>
                <Text style={[styles.detailItem, { marginBottom: 20 , marginTop: 10 }]}>
                  Number of Meetings Taken: {meetings?.length || 0}
                </Text>
              </>
            )}

            {/* Table header */}
            <View style={styles.tableRow}>
              <View
                style={[
                  styles.tableCol,
                  { flex: "0.05",borderTopWidth: 1,borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1 }
                ]}
              >
                <Text>Sr No.</Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  { flex: "0.15",borderTopWidth: 1,borderBottomWidth: 1, borderLeftWidth: 0, borderRightWidth: 1 }
                ]}
              >
                <Text>Registration No.</Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  { flex: "0.30",borderTopWidth: 1,borderBottomWidth: 1, borderLeftWidth: 0, borderRightWidth: 1 }
                ]}
              >
                <Text>Student Name</Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  { flex: "0.13",borderTopWidth: 1,borderBottomWidth: 1, borderLeftWidth: 0, borderRightWidth: 1 }
                ]}
              >
                <Text>No. of Meeting Attended</Text>
              </View>
              <View
                style={[
                  styles.tableCol,
                  { flex: "0.50", borderTopWidth: 1,borderBottomWidth: 1,borderLeftWidth: 0, borderRightWidth: 1 }
                ]}
              >
                <Text>Mentor Remark/Special Cases</Text>
              </View>
            </View>

            {/* Table body - now using menteeGroup instead of mentees */}
            {menteeGroup.map((mentee, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={[styles.tableCol, { flex: "0.05", borderTopWidth: 0, borderLeftWidth: 1, borderRightWidth: 1 }]}>
                  <Text>{pageIndex * 12 + index + 1}</Text>
                </View>
                <View
                style={[
                  styles.tableCol,
                  { flex: "0.15",borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 1 }
                ]}
              >
                  <Text>{mentee.MUJid}</Text>
                </View>
                <View
                  style={[
                    styles.tableCol,
                    { flex: "0.30", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 1 }
                  ]}
                >
                  <Text>{mentee.name}</Text>
                </View>
                <View
                  style={[
                    styles.tableCol,
                    { flex: "0.13", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 1 }
                  ]}
                >
                  <Text>{mentee.meetingsCount || 0}</Text>
                </View>
                <View
                  style={[
                    styles.tableCol,
                    { flex: "0.50", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 1 }
                  ]}
                >
                  <Text>{mentee.mentorRemarks || "N/A"}</Text>
                </View>
              </View>
            ))}

            {pageIndex === chunkedMentees.length - 1 && (
              <View style={[styles.signatureSection, { marginTop: 30, marginLeft: 0 }]}>
                <Text style={[styles.signatureDate, {marginLeft: 0}]}>
            ___________________________
          </Text>
                <Text style={styles.signatureText}>Signature with Date</Text>
                {/* <Text style={styles.signatureDate}>
                  Date: {new Date().toLocaleDateString()}
                </Text> */}
              </View>
            )}
          </View>
          <Footer pageNumber={pageIndex + 1} totalPages={chunkedMentees.length} />
        </Page>
      ))}
    </Document>
  );
};

// mom report pdf generator
export const generateMOMPdf = (meeting, mentorName) => {
  if (!meeting) {
    console.error("No meeting data available");
    return null;
  }
  // console.log("MUJid of mentees Present:", meeting.pre</View>sent_mentees);


  // Filter menteeDetails to only include present mentees
  if (meeting.menteeDetails && meeting?.menteeDetails.length > 0) {
    const presentMenteeDetails = meeting.menteeDetails.filter((mentee) =>
      meeting.present_mentees?.includes(mentee.MUJid)
    );
    // console.log("mentees Present:", presentMenteeDetails);

    return (
      <MOMDocument
        meeting={meeting}
        semester={meeting.semester}
        section={meeting.section}
        mentorName={mentorName} // Ensure mentorName is passed here
        presentMenteeDetails={presentMenteeDetails}
      />
    );
  }

  return (
    <MOMDocument
      meeting={meeting}
      semester={meeting.semester}
      section={meeting.section}
      mentorName={mentorName} // Ensure mentorName is passed here
    />
  );
};

// consolidated report pdf generator
export const generateConsolidatedPdf = (
  meetings,
  academicYear,
  semester,
  section,
  mentorName,
  mentees // add mentees prop
) => {
  return React.createElement(
    Document,
    null,
    React.createElement(ConsolidatedDocument, {
      meetings,
      academicYear,
      semester,
      section,
      mentorName,
      mentees // pass mentees prop
    })
  );
};

// Add new export for PDF download
export const PDFDownloadComponent = ({
  document,
  fileName,
  children,
  page,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return null or loading state on server-side
  if (!isClient) {
    return page && page === "MentorDashboard" ? (
      <div className='flex items-center justify-center'>
        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500'></div>
      </div>
    ) : (
      <button disabled>Loading...</button>
    );
  }

  // Only render BlobProvider on client-side
  return (
    <BlobProvider document={document}>
      {({ url, loading, error }) => {
        if (error) {
          console.warn("PDF generation error:", error);
          return null;
        }

        if (loading) {
          return page && page === "MentorDashboard" ? (
            <div className='flex items-center justify-center'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500'></div>
            </div>
          ) : (
            <button disabled>Loading...</button>
          );
        }

        return (
          <a
            href={url}
            download={fileName}
            className={`${
              page && page === "MentorDashboard"
                ? ""
                : "inline-block px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-lg transition-all"
            }`}>
            {children || "Download PDF"}
          </a>
        );
      }}
    </BlobProvider>
  );
};
