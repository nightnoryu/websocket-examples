import fs from 'fs';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const server = createServer((request, response) => {
  console.log(`${request.method} ${request.url}`)

  if (request.url !== '/')
  {
    response.writeHead(404);
    response.end();
    return;
  }
  if (request.method !== 'GET')
  {
    response.writeHead(405);
    response.end();
    return;
  }

  response.writeHead(200, { 'Content-Type': 'text/html' });
  fs.readFile('index.html', (err, data) => {
    response.end(data);
  });
});

const websocketServer = new WebSocketServer({ noServer: true });
const clients = [];

websocketServer.on('connection', ws => {
  clients.push(ws);

  ws.on('message', message => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN)
      {
        client.send(message);
      }
    })
  });

  ws.on('close', () => {
    clients.splice(clients.indexOf(ws), 1);
  });
});

server.on('upgrade', (request, socket, head) => {
  websocketServer.handleUpgrade(request, socket, head, ws => {
    websocketServer.emit('connection', ws, request);
  });
});

server.listen(8080);
