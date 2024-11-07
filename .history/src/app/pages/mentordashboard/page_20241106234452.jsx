import React from 'react'
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'

const page = () => {
    const academicYears = ["2022-2023", "2021-2022", "2020-2021", "2019-2020"]
    const academicSessions = ["DEC-JUNE(EVEN SEM)", "JUL-NOV(ODD SEM)"]

    return (
        <DashboardLayout academicYears={academicYears} academicSessions={academicSessions} />
    )
}

export default page