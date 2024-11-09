"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

const MentorDashBoard = () => {
    const router = useRouter(); // Hook to handle routing

    // Function to handle redirection when cards are clicked
    const handleViewMenteeClick = () => {
        router.push('/pages/viewmentee'); // Redirects to '/view-mentee' page
    }

    const handleScheduleMeetingClick = () => {
        router.push('/pages/schedulemeeting'); // Redirects to '/schedule-meeting' page
    }

    const handleAddMeetingInfoClick = () => {
        router.push('/pages/addmeetinginfo'); // Redirects to '/add-meeting-info' page
    }

    const handleGenerateReportClick = () => {
        router.push('/pages/generatereport'); // Redirects to '/generate-report' page
    }

    const handleStudentQueryClick = () => {
        router.push('/pages/studentquery'); // Redirects to '/student-query' page
    }

    return (
        <div className='flex flex-col justify-start items-center min-h-screen py-6 overflow-hidden'>
            {/* Cards Section */}
            <div className='flex flex-wrap gap-6 justify-center items-center'>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleViewMenteeClick} // Card click handler
                    >
                        View Mentee
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleScheduleMeetingClick} // Card click handler
                    >
                        Schedule New Meeting
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleAddMeetingInfoClick} // Card click handler
                    >
                        Add Meeting Information
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleGenerateReportClick} // Card click handler
                    >
                        Generate Meeting Report
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleStudentQueryClick} // Card click handler
                    >
                        Student Query
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MentorDashBoard