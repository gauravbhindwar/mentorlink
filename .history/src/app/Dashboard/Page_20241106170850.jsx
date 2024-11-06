import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <div>
                <div className='h-[fit-content]'>
                    <Navbar />
                </div>
                <div className='top-[56px]'>
                    Dashboard
                </div>
            </div>
        </>
    )
}

export default Page