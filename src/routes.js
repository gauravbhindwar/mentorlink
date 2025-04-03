
// Archive old data route
import express from "express";
import { fetchHistoricalData } from "./controllers/historicalDataController";
import { archiveOldData } from "./lib/archiveData";

const router = express.Router();

router.get("/historical-data", fetchHistoricalData);
router.post("/archive-old-data", async (req, res) => {
    try {
        await archiveOldData();
        res.status(200).json({ message: "Old data archived successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;