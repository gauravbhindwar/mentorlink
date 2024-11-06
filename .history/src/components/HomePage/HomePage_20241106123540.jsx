import React from 'react'
import { Button } from '../ui/button'
import { Label } from '@/components/ui/label';

const HomePage = () => {
    const handleMentorLogin = () => {
        // Add your logic here
    }

    const handleMenteeLogin = () => {
        // Add your logic here
    }

    const handleAdminLogin = () => {
        // Add your logic here
    }
    return (
        <div className='flex flex-col mt-20 gap-6 items-center justify-center text-center'>


            <div>
                <div>
                    <Label>Login As Mentor</Label>
                </div>
                <Button
                    onClick={handleMentorLogin()}>Mentor Login

                </Button>
            </div>
            <div>
                <div>
                    <Label>Login As Mentee</Label>
                </div>
                <Button
                    onClick={handleMenteeLogin()}>Mentee Login</Button>
            </div>
            <div>
                <div>
                    <Label>Login As Admin</Label>
                </div>
                <Button
                    onClick={handleAdminLogin()}>Admin Login</Button>
            </div>
        </div >
    )
}

export default HomePage
