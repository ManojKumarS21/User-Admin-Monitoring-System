const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const powerbi = require("../services/powerbi");

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    try {
        if (fileExtension === ".csv") {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (row) => data.push(row))
                .on("end", async () => {
                    await processAndRespond(data, req, res, filePath);
                });
        } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            await processAndRespond(data, req, res, filePath);
        } else {
            res.status(400).json({ error: "Unsupported file format. Use CSV or Excel." });
        }
    } catch (error) {
        res.status(500).json({ error: "Fail to parse file: " + error.message });
    }
});

async function processAndRespond(data, req, res, filePath) {
    // 1. Clean up file
    fs.unlinkSync(filePath);

    // 2. Push to Power BI (Wait for sync to ensure visualization is ready)
    let syncResult = { success: false, message: "Sync not started" };
    try {
        syncResult = await powerbi.pushDataToPowerBI("User Uploaded Data", "Analytics", data);
    } catch (e) {
        console.error("Power BI Sync issue:", e.message);
        syncResult = { success: false, message: e.message };
    }

    // 3. Return data for frontend visualization
    res.json({
        message: syncResult.success ? "File processed and synced successfully" : "File processed but sync failed",
        syncStatus: syncResult.success ? "success" : "partial",
        recordCount: data.length,
        previewData: data.slice(0, 10),
        fullData: data
    });
}

router.get("/embed-config", async (req, res) => {
    try {
        const config = await powerbi.getEmbedConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch Power BI config: " + error.message });
    }
});

module.exports = router;
