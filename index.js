const http = require('http');
const { join } = require('path');
const WebSocket = require('ws').Server;
const { wsSendAll, wsCloseAll, getFile, getSession, getSchema, setSession } = require('./helper');

const { webPath, version, gpu } = require('./settings.json');
const data = require('./data')();

const api = new Map();
api.set('/settings-schema', async (req) => {
    return [await getSchema(), 200];
});
api.set('/session', async (req) => {
    let session = await getSession();
    if (req.method === 'POST') {
        const { updateType, webClientId: client, session: newSession } = JSON.parse(req.body);
        if (!newSession || !client || !updateType || !['settings', 'clientList', 'other'].includes(updateType)) return [session, 400];
        setSession(newSession, wss, client);
        return ['', 200];
    }
    return [session, 200];
});
api.set('/graphics-devices', async (req) => {
    return [[gpu], 200];
});
api.set('/audio-devices', (req) => {
    return [data.get('audio'), 200];
});
api.set('/driver/list', (req) => {
    return [data.get('drivers'), 200];
});
api.set('/driver/unregister', (req) => {
    let drivers = data.get('drivers');
    const index = drivers.findIndex((v) => v === JSON.parse(req.body));
    if (index === -1) return ['', 404];
    drivers.splice(index, 1);
    return [drivers];
});
api.set('/driver/register', () => {
    let drivers = data.get('drivers');
    const index = drivers.findIndex((v) => v === 'ALVR');
    if (index !== -1) return ['', 500];
    drivers.push('ALVR');
    return [drivers];
});
api.set('/client/add', (req) => {
    console.error(`Client used unimplemented method ${req.url}`);
    wsSendAll(wss, `${new Date().toTimeString().split(' ')[0]} [WARN] A client used unimplemented method ${req.url}! Things might not work as expected!`);
    return [`"${req.url} is not yet added!"`, 500];
});
api.set('TEMPLATE', (req) => {
    console.error(`Client used unimplemented method ${req.url}`);
    wsSendAll(wss, `${new Date().toTimeString().split(' ')[0]} [WARN] A client used unimplemented method ${req.url}! Things might not work as expected!`);
    return [`"${req.url} is not yet added!"`, 500];
});
api.set('/version', () => [version, 200]);


const server = http.createServer((req, res) => {
    req.body = '';
    req.on('data', (chunk) => {
        req.body += chunk;
    });
    req.on('end', async () => {
        try {
            let { url } = req;
            if (url === '/') url = '/index.html';
            let call = api.get(url);
            if (!call || typeof call !== 'function') {
                let [file, status] = await getFile(join(webPath, url));
                res.writeHead(status);
                if (typeof file !== 'string' && !Buffer.isBuffer(file)) file = JSON.stringify(file);
                res.end(file);
            }
            else {
                let callback = await call(req, res);
                let file, status;
                if (Array.isArray(callback)) {
                    file = callback[0];
                    status = callback[1];
                } else file = callback;
                res.writeHead(status || 200, { 'Content-Type': 'application/json' });
                if (typeof file !== 'string' && !Buffer.isBuffer(file)) file = JSON.stringify(file);
                res.end(file);
            }
        } catch (e) {
            res.writeHead(500);
            res.end(`Something went wrong!!!! ${e}`);
            console.error(e);
        }

    });
});

const wss = new WebSocket({ server, path: '/log' });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('Client sent WS message', message);
    });
    ws.send(`${new Date().toTimeString().split(' ')[0]} [INFO] ALVR Server faker has connected!`);
});

const listener = server.listen(8082, () => {
    console.log('Running on port ' + listener.address().port);
});

process.on('SIGINT', () => {
    wsCloseAll(wss);
    server.close();
});

process.on('SIGTERM', () => {
    wsCloseAll(wss);
    server.close();
});