import fs from 'fs';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

// Основа - простой HTTP-сервер для отдачи фронтенда
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
// Список открытых соединений
const clients = [];

websocketServer.on('connection', ws => {
  // Сохраняем новое соединение
  clients.push(ws);

  // Обработчик сообщений от клиентов
  ws.on('message', message => {
    // Пересылаем сообщение всем клиентам
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN)
      {
        client.send(message);
      }
    })
  });

  // Обработчик закрытия соединения со стороны клиента
  ws.on('close', () => {
    // Убираем клиента из списка соединений
    clients.splice(clients.indexOf(ws), 1);
  });
});

// Хэндлер, выполняющий переход соединения с http:// на ws://
server.on('upgrade', (request, socket, head) => {
  websocketServer.handleUpgrade(request, socket, head, ws => {
    websocketServer.emit('connection', ws, request);
  });
});

server.listen(8080);
