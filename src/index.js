const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

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

	// socket.emit('message', generateMessage('Assalamualaikum !')); // emit the event to only the sender client

	// socket.broadcast.emit('message', generateMessage('A new user has joined!')); // sending to all clients except sender

	socket.on('join', (options, callback) => {
		console.log('================ join ========================');
		console.dir({...options});
		const { error, user } = addUser({ id: socket.id, ...options });

		if(error) {
			return callback(error);
		}

		socket.join(user.room); // call join to subscribe the socket to a given channel

		socket.emit('message', generateMessage('Admin', 'Assalamualaikum !')); // emit the event to only the sender client
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)); // emit event to all clients (except sender) connected to the room
		console.log(io.sockets.adapter.rooms);
		io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
		callback();
		// io.emit -> io.to.emit, 
		// socket.broadcast.emit -> socket.broadcast.to.emit
	});
	
	socket.on('sendMessage', (message, callback) => {
		const { error , user } = getUser(socket.id);
		const filter = new Filter();

		console.log('================ sendMessage ========================');
		console.dir({...user});
		// console.log(io.sockets.adapter.rooms);

		if(error) {
			return callback(error);
		}

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed!')
		}

		// io.emit('message', generateMessage(message)); // emit the event to every client
		io.to(user.room).emit('message', generateMessage(user.username, message)); // emit the event to every client
		callback(); // sending with acknowledgement
	});

	
	socket.on('sendLocation', (coords, callback) => {
		const { error , user } = getUser(socket.id);
		console.log('================ sendLocation ========================');

		if(error) {
			return callback(error);
		}
		// io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
		io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
		callback();
	});


	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		console.log('================ disconnect ================');
		console.dir(user);

		if(user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			});
		}

	});

});

server.listen(port, () => {
    console.log(`Server is up on port ${port}! http://localhost:3000/`);
});