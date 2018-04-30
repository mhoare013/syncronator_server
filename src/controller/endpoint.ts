import * as express from "express";
import { Database } from "sqlite3";
import { LoggerInstance } from "winston";
import { EndpointModel, EndpointRetVal } from "../models/index";

interface EndpointApiResponse {
    status: boolean;
    message: string;
}

class EndpointApi {
    private endpoint_api_router = express.Router();
    private readonly database: Database;
    private readonly logger;
    private EndpointModel: EndpointModel;

    constructor(database: Database, logger: LoggerInstance) {
        this.database = database;
        this.logger = logger;
        this.EndpointModel = new EndpointModel(this.database, this.logger);
        this.setupRouter();
    }

    t;

    public getRouter(): express.Router {
        return this.endpoint_api_router;
    }

    private sendEndpointData(res: express.Response, data: EndpointRetVal): void {
        res.setHeader("Content-Type", "application/json");
        res.status(data.error ? 500 : 200).json({
            status: data.status,
            message: data.data || "undefined"
        });
    }

    private sendApiRespone(res: express.Response, status: number, data: EndpointApiResponse): void {
        res.setHeader("Content-Type", "application/json");
        res.status(status).json(data);
    }

    private setupRouter(): void {
        this.endpoint_api_router.post("/joinTeam", (req, res) => {

            const mac_id = req.body.mac_id;
            const team = req.body.team;

            if (mac_id && team) {
                this.EndpointModel.joinTeam(mac_id, team, (error, data) => {
                    this.sendEndpointData(res, data);
                });
            } else {
                this.sendApiRespone(res, 400, {status: false, message: "mac_id OR team is undefined"});
            }
        });

        this.endpoint_api_router.post("/lookupTeam", (req, res) => {

            const mac_id = req.body.mac_id;

            if (mac_id) {
                this.EndpointModel.lookUpTeam(mac_id, ((err, data) => {
                    this.sendEndpointData(res, data);
                }));
            } else {
                this.sendApiRespone(res, 400, {status: false, message: "No mac_id"});
            }
        });


        this.endpoint_api_router.post("/json", (req, res) => {

            this.EndpointModel.getJson("a", (err, data) => {
                this.sendEndpointData(res, data);
            });

        });

    }

}

export default EndpointApi;

