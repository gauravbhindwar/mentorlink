"use client";
import "@/app/styles.css";
import { useState } from "react";

export default function Page() {
    const [selectedSem, changeSem] = useState([3, 5, 7]);
    return (
        <>
            <h1 className="text-center my-6 text-5xl">View Mentors</h1>

            <div className="container mx-auto w-1/3 flex justify-around my-10">
                <div className="flex flex-row items-center justify-center gap-5 border px-5 py-1 bg-gray-500 ">
                    <label htmlFor="semesterChoose" className="text-white">Semester</label>
                    <select name="semesterChoose" id="semesterChoose" defaultValue={"All"} className="bg-white w-40 px-2 border border-gray-300">
                        <option value={[3, 5, 7]}>All</option>
                        <option value={[3]}>III</option>
                        <option value={[5]}>V</option>
                        <option value={[7]}>VII</option>
                    </select>

                </div>
                <button className="bg-orange-400 text-black rounded-xl px-5 py-1" onClick={() => changeSem(document.querySelector("#semesterChoose").value)}>Filter</button>
            </div>

            <table className="container mx-auto w-[90%] border-y">
                <thead className="">
                    <tr className="tableHeader">
                        <th>S. No.</th>
                        <th>MUJ ID</th>
                        <th>Name</th>
                        <th>Semester</th>
                        <th>No. of Mentees</th>
                        <th>Meetings Held</th>
                    </tr>
                </thead>
                <tbody>
                    {mentorData.filter(row => {return selectedSem.includes(row.sem)}).map((row, index) => {
                        return <TableRow 
                            key={index}
                            sno={index + 1}
                            mujID={row.mujID}
                            Name={row.Name}
                            sem={row.sem}
                            mentees={row.mentees}
                            meetings={row.meetings}
                        />
                    })}
                </tbody>
            </table>
        </>
    )

}

function TableRow({sno, mujID, Name, sem, mentees, meetings}) {
    return (
        <tr className={(sno - 1) % 2 == 0 ? " bg-white " : " bg-gray-200 "}>
            <td>{sno}</td>
            <td>{mujID}</td>
            <td>{Name}</td>
            <td>{sem}</td>
            <td>{mentees}</td>
            <td>{meetings}</td>
        </tr>
    )
}

const mentorData = [
    {
        mujID: "MUJ001",
        Name: "Lorem Ipsum",
        sem: 3,
        mentees: 8,
        meetings: 2
    },
    {
        mujID: "MUJ002",
        Name: "John Doe",
        sem: 7,
        mentees: 10,
        meetings: 3
    },
    {
        mujID: "MUJ003",
        Name: "Jane Smith",
        sem: 5,
        mentees: 12,
        meetings: 1
    }
];