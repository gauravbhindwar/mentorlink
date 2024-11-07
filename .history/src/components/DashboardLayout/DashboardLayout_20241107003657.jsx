"use client";
import React, { useState } from 'react';
import Navbar from '../../components/subComponents/Navbar';

const Page = () => {
    const academicYears = ["2023-2024", "2022-2023", "2021-2022"];
    const academicSessions = ["DEC-JUNE(EVEN SEM)", "JUL-NOV(ODD SEM)"];
    const oddSem = ["III", "IV", "VII"];
    const evenSem = ["IV", "VI", "VIII"];

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");
    const [semesters, setSemesters] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const [showReportPopup, setShowReportPopup] = useState(false);
    const [selectedReport, setSelectedReport] = useState("");
    const [selectedSubOption, setSelectedSubOption] = useState("");

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

    const handleReportChange = (e) => {
        setSelectedReport(e.target.value);
        setSelectedSubOption(''); // Reset sub-option when report type changes
    };

    const handleSubOptionChange = (e) => {
        setSelectedSubOption(e.target.value);
    };

    const handleGetReportClick = () => {
        setShowReportPopup(true); // Show the popup
    };

    const closePopup = () => {
        setShowReportPopup(false); // Close the popup
    };

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />

            <div className="pt-20 px-4 sm:px-8 md:px-10 lg:px-20">
                <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                    {/* Year Selection */}
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

                    {/* Session Selection */}
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

                    {/* Semester Selection */}
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

                {/* Conditional Buttons */}
                {showButtons && (
                    <div className="mt-6 flex flex-col gap-4">
                        <div className="flex gap-4">
                            <button className="px-4 py-2 bg-green-500 text-white rounded-md" onClick={handleGetReportClick}>
                                Get Report
                            </button>
                            <button className="px-4 py-2 bg-yellow-500 text-white rounded-md">Schedule Meeting</button>
                            <button className="px-4 py-2 bg-red-500 text-white rounded-md">Student Query</button>
                        </div>
                    </div>
                )}

                {/* Popup for Report Selection */}
                {showReportPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-md shadow-lg w-1/2">
                            <h3 className="text-xl font-semibold mb-4">Report Selection</h3>

                            <div className="flex flex-col gap-2">
                                {/* Report Selection */}
                                <div className="flex flex-col gap-1">
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Report</label>
                                    <select
                                        className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                        value={selectedReport}
                                        onChange={handleReportChange}
                                        disabled={!selectedSemester}
                                    >
                                        <option value="">Select Report</option>
                                        <option value="MOM">MOM</option>
                                        <option value="CONSOLIDATE">CONSOLIDATE</option>
                                    </select>
                                </div>

                                {/* Conditional Sub-Options */}
                                {selectedReport === 'MOM' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="font-medium text-gray-700 dark:text-gray-300">MOM Report</label>
                                        <select
                                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                            value={selectedSubOption}
                                            onChange={handleSubOptionChange}
                                        >
                                            <option value="">Select MOM</option>
                                            <option value="MOMOption1">MOM 1</option>
                                            <option value="MOMOption2">MOM 2</option>
                                            <option value="MOMOption3">MOM 3</option>
                                        </select>
                                    </div>
                                )}

                                {selectedReport === 'CONSOLIDATE' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="font-medium text-gray-700 dark:text-gray-300">CONSOLIDATE Report</label>
                                        <select
                                            className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                            value={selectedSubOption}
                                            onChange={handleSubOptionChange}
                                        >
                                            <option value="">Select CONSOLIDATE</option
                                                                                    </select>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Buttons for Show Report and Download Report */}
                            <div className="mt-4 flex justify-between gap-4">
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                    onClick={() => {
                                        alert("Displaying the report...");
                                        closePopup(); // Close the popup after showing the report
                                    }}
                                >
                                    Show Report
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                                    onClick={() => {
                                        alert("Downloading the report...");
                                        closePopup(); // Close the popup after download
                                    }}
                                >
                                    Download Report
                                </button>
                            </div>

                            {/* Close Button */}
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                                onClick={closePopup}
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Assigned Mentees Table */}
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Assigned Mentees</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-800">
                                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">Name</th>
                                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mentees.map((mentee) => (
                                    <tr key={mentee.id} className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <td className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">{mentee.name}</td>
                                        <td className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">{mentee.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;

