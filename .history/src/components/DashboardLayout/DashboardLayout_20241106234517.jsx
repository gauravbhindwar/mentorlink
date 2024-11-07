"use client"
import React, { useState } from 'react'

const DashboardLayout = ({ academicYears, academicSessions }) => {
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedSession, setSelectedSession] = useState('')

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value)
        setSelectedSession('') // Reset session when year changes
    }

    const handleSessionChange = (event) => {
        setSelectedSession(event.target.value)
    }

    return (
        <div className='pt-[72px]'>
            <div className='top-[56px]'>
                <div>
                    <div>
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
                </div>
            </div>
        </div>
    )
}

export default DashboardLayout