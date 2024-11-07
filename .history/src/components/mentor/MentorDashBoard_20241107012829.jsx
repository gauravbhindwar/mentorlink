import React from 'react'
import { Button } from '../ui/button'

const MentorDashBoard = () => {
    return (
        <div className='item-center '>
            <div className='flex gap-4 w-1/2'>
                <Button>
                    View Mentee
                </Button>
                <Button>
                    Schedule New Metting
                </Button>
            </div>

            <div className='flex gap-4 w-1/2'>
                <Button>
                    Add Metting Information
                </Button>
                <Button>
                    Generate Metting Report
                </Button>
            </div>

            <div>
                <Button>
                    Student Query
                </Button>
            </div>
        </div>
    )
}

export default MentorDashBoard