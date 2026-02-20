const express = require("express");
const router = express.Router();
const powerbi = require("../services/powerbi");

// Power BI Embed Configuration
router.get("/embed-config", async (req, res) => {
    try {
        const config = await powerbi.getEmbedConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch Power BI config: " + error.message });
    }
});

module.exports = router;
