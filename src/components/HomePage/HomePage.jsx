"use client"
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Label } from '@/components/ui/label'
import Login from '@/components/Login/Login'
import '@/app/styles.css';

const HomePage = () => {
    const [loginType, setLoginType] = useState(null)

    const [activeButton, setActiveButton] = useState('');

    const handleButtonClick = (type) => {
        setActiveButton(type);
        setLoginType(type);
    };

    const handleMentorLogin = (data) => {
        // Add your logic here for mentor login
        console.log("Mentor Login", data);
    }

  const handleMenteeLogin = (data) => {
    console.log("Mentee Login", data);
  };

  const handleAdminLogin = (data) => {
    console.log("Admin Login", data);
  };

  const handleHodLogin = (data) => {
    console.log("HOD Login", data);
  };

    return (
        // <div className='flex flex-col mt-20 gap-6 items-center justify-center text-center'>
        //     {!loginType && (
        //         <>
        //             <div>
        //                 <div>
        //                     <Label>Login As Mentor</Label>
        //                 </div>
        //                 <Button onClick={() => setLoginType('mentor')}>Mentor Login</Button>
        //             </div>
        //             <div>
        //                 <div>
        //                     <Label>Login As Mentee</Label>
        //                 </div>
        //                 <Button onClick={() => setLoginType('mentee')}>Mentee Login</Button>
        //             </div>
        //             <div>
        //                 <div>
        //                     <Label>Login As Admin</Label>
        //                 </div>
        //                 <Button onClick={() => setLoginType('admin')}>Admin Login</Button>
        //             </div>
        //             <div>
        //                 <div>
        //                     <Label>Login As HOD</Label>
        //                 </div>
        //                 <Button onClick={() => setLoginType('hod')}>HOD Login</Button>
        //             </div>
        //         </>
        //     )}
        //     {loginType === 'mentor' && <Login handleLogin={handleMentorLogin} role="mentor" />}
        //     {loginType === 'mentee' && <Login handleLogin={handleMenteeLogin} role="mentee" />}
        //     {loginType === 'admin' && <Login handleLogin={handleAdminLogin} role="admin" />}
        //     {loginType === 'hod' && <Login handleLogin={handleHodLogin} role="hod" />}
        // </div>
        <>
            <div className="loginBox w-1/3 mx-auto my-20">
                <div className="tabDiv flex justify-around bg-slate-900 p-4 pb-0 text-gray-300">
                    
                <div className="w-1/4">
                        <button
                            className={`btn-class ${activeButton === 'mentee' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('mentee')}
                        >
                            Mentee
                        </button>
                    </div>
                    <div className="w-1/4">
                        <button
                            className={`btn-class ${activeButton === 'mentor' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('mentor')}
                        >
                            Mentor
                        </button>
                    </div>
                    <div className="w-1/4">
                        <button
                            className={`btn-class ${activeButton === 'admin' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('admin')}
                        >
                            Admin
                        </button>
                    </div>
                    <div className="w-1/4">
                        <button
                            className={`btn-class ${activeButton === 'hod' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('hod')}
                        >
                            HoD
                        </button>
                    </div>

                </div>


                <div>
                    {loginType === 'mentor' && <Login handleLogin={handleMentorLogin} role="mentor" />}
                    {loginType === 'mentee' && <Login handleLogin={handleMenteeLogin} role="mentee" />}
                    {loginType === 'admin' && <Login handleLogin={handleAdminLogin} role="admin" />}
                    {loginType === 'hod' && <Login handleLogin={handleHodLogin} role="hod" />}
                </div>
            </div>
        </>
    )
}

export default HomePage;