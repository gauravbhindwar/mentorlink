import React from 'react'
import { Button } from '../ui/button'

const MentorDashBoard = () => {
    return (
        <div >
            <div className='flex gap-4 w-full'>
                <Button>
                    View Mentee
                </Button>
                <Button>
                    Schedule New Metting
                </Button>
            </div>
            <div>

            </div>
            <div>
                <Button>
                    Add Metting Information
                </Button>
            </div>
            <div>
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