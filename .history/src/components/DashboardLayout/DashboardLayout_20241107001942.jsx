"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/subComponents/Navbar';

const Page = () => {
    const academicYears = ["2023-2024", "2022-2023", "2021-2022"];
    const academicSessions = ["DEC-JUNE(EVEN SEM)", "JUL-NOV(ODD SEM)"];
    const oddSem = ["III", "IV", "VII"];
    const evenSem = ["IV", "VI", "VIII"];

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");
    // const [selectedReport, setSelectedReport] = useState("");
    // const [selectedSubOption, setSelectedSubOption] = useState("");
    const [semesters, setSemesters] = useState([]); // Track available semesters
    const [showButtons, setShowButtons] = useState(false); // Track if special buttons are shown

    // Sample mentee data
    const mentees = [
        { id: 1, name: "John Doe", email: "john.doe@example.com" },
        { id: 2, name: "Jane Smith", email: "jane.smith@example.com" },
        { id: 3, name: "Bob Johnson", email: "bob.johnson@example.com" }
    ];

    // Reset semester and session state when year changes
    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setSelectedSession("");
        setSelectedSemester("");
        // setSelectedReport("");
        // setSelectedSubOption(""); // Reset sub-option when year changes
        setSemesters([]); // Reset semesters
    };

    // Update semesters based on session selected
    const handleSessionChange = (e) => {
        setSelectedSession(e.target.value);
        setSelectedSemester(""); // Reset semester when session changes

        if (e.target.value === "DEC-JUNE(EVEN SEM)") {
            setSemesters(evenSem); // Set available semesters for even session
        } else if (e.target.value === "JUL-NOV(ODD SEM)") {
            setSemesters(oddSem); // Set available semesters for odd session
        }
    };

    // Handle semester change
    const handleSemesterChange = (e) => {
        setSelectedSemester(e.target.value);
    };

    // // Handle report type change
    // const handleReportChange = (e) => {
    //     setSelectedReport(e.target.value);
    //     setSelectedSubOption(''); // Reset sub-option when report type changes
    // };

    // // Handle sub-option change
    // const handleSubOptionChange = (e) => {
    //     setSelectedSubOption(e.target.value);
    // };

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />

            <div className="pt-20 px-4 sm:px-8 md:px-10 lg:px-20">
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
                            disabled={!selectedYear} // Disable if no year is selected
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
                            disabled={!selectedSession} // Disable if no session is selected
                        >
                            <option value="">Select Semester</option>
                            {semesters.map((sem, index) => (
                                <option key={index} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>


                </div>
            </div>
        </>
    );
};

export default Page;
