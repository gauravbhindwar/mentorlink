import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Label } from '@/components/ui/label'
import Login from './Login'

const HomePage = () => {
    const [loginType, setLoginType] = useState(null)

    const handleMentorLogin = (data) => {
        // Add your logic here for mentor login
        console.log("Mentor Login", data)
    }

    const handleMenteeLogin = (data) => {
        // Add your logic here for mentee login
        console.log("Mentee Login", data)
    }

    const handleAdminLogin = (data) => {
        // Add your logic here for admin login
        console.log("Admin Login", data)
    }

    const handleHodLogin = (data) => {
        // Add your logic here for HOD login
        console.log("HOD Login", data)
    }

    return (
        <div className='flex flex-col mt-20 gap-6 items-center justify-center text-center'>
            {!loginType && (
                <>
                    <div>
                        <div>
                            <Label>Login As Mentor</Label>
                        </div>
                        <Button onClick={() => setLoginType('mentor')}>Mentor Login</Button>
                    </div>
                    <div>
                        <div>
                            <Label>Login As Mentee</Label>
                        </div>
                        <Button onClick={() => setLoginType('mentee')}>Mentee Login</Button>
                    </div>
                    <div>
                        <div>
                            <Label>Login As Admin</Label>
                        </div>
                        <Button onClick={() => setLoginType('admin')}>Admin Login</Button>
                    </div>
                    <div>
                        <div>
                            <Label>Login As HOD</Label>
                        </div>
                        <Button onClick={() => setLoginType('hod')}>HOD Login</Button>
                    </div>
                </>
            )}
            {loginType === 'mentor' && <Login handleLogin={handleMentorLogin} role="mentor" />}
            {loginType === 'mentee' && <Login handleLogin={handleMenteeLogin} role="mentee" />}
            {loginType === 'admin' && <Login handleLogin={handleAdminLogin} role="admin" />}
            {loginType === 'hod' && <Login handleLogin={handleHodLogin} role="hod" />}
        </div>
    )
}

export default HomePage