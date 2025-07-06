package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// WebsocketServer хранит мапу открытых соединений и upgrader для перехода с протокола http:// на ws://
type WebsocketServer struct {
	upgrader websocket.Upgrader
	clients  map[*websocket.Conn]bool
}

// Handler основной WebSocket-хэндлер
func (s *WebsocketServer) Handler(w http.ResponseWriter, r *http.Request) {
	// Апгрейд протокола с http:// на ws://
	connection, _ := s.upgrader.Upgrade(w, r, nil)
	defer connection.Close()

	// Сохраняем новое соединение. Выполняем defer, чтобы подчистить соединение из мапы, когда клиент его оборвёт.
	s.clients[connection] = true
	defer delete(s.clients, connection)

	// В бесконечном цикле считываем сообщения до сигнала о завершении соединения
	for {
		mt, message, err := connection.ReadMessage()
		if err != nil || mt == websocket.CloseMessage {
			break
		}
		// Пересылаем сообщение всем клиентам
		// Используем запуск в горутине, чтобы не останавливать поток обработки
		go s.handleMessage(message)
	}
}

// handleMessage пересылает сообщение всем открытым соединениям сервера
func (s *WebsocketServer) handleMessage(message []byte) {
	for conn := range s.clients {
		conn.WriteMessage(websocket.TextMessage, message)
	}
}

// serveIndex отдаёт главную страницу для фронтенда чата
func serveIndex(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "index.html")
}

func main() {
	websocketServer := WebsocketServer{
		upgrader: websocket.Upgrader{},
		clients:  make(map[*websocket.Conn]bool),
	}

	// Настраиваем эндпоинты для главной страницы и для websocket-сервера
	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/ws", websocketServer.Handler)

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
