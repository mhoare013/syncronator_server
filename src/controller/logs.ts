import * as express from "express";
import * as fs from "fs";
import { LoggerInstance } from "winston";

// Logging Http Endpoint
class Logger {
    private log_router = express.Router();
    private logger: LoggerInstance;
    private volume_path = `${require("app-root-dir").get()}/volume/logs/`;

    constructor(logger: LoggerInstance) {
        this.logger = logger;
        this.setupRoutes();
    }

    /**
     * Return the Express Router for the /log url
     * @returns {e.Router}
     */
    public getRouter(): express.Router {
        return this.log_router;
    }

    /**
     * Set up paths
     */
    private setupRoutes(): void {

        this.log_router.get("/logs/debug", (req, res) => {
            this.readFile("debug.txt", res);
        });

        this.log_router.get("/logs/access", (req, res) => {
            this.readFile("access.txt", res);
        });

    }

    /**
     * Helper function to read files and send back response
     * @param {string} file - file nams
     * @param {e.Response} res - response to send back to client
     */
    private readFile(file: string, res: express.Response) {

        fs.readFile(`${this.volume_path}/${file}`, (err, data) => {
            if (err) {
                res.status(500).send("Error");
            } else {
                res.render("logs", {logs: data.toString().split("\n")});
            }
        });
    }
}

export default Logger;