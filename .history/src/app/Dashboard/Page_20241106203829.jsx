import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <Navbar />
            <div className='position-fixed  mt-[56px]'>
                <div className='top-[56px]'>
                    Dashboard
                </div>
            </div>
        </>
    )
}

export default Page