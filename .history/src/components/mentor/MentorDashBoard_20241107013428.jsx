import React from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/router'

const MentorDashBoard = () => {
    const router = useRouter(); // Hook to handle routing

    // Function to handle redirection when button is clicked
    const handleViewMenteeClick = () => {
        router.push('/view-mentee'); // Redirects to '/view-mentee' page
    }

    return (
        <div className='flex flex-col justify-start items-center min-h-screen py-6'>
            {/* Buttons Section */}
            <div className='flex flex-wrap gap-6 justify-center items-center'>
                <div className='flex justify-center items-center'>
                    <Button
                        className='text-lg py-3 px-6'
                        onClick={handleViewMenteeClick} // Button click handler
                    >
                        View Mentee
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button className='text-lg py-3 px-6'>
                        Schedule New Meeting
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button className='text-lg py-3 px-6'>
                        Add Meeting Information
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button className='text-lg py-3 px-6'>
                        Generate Meeting Report
                    </Button>
                </div>
                <div className='flex justify-center items-center'>
                    <Button className='text-lg py-3 px-6'>
                        Student Query
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default MentorDashBoard
