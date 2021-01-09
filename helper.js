const WebSocket = require('ws');
const fs = require('fs').promises;

module.exports.wsSendAll = (wss, data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

module.exports.wsCloseAll = (wss) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(`${new Date().toTimeString().split(' ')[0]} [INFO] ALVR Server faker is shutting down!`, {}, () => client.close());
        }
    });
};

module.exports.getFile = async (path) => {
    let status = 200;
    let file = '';
    try {
        file = await fs.readFile(path);
    } catch (e) {
        file = `Error: Loading File\n ${e}`;
        status = 404;
    }
    return [file, status];
};

let session;
module.exports.getSession = async () => {
    if (!session) session = JSON.parse((await fs.readFile('./session_default.json')).toString());
    return session;
};

module.exports.setSession = (newSession, wss, client) => {
    if (newSession.statusText) return session; // The client likes overwriting it with the http status idk why
    session = newSession; 
    this.wsSendAll(wss, `${new Date().toTimeString().split(' ')[0]} [INFO] #${JSON.stringify({ id: 'sessionUpdated', data: { webClientId: client, updateid: 'settings' } })}#`);
    return session;
};

module.exports.getSchema = async () => { 
    return (await fs.readFile('./schema_default.json')).toString();
};