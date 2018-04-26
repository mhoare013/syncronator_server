import * as bodyParser from "body-parser";
import * as express from "express";
import * as fs from "fs";
import * as morgan from "morgan";
import * as path from "path";
import { Database } from "sqlite3";
import * as winston from "winston";
import { LoggerInstance } from "winston";
import * as Controller from "./controller/index";
import moment = require("moment");

const sqlite3 = require("sqlite3").verbose();


class App {

    private express: express.Application;
    private socketIO: Controller.SocketIO;
    private readonly EXPRESS_PORT: number;
    private readonly SOCKET_PORT: number;
    private logger: LoggerInstance;
    private readonly rootDir: string;
    private dataBase: Database;

    constructor(EXPRESS_PORT: number, SOCKET_PORT: number) {
        // Set Ports
        this.EXPRESS_PORT = EXPRESS_PORT;
        this.SOCKET_PORT = SOCKET_PORT;

        // Global Dir
        require("app-root-dir").set(__dirname.substring(0, __dirname.length - 4)); // To the Deploy Folder
        this.rootDir = require("app-root-dir").get();

        // Pre Setup
        this.setupLogging();
        this.setupDB();

        this.setupExpress();
        this.mountRoutes();
        this.setupRelayServer();

        this.socketIO = new Controller.SocketIO(this.express, SOCKET_PORT, this.dataBase, this.logger);
    }

    public startServer(): void {

        // Start it
        this.express.listen(this.EXPRESS_PORT, "0.0.0.0", (err) => {
            if (err) {
                this.logger.error(`Server Error -> ${err}`);
                process.exit(1);
            }
            this.logger.debug(`Syncronator Started on Port -> ${this.EXPRESS_PORT}`);
        });

        this.socketIO.startSocketIO();
    }

    private setupExpress() {
        // Express
        this.express = express();

        // MiddleWare
        this.express.use(bodyParser.urlencoded({"extended": true}));
        this.express.use(bodyParser.json());
        // this.express.use(morgan("common", {
        //     stream: new (class StreamWriter {
        //         private readonly logger;
        //
        //         constructor(logger: LoggerInstance) {
        //             this.logger = logger;
        //         }
        //
        //         write(text: string) {
        //             this.logger.express(text);
        //         }
        //     })(this.logger)
        // }));

        // Template
        this.express.set("view engine", "ejs");
        this.express.set("views", path.join(__dirname, "/resources/views"));

        this.logger.debug("Set up Express");
    }

    private mountRoutes(): void {

        this.express.use("", new Controller.Log(this.logger).getRouter());
        this.express.use("/api", new Controller.EndpointApi(this.dataBase, this.logger).getRouter());

        this.logger.debug("Set up Express Routes");
    }

    private setupDB(): void {

        this.dataBase = new sqlite3.Database(`${this.rootDir}/volume/database.db`);

        const setup = fs.readFileSync(`${this.rootDir}/src/resources/database/setup.sql`, "utf8");

        this.dataBase.serialize(() => {
            this.dataBase.exec(setup, (err) => {
                if (err) {
                    this.logger.error(`SQLITE Error -> ${err}`);
                    process.exit(1);
                }
            });
        });

        this.logger.debug("Setup Database");
    }

    private setupLogging(): void {

        // Winston Logging
        this.logger = new (winston.Logger)({
            levels: {
                debug: 1,
                error: 2,
                express: 3,
                info: 4,
            },
            transports: [
                // colorize the output to the console
                new (winston.transports.Console)({
                    prettyPrint: true,
                    formatter: (format) => {
                        if (format.level != "express")
                            return format.message;
                        else
                            return "";
                    }
                }),
                new (winston.transports.File)({
                    name: "file#debug",
                    level: "error",
                    filename: `${this.rootDir}/volume/logs/debug.txt`,
                    json: false,
                    formatter: (format) => {
                        if (format.level === "debug" || format.level === "error")
                            return `(${format.level.toUpperCase()}) -> [${moment().format("MMMM Do YYYY, h:mm:ss a")}] | ${format.message.trim()}`;
                        else
                            return "";
                    }
                }),
                // new (winston.transports.File)({
                //     name: "file#express",
                //     level: "express",
                //     filename: `${this.rootDir}/volume/logs/access.txt`,
                //     json: false,
                //     formatter: (format) => {
                //         if (format.level === "express")
                //             return `${format.message}`;
                //         else
                //             return "";
                //     }
                // })
            ]
        });

        this.logger.debug("Set up Logger");
    }

    private setupRelayServer() {
        const relayServer = require("node-tcp-relay");
        const newRelayServer = relayServer.createRelayServer(10080, 10081);

    }
}

export default App;