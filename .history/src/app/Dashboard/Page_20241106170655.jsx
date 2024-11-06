import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <div>
                <div className='h-[fit-content]'>
                    <Navbar />
                </div>
                <div>
                    Dashboard
                </div>
            </div>
        </>
    )
}

export default Page