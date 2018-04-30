import * as express from "express";
import { createServer, Server } from "http";
import * as SocketIOLibrary from "socket.io";
import { Database } from "sqlite3";
import { EndpointModel } from "../models/index";
import { LoggerInstance } from "winston";

class SocketIO {

    private readonly express: express.Application;
    private readonly logger: LoggerInstance;
    private readonly database: Database;
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

    // Socket.IO calls

    public startSocketIO(): void {
        // Set up SocketIO
        this.server = createServer(this.express);
        this.socketIO = SocketIOLibrary(this.server);
        this.server.listen(this.SOCKET_PORT, () => {
            this.logger.debug(`SocketIO Sever Start on Port -> ${this.SOCKET_PORT}`);
        });

        // Client Connects
        this.socketIO.on("connect", (socket) => {
            this.logger.debug(`$SocketIO[connect] -> ${socket.id} connected`);

            // Tell everyone who is active
            socket.on("get_active", (data) => {
                this.logger.debug(`$SocketIO[get_active] -> ${socket.id} connected`);
                socket.broadcast.emit("active", data);
            });

            // Boadcast a message on a client mac address
            socket.on("p2p", (data) => {

                const mac_id = data.mac_id;
                const pass_message = data.pass_message;

                this.logger.debug(`$SocketIO[p2p] -> ${socket.id} Event: ${mac_id} pass_message: ${pass_message}`);
                socket.broadcast.emit(mac_id, pass_message);

            });

            // Send back JSON file view
            socket.on("get_json", (data) => {

                const mac_id = data.mac_id;

                if (mac_id) {
                    this.EndpointModel.getJson(mac_id, (err, data) => {
                        socket.emit("json", data);
                    });
                } else {
                    this.logger.error(`$SocketIO[get_json] -> ${socket.id} NO MAC_ID`);
                }

            });

            // Put JSON file view in the database
            socket.on("put_json", (data) => {

                const mac_id = data.mac_id;
                const version = data.version;
                const json = data.json;
                this.logger.debug(`$SocketIO[putJson] -> ${socket.id} ${JSON.stringify(data)}`);

                this.EndpointModel.putJson(mac_id, json, version, (err, data) => {
                    socket.broadcast.emit("update_json", data);
                });

            });

            // Client disconnect
            socket.on("disconnect", () => {
                this.logger.debug(`$SocketIO[disconnect] -> ${socket.id} disconnect`);
            });

        });
    }
}

export default SocketIO;