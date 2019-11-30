const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

/**
 * callback function calls each time a client connects to the server
 * 
 * params: socket: contains information about each connection or client
 */
io.on('connection', (socket) => {
	console.log('New WebSocket connection');

	socket.emit('message', 'Assalamualaikum !'); // emit the event to only the sender client

	socket.on('sendMessage', message => {
		io.emit('message', message); // emit the event to every client
	});

});

server.listen(port, () => {
    console.log(`Server is up on port ${port}! http://localhost:3000/`);
});