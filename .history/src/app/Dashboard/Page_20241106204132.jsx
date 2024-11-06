import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <Navbar />
            <div className='mt-[56px]'>
                <div className='top-[56px] mt-[56px]'>

                    <div>
                        <label>Academic Year</label>
                        <select>
                            <option value="2022-2023">2022-2023</option>
                            <option value="2021-2022">2021-2022</option>
                        </select>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page