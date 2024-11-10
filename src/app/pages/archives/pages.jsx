import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Pages = () => {
    const [historicalData, setHistoricalData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/historicalData');
                setHistoricalData(response.data);
            } catch (error) {
                console.error('Error fetching historical data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Archive Page</h1>
            <div>
                {historicalData.map((data) => (
                    <div key={data._id}>
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Pages;