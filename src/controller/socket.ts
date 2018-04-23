import { Data } from "ejs";
import * as express from "express";
import { createServer, Server } from "http";
import * as SocketIOLibrary from "socket.io";
import { Database } from "sqlite3";
import { EndpointModel } from "../models/index";
import { LoggerInstance } from "winston";

class SocketIO {

    private readonly express: express.Application;
    private readonly logger: LoggerInstance;
    private database: Database;
    private server: Server;
    private socketIO: SocketIO.Server;
    private readonly SOCKET_PORT: number;
    private EndpointModel: EndpointModel;

    constructor(express: express.Application, SOCKET_PORT: number, database: Database, logger: LoggerInstance) {
        this.express = express;
        this.SOCKET_PORT = SOCKET_PORT;
        this.logger = logger;
        this.database = database;
        this.EndpointModel = new EndpointModel(this.database, this.logger);
    }

    public startSocketIO(): void {
        // Set up SocketIO
        this.server = createServer(this.express);
        this.socketIO = SocketIOLibrary(this.server);
        this.server.listen(this.SOCKET_PORT, () => {
            this.logger.debug(`SocketIO Sever Start on Port -> ${this.SOCKET_PORT}`);
        });

        this.socketIO.on("connect", (socket) => {
            this.logger.debug(`$SocketIO[connect] -> ${socket.id} connected`);


            // Send your ID
            socket.on("teamLookUp", (mac_id) => {
                this.EndpointModel.lookUpTeam(mac_id, (err, data) => {
                    socket.emit("team", data);
                });
            });

            socket.on("json", (mac_id) => {
                this.EndpointModel.getJson(mac_id, (err, data) => {
                    socket.emit("json", data);
                });
            });


            socket.on("disconnect", () => {
                this.logger.debug(`$SocketIO[disconnect] -> ${socket.id} disconnect`);
            });

        });

    }

}

export default SocketIO;