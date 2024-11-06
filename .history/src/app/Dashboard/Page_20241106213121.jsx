"use client"
import React, { useState } from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    const academicYears = ["2022-2023", "2021-2022", "2020-2021", "2019-2020"]
    const academicSession = ["DEC-JUNE  2022", "JUL-NOV 2022", "DEC-JUNE 2023", "JUL-NOV 2023", "DEC-JUNE  2024", "JUL-NOV 2024", "DEC-JUNE 2025", "JUL-NOV 2025"]
    const semester = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]

    const [selectedReport, setSelectedReport] = useState('');
    const [selectedSubOption, setSelectedSubOption] = useState('');

    const handleReportChange = (e) => {
        setSelectedReport(e.target.value);
        setSelectedSubOption(''); // Reset sub-option when report type changes
    };

    const handleSubOptionChange = (e) => {
        setSelectedSubOption(e.target.value);
    };

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />

            <div className="pt-20 px-4 sm:px-8 md:px-10 lg:px-20">
                <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Academic Year <sup className="text-red-500">*</sup>
                        </label>
                        <select className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {academicYears.map((year, index) => (
                                <option key={index} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Academic Session <sup className="text-red-500">*</sup>
                        </label>
                        <select className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {academicSession.map((session, index) => (
                                <option key={index} value={session}>{session}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Semester <sup className="text-red-500">*</sup>
                        </label>
                        <select className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {semester.map((sem, index) => (
                                <option key={index} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>
                    {/* Report Selection */}
                    <div className="flex flex-col gap-1 w-full md:w-1/4">
                        <label className="font-medium text-gray-700 dark:text-gray-300">
                            Report <sup className="text-red-500">*</sup>
                        </label>
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
                        <div className="flex flex-col gap-1 w-full md:w-1/4">
                            <label className="font-medium text-gray-700 dark:text-gray-300">
                                MOM Options
                            </label>
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
                        <div className="flex flex-col gap-1 w-full md:w-1/4">
                            <label className="font-medium text-gray-700 dark:text-gray-300">
                                CONSOLIDATE Options
                            </label>
                            <select
                                className="select p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                value={selectedSubOption}
                                onChange={handleSubOptionChange}
                            >
                                <option value="">Select CONSOLIDATE</option>
                                <option value="ConsolidateOption1">Consolidate Option 1</option>
                                <option value="ConsolidateOption2">Consolidate Option 2</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Page