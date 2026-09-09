import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

app.get("/health/db", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(500).json({
            status: "error",
            database: "disconnected"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
});