import React from 'react'
import { Button } from '../ui/button'

const MentorDashBoard = () => {
    return (
        <div className='flex flex-wrap gap-4 justify-center items-center p-6'>
            <div className='flex justify-center items-center'>
                <Button>
                    View Mentee
                </Button>
            </div>
            <div className='flex justify-center items-center'>
                <Button>
                    Schedule New Meeting
                </Button>
            </div>
            <div className='flex justify-center items-center'>
                <Button>
                    Add Meeting Information
                </Button>
            </div>
            <div className='flex justify-center items-center'>
                <Button>
                    Generate Meeting Report
                </Button>
            </div>
            <div className='flex justify-center items-center'>
                <Button>
                    Student Query
                </Button>
            </div>
        </div>
    )
}

export default MentorDashBoard
