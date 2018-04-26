import { Database } from "sqlite3";
import { LoggerInstance } from "winston";

interface EndpointRetVal {
    status: boolean;
    error: boolean;
    data: string;
}

class EndpointModel {

    private database: Database;
    private logger: LoggerInstance;

    constructor(database: Database, logger: LoggerInstance) {
        this.database = database;
        this.logger = logger;
    }

    public lookUpTeam(mac_id: string, callback: (err: Error, data: EndpointRetVal) => void): void {

        this.database.serialize(() => {
            this.database.get("SELECT TEAM from ENDPOINT where MAC_ID = $MAC_ID;", {$MAC_ID: mac_id}, (err, row) => {
                if (err) this.callBack(err, {
                    status: false,
                    error: true,
                    data: err.message
                }, "lookUpTeam", callback);
                else this.callBack(undefined, {
                    status: row !== undefined,
                    error: false,
                    data: row ? row.TEAM : undefined
                }, "lookUpTeam", callback);
            });
        });
    }

    public joinTeam(mac_id: string, team: string, callback: (err: Error, data: EndpointRetVal) => void): void {

        this.database.serialize(() => {
            this.lookUpTeam(mac_id, (err, data) => {
                if (!data.data) {
                    // Team wasn't Made
                    this.database.run("INSERT INTO FILE_SYSTEM(TEAM) VALUES (?);", [team], (err) => {
                        if (err) this.callBack(err, {
                            status: false,
                            error: true,
                            data: err.message
                        }, "joinTeam", callback);
                    });
                }

                // Put in Team
                this.database.run("INSERT INTO ENDPOINT(MAC_ID, TEAM) VALUES (?,?);", [mac_id, team], (error) => {
                    if (err) this.callBack(err, {
                        status: false,
                        error: true,
                        data: err.message
                    }, "joinTeam", callback);
                    this.callBack(undefined, {
                        status: true,
                        error: false,
                        data: team
                    }, "joinTeam", callback);
                });
            });
        });
    }

    public getJson(mac_id: string, callback: (err: Error, data: EndpointRetVal) => void): void {
        this.database.serialize(() => {
            this.database.get("select JSON from FILE_SYSTEM where TEAM = (select TEAM from ENDPOINT where MAC_ID = $MAC_ID);", {
                $MAC_ID: mac_id
            }, (err, row) => {
                if (err) this.callBack(err, {
                    status: false,
                    error: true,
                    data: err.message
                }, "getJson", callback);
                this.callBack(undefined, {
                    status: row !== undefined,
                    error: false,
                    data: row ? JSON.parse(row.JSON) : undefined
                }, "getJson", callback);
            });
        });
    }

    public putJson(mac_id: string, json: string, version: number, callback: (err: Error, data: EndpointRetVal) => void): void {

        this.database.serialize(() => {
            this.database.run("UPDATE FILE_SYSTEM Set JSON = $JSON, VERSION = $VERSION Where TEAM = (select TEAM FROM ENDPOINT where MAC_ID = $MAC_ID);", {
                $JSON: JSON.stringify(json),
                $VERSION: version,
                $MAC_ID: mac_id
            }, (err) => {
                if (err) this.callBack(err, {status: false, error: true, data: err.message}, "putJson", callback);
                else this.callBack(err, {status: true, error: false, data: json}, "putJson", callback);

            });
        });
    }

    private callBack(err: Error, data: EndpointRetVal, fnCall: string, callback: (err: Error, data: EndpointRetVal) => void): void {
        if (data.error) this.logger.error(`EndpointModel[${fnCall}] -> ${JSON.stringify(data)}`);
        else this.logger.debug(`EndpointModel[${fnCall}] -> ${JSON.stringify(data)}`);

        callback(err, data);
    }
}

export { EndpointModel, EndpointRetVal };