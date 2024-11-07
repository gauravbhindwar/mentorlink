"use client"
import React from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

const MentorDashBoard = () => {
    const router = useRouter(); // Hook to handle routing

    // Function to handle redirection when buttons are clicked
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
        <div className='flex flex-col justify-start items-center min-h-screen py-6'>
            {/* Buttons Section */}
            <div className='flex flex-wrap gap-6 justify-center items-center'>
                <div className='flex justify-center items-center'>
                    <Button
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all'
                        onClick={handleViewMenteeClick} // Button click handler
                    >
                        View Mentee
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all'
                        onClick={handleScheduleMeetingClick} // Button click handler
                    >
                        Schedule New Meeting
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all'
                        onClick={handleAddMeetingInfoClick} // Button click handler
                    >
                        Add Meeting Information
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all'
                        onClick={handleGenerateReportClick} // Button click handler
                    >
                        Generate Meeting Report
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all'
                        onClick={handleStudentQueryClick} // Button click handler
                    >
                        Student Query
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default MentorDashBoard
