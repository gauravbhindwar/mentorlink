import React from 'react'
import Navbar from '../../components/subComponents/Navbar'

const Page = () => {
    return (
        <>
            <Navbar className='fixed top-0 z-50 w-full bg-white border-b max-h-[56px] min-h-[56px] border-gray-200 dark:bg-gray-800 dark:border-gray-700' />
            <div className='pt-[72px]'> {/* Changed mt-[72px] to pt-[72px] */}
                <div className='top-[56px] '>
                    <div>
                        <div>
                            <label>Academic Year</label>
                            <select>
                                <option value="2022-2023">2022-2023</option>
                                <option value="2021-2022">2021-2022</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page