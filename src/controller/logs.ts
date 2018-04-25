import * as express from "express";
import * as fs from "fs";
import { LoggerInstance } from "winston";

const nl2br = require("nl2br");

class Logger {
    private log_router = express.Router();
    private logger: LoggerInstance;
    private volume_path = `${require("app-root-dir").get()}/volume/logs/`;

    constructor(logger: LoggerInstance) {
        this.logger = logger;
        this.setupRoutes();
    }

    public getRouter(): express.Router {
        return this.log_router;
    }

    private setupRoutes(): void {

        this.log_router.get("/logs/debug", (req, res) => {
            this.readFile("debug.txt", res);
        });

        this.log_router.get("/logs/access", (req, res) => {
            this.readFile("access.txt", res);
        });

    }

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