import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <Navbar />
            <div className='mt-[56px]'>
                <div className='top-[56px]'>
                    Dashboard
                    <div>
                        <label>Academic Year</label>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page