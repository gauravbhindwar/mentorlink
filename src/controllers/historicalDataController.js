import HistoricalData from "../lib/db/historicalDataSchema";

export async function fetchHistoricalData(req, res) {
    const { collectionName, year, term, semester, section, mentorMujid, menteeMujid } = req.query;
    const filter = {};

    if (collectionName) filter.collectionName = collectionName;
    if (year) filter["data.year"] = parseInt(year);
    if (term) filter["data.term"] = term;
    if (semester) filter["data.semester"] = parseInt(semester);
    if (section) filter["data.section"] = section;
    if (mentorMujid) filter["data.mentorMujid"] = mentorMujid;
    if (menteeMujid) filter["data.mujid"] = menteeMujid;

    try {
        const historicalData = await HistoricalData.find(filter);
        res.status(200).json(historicalData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}