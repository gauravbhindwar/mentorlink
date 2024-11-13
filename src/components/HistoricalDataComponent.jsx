import React, { useState } from "react";
import axios from "axios";

const HistoricalDataComponent = () => {
    const [historicalData, setHistoricalData] = useState([]);
    const [filters, setFilters] = useState({
        collectionName: "",
        year: "",
        term: "",
        semester: "",
        section: "",
        mentorMujid: "",
        menteeMujid: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const fetchHistoricalData = async () => {
        try {
            const response = await axios.get("/historical-data", { params: filters });
            setHistoricalData(response.data);
        } catch (error) {
            console.error("Error fetching historical data:", error);
        }
    };

    const archiveOldData = async () => {
        try {
            await axios.post("/archive-old-data");
            alert("Old data archived successfully");
        } catch (error) {
            console.error("Error archiving old data:", error);
        }
    };

    return (
        <div>
            <h1>Historical Data</h1>
            <div>
                <button onClick={archiveOldData}>Archive Old Data</button>
            </div>
            <div>
                <input
                    type="text"
                    name="collectionName"
                    placeholder="Collection Name"
                    value={filters.collectionName}
                    onChange={handleInputChange}
                />
                <input
                    type="number"
                    name="year"
                    placeholder="Year"
                    value={filters.year}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="term"
                    placeholder="Term"
                    value={filters.term}
                    onChange={handleInputChange}
                />
                <input
                    type="number"
                    name="semester"
                    placeholder="Semester"
                    value={filters.semester}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="section"
                    placeholder="Section"
                    value={filters.section}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="mentorMujid"
                    placeholder="Mentor Mujid"
                    value={filters.mentorMujid}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="menteeMujid"
                    placeholder="Mentee Mujid"
                    value={filters.menteeMujid}
                    onChange={handleInputChange}
                />
                <button onClick={fetchHistoricalData}>Fetch Historical Data</button>
            </div>
            <div>
                {historicalData.length > 0 ? (
                    <ul>
                        {historicalData.map((data) => (
                            <li key={data._id}>{JSON.stringify(data)}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No historical data found</p>
                )}
            </div>
        </div>
    );
};

export default HistoricalDataComponent;