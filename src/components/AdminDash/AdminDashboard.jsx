"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

const AdminDashboard = () => {
    const router = useRouter();
    
    const handleManageMenteeClick = () => {
        router.push('/pages/admin/managementee');
    }

    const handleManageMentorClick = () => {
        router.push('/pages/admin/managementor');
    }

    const handleScheduleMeetingClick = () => {
        router.push('/pages/meetings/schmeeting');
    }

    const handleManageAdminsClick = () => {
        router.push('/pages/admin/manageadmins');
    }

    const handleStudentQueryClick = () => {
        router.push('/pages/queries/studentquery');
    }

    const handleMentorQueryClick = () => {
        router.push('/pages/queries/mentorquery');
    }

    const handleArchivesClick = () => {
        router.push('/pages/archives');
    }

    return (
        <div className='flex flex-col justify-start items-center min-h-screen py-6 overflow-hidden '>
            <div className='flex flex-wrap gap-6 justify-center items-center'>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleManageMenteeClick}
                        style={{ userSelect: 'none' }}
                    >
                        Manage Mentees
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleManageMentorClick}
                        style={{ userSelect: 'none' }}
                    >
                        Manage Mentors
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleScheduleMeetingClick}
                        style={{ userSelect: 'none' }}
                    >
                        Meetings
                    </div>
                </div>
                
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleManageAdminsClick}
                        style={{ userSelect: 'none' }}
                    >
                        Manage Admins
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleStudentQueryClick}
                        style={{ userSelect: 'none' }}
                    >
                        Student Query
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleMentorQueryClick}
                        style={{ userSelect: 'none' }}
                    >
                        Mentor Query
                    </div>
                </div>
                <div className='flex justify-center items-center'>
                    <div
                        className='text-lg py-4 px-8 rounded-full bg-gray-300 border-2 border-orange-500 text-black hover:bg-orange-300 hover:text-black hover:border-orange-400 hover:ring-4 hover:ring-orange-300 transition-all cursor-pointer'
                        onClick={handleArchivesClick}
                        style={{ userSelect: 'none' }}
                    >
                        Archives
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard