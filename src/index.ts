// App import
import Syncronator from "./app";

// Other js imports
const normalizePort = require("normalize-port");

// Get Ports
const EXPRESS_PORT = normalizePort(process.env.EXPRESS_PORT || 7070);
const SOCKET_PORT = normalizePort(process.env.SOCKET_PORT || 3000);

// Make New App
const Syncronator_Server = new Syncronator(EXPRESS_PORT, SOCKET_PORT);

// Start the Server
Syncronator_Server.startServer();