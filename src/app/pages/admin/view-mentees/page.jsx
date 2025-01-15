"use client";
import React, { useState } from 'react';
import "@/app/styles.css";

const Page = () => {
    const [semester, setSemester] = useState("3");
    const [section, setSection] = useState("All");
    const [mentorID, setMentorID] = useState("");

    const menteeData = [
        {
            "registration_number": "2112345678",
            "name": "Alex Johnson",
            "section": "A",
            "semester": 3,
            "mentor_id": "MUJ001",
            "mentor_name": "Dr. Emily Carter"
        },
        {
            "registration_number": "2212345679",
            "name": "Jordan Smith",
            "section": "B",
            "semester": 5,
            "mentor_id": "MUJ002",
            "mentor_name": "Prof. Michael Thompson"
        },
        {
            "registration_number": "2312345680",
            "name": "Taylor Brown",
            "section": "C",
            "semester": 7,
            "mentor_id": "MUJ003",
            "mentor_name": "Dr. Sarah Wilson"
        },
        {
            "registration_number": "2112345681",
            "name": "Morgan Davis",
            "section": "A",
            "semester": 3,
            "mentor_id": "MUJ004",
            "mentor_name": "Prof. Robert Martinez"
        },
        {
            "registration_number": "2212345682",
            "name": "Casey Lee",
            "section": "B",
            "semester": 3,
            "mentor_id": "MUJ005",
            "mentor_name": "Dr. Laura Anderson"
        }
    ];

    const [filteredData, setFilteredData] = useState(menteeData);

    const handleFilter = () => {
        const filtered = menteeData.filter((row) => {
            const matchesSemester = semester === "All" || row.semester == semester;
            const matchesSection = section === "All" || row.section == section;
            const matchesMentorID = !mentorID || row.mentor_id === mentorID;
            return matchesSemester && matchesSection && matchesMentorID;
        });
        setFilteredData(filtered);
    };

    return (
        <>
            <h1 className="text-center my-6 text-5xl">View Mentees</h1>
            <div className="container mx-auto w-[90%] my-3 flex flex-row items-center justify-center gap-5 border px-5 py-1 bg-gray-500 ">
                <div className="flex flex-row items-center justify-center gap-5 border px-5 py-1 bg-gray-500 ">
                    <label htmlFor="semesterChoose" className="text-white">Semester</label>
                    <select
                        name="semesterChoose"
                        id="semesterChoose"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="bg-white w-40 px-2 border border-gray-300"
                    >
                        <option value="All">All</option>
                        <option value="3">III</option>
                        <option value="5">V</option>
                        <option value="7">VII</option>
                    </select>
                </div>
                <div className="flex flex-row items-center justify-center gap-5 border px-5 py-1 bg-gray-500 ">
                    <label htmlFor="sectionChoose" className="text-white">Section</label>
                    <select
                        name="sectionChoose"
                        id="sectionChoose"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="bg-white w-40 px-2 border border-gray-300"
                    >
                        <option value="All">All</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                    </select>
                </div>
                <div className="flex flex-row items-center justify-center gap-5 border px-5 py-1 bg-gray-500 ">
                    <label htmlFor="mentorID" className="text-white">Mentor ID</label>
                    <input
                        type="text"
                        name="mentorID"
                        id="mentorID"
                        value={mentorID}
                        onChange={(e) => setMentorID(e.target.value)}
                        placeholder=""
                        className="bg-white w-40 px-2 border border-gray-300"
                    />
                </div>
                <button
                    className="bg-orange-400 text-black rounded-xl px-5 py-1"
                    onClick={handleFilter}
                >
                    Filter
                </button>
            </div>

            <table className="container mx-auto w-[90%] border-y">
                <thead className="">
                    <tr className="tableHeader">
                        <th>S. No.</th>
                        <th>Name</th>
                        <th>Section</th>
                        <th>Semester</th>
                        <th>Mentor ID</th>
                        <th>Mentor Name</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((row, index) => (
                        <TableRow
                            key={index}
                            sno={index + 1}
                            name={row.name}
                            section={row.section}
                            sem={row.semester}
                            mentorID={row.mentor_id}
                            mentorName={row.mentor_name}
                        />
                    ))}
                </tbody>
            </table>
        </>
    );
};

const TableRow = ({ sno, name, section, sem, mentorID, mentorName }) => {
    return (
        <tr className={(sno - 1) % 2 == 0 ? " bg-white " : " bg-gray-200 "}>
            <td>{sno}</td>
            <td>{name}</td>
            <td>{section}</td>
            <td>{sem}</td>
            <td>{mentorID}</td>
            <td>{mentorName}</td>
        </tr>
    );
};

export default Page;