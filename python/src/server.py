#!/usr/bin/env python

import asyncio
import threading
import http.server
import socketserver
import websockets
from websockets.asyncio.server import serve


# set открытых соединений
clients = set()

# http_server простой сервер, чтобы отдавать фронтенд
def http_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(('', 8080), handler) as httpd:
        httpd.serve_forever()

async def websocker_handler(websocket):
    # Сохраняем новое соединение
    clients.add(websocket)
    try:
        async for message in websocket:
            # Пересылаем сообщение всем клиентам
            for client in clients:
                await client.send(message)
    finally:
        # Убираем клиента из множества, когда он отключается
        clients.remove(websocket)

async def websocket_server():
    async with serve(websocker_handler, 'localhost', 8756):
        await asyncio.Future()

def main():
    # Запускаем HTTP-сервер в отдельном потоке
    http_thread = threading.Thread(target=http_server)
    http_thread.daemon = True
    http_thread.start()

    # Запускаем websocket-сервер
    asyncio.run(websocket_server())


if __name__ == "__main__":
    main()
