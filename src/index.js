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

	socket.broadcast.emit('message', 'A new user has joined!'); // sending to all clients except sender

	socket.on('sendMessage', message => {
		io.emit('message', message); // emit the event to every client
	});

	socket.on('sendLocation', coords => {
		io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`);
	});

	socket.on('disconnect', () => {
		io.emit('message', 'A user has left!');
	});

});

server.listen(port, () => {
    console.log(`Server is up on port ${port}! http://localhost:3000/`);
});