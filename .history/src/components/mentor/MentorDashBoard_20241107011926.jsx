import React from 'react'
import { Button } from '../ui/button'

const MentorDashBoard = () => {
    return (
        <div>
            <div>
                <Button>
                    View Mentee
                </Button>
            </div>
            <div>
                <Button>
                    Schedule New Metting
                </Button>
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
        </div>
    )
}

export default MentorDashBoard