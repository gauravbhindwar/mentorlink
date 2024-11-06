import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    const academicYears = ["2022-2023", "2021-2022", "2020-2021", "2019-2020"]
    return (
        <>
            <Navbar className='fixed top-0 z-50 w-full bg-white border-b max-h-[56px] min-h-[56px] border-gray-200 dark:bg-gray-800 dark:border-gray-700' />

            <div className='pt-[72px]'>
                <div className='top-[56px] '>
                    <div>
                        <div className='flex'>
                            <label>Academic Year</label>
                            <select>
                                {academicYears.map((year, index) => (
                                    <option key={index} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page