import React from 'react'
import { Button } from '../ui/button'

const MentorDashBoard = () => {
    return (
        <div className='flex flex-col justify-center items-center min-h-screen'>
            {/* Avatar Section */}
            <div className='mb-6'>
                <img
                    src="https://via.placeholder.com/150"
                    alt="Mentor Avatar"
                    className='rounded-full w-32 h-32 border-4 border-blue-500'
                />
            </div>

            {/* Buttons Section */}
            <div className='flex flex-wrap gap-6 justify-center items-center'>
                <div className='flex justify-center items-center'>
                    <Button className='text-lg py-3 px-6'>
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
