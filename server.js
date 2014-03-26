var express = require('express')
  ,	http = require('http')
  , path = require("path")
  , socketio = require('socket.io');

var app = express();
  
var server = http.createServer(app, {log: false});
var io = socketio.listen(server);

var config = require(__dirname + '/config.json');

// routing  !
app.use(express.static(path.resolve(__dirname, 'client')));

//app.get('/', function (req, res) {
//	res.sendfile(__dirname + '/client/index.html');
//});

// usernames which are currently connected to the chat
var clients = {};

io.sockets.on('connection', function (socket) {
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		clients[username] = username;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', clients);
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global clients list
		delete clients[socket.username];
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', clients);
	});
});

server.listen(process.env.PORT || config.port, process.env.IP || config.host, function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
