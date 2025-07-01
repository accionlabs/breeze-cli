import { configDotenv } from "dotenv";
configDotenv();

export default {
    ISOMETRIC_API_URL: process.env.ISOMETRIC_API_URL || "https://isometric-backend.accionbreeze.com",
}