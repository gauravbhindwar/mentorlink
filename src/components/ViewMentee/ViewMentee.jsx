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

    const handleExportToExcel = () => {
        // Create CSV content
        const headers = ["Name", "Email"];
        const csvContent = [
            headers.join(","),
            ...mentees.map(mentee => `${mentee.name},${mentee.email}`)
        ].join("\n");

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "mentees.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />

            <div className="container mx-auto px-4 py-8 mt-16">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">View Mentees</h1>
                
                {/* Search Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 w-full">
                        <div className="flex flex-col gap-2 w-full md:w-1/3">
                            <label className="font-semibold text-gray-700 dark:text-gray-300">
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

                        <div className="flex flex-col gap-2 w-full md:w-1/3">
                            <label className="font-semibold text-gray-700 dark:text-gray-300">
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

                        <div className="flex flex-col gap-2 w-full md:w-1/3">
                            <label className="font-semibold text-gray-700 dark:text-gray-300">
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
                    </div>

                    {selectedSemester && (
                        <div className="mt-6 flex justify-center">
                            <button
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex items-center gap-2 shadow-md"
                                onClick={handleSearchClick}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                Search
                            </button>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {showButtons && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex flex-wrap gap-4 justify-center mb-8">
                            <button
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200 shadow-md flex items-center gap-2"
                                onClick={handleGetReportClick}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                Get Report
                            </button>
                            <button className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors duration-200 shadow-md flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Schedule Meeting
                            </button>
                            <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 shadow-md flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                Student Query
                            </button>
                            <button 
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 shadow-md flex items-center gap-2"
                                onClick={handleExportToExcel}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Export to Excel
                            </button>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Assigned Mentees</h3>
                            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                                <table className="min-w-full table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Name</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mentees.map((mentee, index) => (
                                            <tr 
                                                key={mentee.id} 
                                                className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200`}
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">{mentee.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">{mentee.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

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
