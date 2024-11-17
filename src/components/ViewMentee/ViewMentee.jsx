"use client";
import React, { useState } from 'react';
import Navbar from '../subComponents/Navbar';
import "@/app/styles.css";

const Page = () => {
    const academicYears = ["2023-24", "2022-23", "2021-22"];
    const academicSessions = ["DEC-JUNE (EVEN SEM)", "JUL-NOV (ODD SEM)"];
    const oddSem = ["III", "IV", "VII"];
    const evenSem = ["IV", "VI", "VIII"];

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");
    const [semesters, setSemesters] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const [selectedReport, setSelectedReport] = useState("");
    const [selectedSubOption, setSelectedSubOption] = useState("");
    const [showPopup, setShowPopup] = useState(false); // Track if the popup should be shown

    const mentees = [
        { id: 1, name: "John Doe", email: "john.doe@example.com" },
        { id: 2, name: "Jane Smith", email: "jane.smith@example.com" },
        { id: 3, name: "Bob Johnson", email: "bob.johnson@example.com" }
    ];

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setSelectedSession("");
        setSelectedSemester("");
        setShowButtons(false);
        setSemesters([]);
    };

    const handleSessionChange = (e) => {
        setSelectedSession(e.target.value);
        setSelectedSemester("");
        setShowButtons(false);

        if (e.target.value === "DEC-JUNE(EVEN SEM)") {
            setSemesters(evenSem);
        } else if (e.target.value === "JUL-NOV(ODD SEM)") {
            setSemesters(oddSem);
        }
    };

    const handleSemesterChange = (e) => {
        setSelectedSemester(e.target.value);
        setShowButtons(false);
    };

    const handleSearchClick = () => {
        setShowButtons(true);
    };

    const handleGetReportClick = () => {
        setShowPopup(true); // Show the popup when "Get Report" is clicked
    };

    const handleReportChange = (e) => {
        setSelectedReport(e.target.value);
        setSelectedSubOption(''); // Reset sub-option when report type changes
    };

    const handleSubOptionChange = (e) => {
        setSelectedSubOption(e.target.value);
    };

    const handleClosePopup = () => {
        setShowPopup(false); // Close the popup
    };

    const handleShowReport = () => {
        // Handle showing the report
        console.log('Show Report:', selectedReport, selectedSubOption);
    };

    const handleDownloadReport = () => {
        // Handle downloading the report
        console.log('Download Report:', selectedReport, selectedSubOption);
    };

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />

            <div>
                <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Academic Year <sup className="text-red-500">*</sup>
                        </label>
                        <select
                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            value={selectedYear}
                            onChange={handleYearChange}
                        >
                            <option value="">Select Academic Year</option>
                            {academicYears.map((year, index) => (
                                <option key={index} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Academic Session <sup className="text-red-500">*</sup>
                        </label>
                        <select
                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            value={selectedSession}
                            onChange={handleSessionChange}
                            disabled={!selectedYear}
                        >
                            <option value="">Select Academic Session</option>
                            {academicSessions.map((session, index) => (
                                <option key={index} value={session}>{session}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Semester <sup className="text-red-500">*</sup>
                        </label>
                        <select
                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            value={selectedSemester}
                            onChange={handleSemesterChange}
                            disabled={!selectedSession}
                        >
                            <option value="">Select Semester</option>
                            {semesters.map((sem, index) => (
                                <option key={index} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>

                    {selectedSemester && (
                        <button
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                            onClick={handleSearchClick}
                        >
                            Search
                        </button>
                    )}
                </div>

                <div>
                    {showButtons && (
                        <div className="mt-6 container mx-auto">
                            <div className="flex gap-4 justify-center">
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                                    onClick={handleGetReportClick}
                                >
                                    Get Report
                                </button>
                                <button className="px-4 py-2 bg-yellow-500 text-white rounded-md">Schedule Meeting</button>
                                <button className="px-4 py-2 bg-red-500 text-white rounded-md">Student Query</button>
                            </div>

                            <div className="mt-6">
                                {/* <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Assigned Mentees</h3> */}
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full table-auto border-collapse">
                                        <thead>
                                            <tr className="bg-gray-200 dark:bg-gray-800 ">
                                                <th className="px-4 py-2 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">Name</th>
                                                <th className="px-4 py-2 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mentees.map((mentee, index) => (
                                                <tr key={mentee.id} className={(index % 2 == 0 ? " bg-white " : " bg-gray-200 ") + " hover:bg-gray-600 hover:text-white "}>
                                                    <td className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">{mentee.name}</td>
                                                    <td className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">{mentee.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Popup with Report Form */}
                {showPopup && (
                    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg animate-popup relative">
                            <h3 className="text-xl font-medium text-gray-700">Report Selection</h3>
                            <div className="flex flex-col gap-4 mt-4">
                                {/* Report Type */}
                                <div className="flex flex-col gap-1">
                                    <label className="font-medium text-gray-700">Report</label>
                                    <select
                                        className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                        value={selectedReport}
                                        onChange={handleReportChange}
                                    >
                                        <option value="">Select Report</option>
                                        <option value="MOM">MOM</option>
                                        <option value="CONSOLIDATE">CONSOLIDATE</option>
                                    </select>
                                </div>

                                {/* Conditional Sub-Options */}
                                {selectedReport === 'MOM' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="font-medium text-gray-700">Minutes of the Meeting Report</label>
                                        <select
                                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                            value={selectedSubOption}
                                            onChange={handleSubOptionChange}
                                        >
                                            <option value="">Select Meeting</option>
                                            <option value="MOMOption1">Meeting 1</option>
                                            <option value="MOMOption2">Meeting 2</option>
                                            <option value="MOMOption3">Meeting 3</option>
                                        </select>
                                    </div>
                                )}

                                {selectedReport === 'CONSOLIDATE' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="font-medium text-gray-700">CONSOLIDATE Report</label>
                                        <select
                                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                            value={selectedSubOption}
                                            onChange={handleSubOptionChange}
                                        >
                                            <option value="">Consolidate</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-4 justify-between">
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                    onClick={handleShowReport}
                                >
                                    Show Report
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                                    onClick={handleDownloadReport}
                                >
                                    Download Report
                                </button>
                            </div>

                            <button
                                className="absolute top-0 right-0 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                                style={{top: '0.5rem', right: '0.5rem'}}
                                onClick={handleClosePopup}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Page;
