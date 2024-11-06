import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <div>
                <div className='fixed'>
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