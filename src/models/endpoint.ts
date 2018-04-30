import { Database } from "sqlite3";
import { LoggerInstance } from "winston";

// Json that all Endpoint must return
// status: if the op actually happend or not
// error: if an error happen or not
// data: value of the call
interface EndpointRetVal {
    status: boolean;
    error: boolean;
    data: string;
}

// Model of the Endpoint(Clients) and what operations can be done
class EndpointModel {

    private database: Database;
    private logger: LoggerInstance;

    constructor(database: Database, logger: LoggerInstance) {
        this.database = database;
        this.logger = logger;
    }

    /**
     * Return result
     *  team - if client is in a team
     *  undefined - if client isn't in team
     *
     * @param {string} mac_id - mac_address of client
     * @param {(err: Error, data: EndpointRetVal) => void} callback - callback to deal with results
     */
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

    /**
     * Allows a Client to Join a Team
     *
     * @param {string} mac_id - Client mac Address
     * @param {string} team - Team that Client wants to join
     * @param {(err: Error, data: EndpointRetVal) => void} callback - call back to deal with data
     */
    public joinTeam(mac_id: string, team: string, callback: (err: Error, data: EndpointRetVal) => void): void {

        this.database.serialize(() => {
            this.lookUpTeam(mac_id, (err, data) => {
                if (!data.data) {
                    // Team wasn't Made
                    this.database.get("SELECT TEAM FROM FILE_SYSTEM WHERE TEAM = $TEAM", {$TEAM: team}, (err, row) => {
                        if (err) this.callBack(err, {
                            status: false,
                            error: true,
                            data: err.message
                        }, "joinTeam", callback);
                        else {
                            if (!row) {
                                this.database.run("INSERT INTO FILE_SYSTEM(TEAM) VALUES (?);", [team], (err) => {
                                    if (err) {
                                        if (err) this.callBack(err, {
                                            status: false,
                                            error: true,
                                            data: err.message
                                        }, "joinTeam", callback);
                                    } else {
                                        // Put in Team
                                        this.database.run("INSERT INTO ENDPOINT(MAC_ID, TEAM) VALUES (?,?);", [mac_id, team], (err) => {
                                            if (err) {
                                                if (err) this.callBack(err, {
                                                    status: false,
                                                    error: true,
                                                    data: err.message
                                                }, "joinTeam", callback);
                                            } else {
                                                this.callBack(undefined, {
                                                    status: true,
                                                    error: false,
                                                    data: team
                                                }, "joinTeam", callback);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    }

    /**
     *  Return the Json of the Team the Client is in
     *
     * @param {string} mac_id - mac address of Client
     * @param {(err: Error, data: EndpointRetVal) => void} callback
     */
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
                else {
                    this.callBack(undefined, {
                        status: row !== undefined,
                        error: false,
                        data: row ? JSON.parse(row.JSON) : undefined
                    }, "getJson", callback);
                }
            });
        });
    }

    /**
     * Put updated Json in the DB for the Client Team
     *
     * @param {string} mac_id - mac adress of client
     * @param {string} json - json to put in database
     * @param {number} version - version of the json
     * @param {(err: Error, data: EndpointRetVal) => void} callback
     */
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

    /**
     *
     * @param {Error} err
     * @param {EndpointRetVal} data
     * @param {string} fnCall
     * @param {(err: Error, data: EndpointRetVal) => void} callback
     */
    private callBack(err: Error, data: EndpointRetVal, fnCall: string, callback: (err: Error, data: EndpointRetVal) => void): void {
        if (data.error) this.logger.error(`EndpointModel[${fnCall}] -> ${JSON.stringify(data)}`);
        else this.logger.debug(`EndpointModel[${fnCall}] -> ${JSON.stringify(data)}`);

        callback(err, data);
    }
}

export { EndpointModel, EndpointRetVal };