/**
 * XOde Server Based TicTacToe Implementation
 * © 2018 Chiraag Bangera.
 * This file contains all the client side Networking code.
 */

var socket = io.connect({reconnection: false});
var clientData = {};
var opponentData = {};
var serverData = {};
var CLIENTS = [];
var PLAYERS = [];
var connected = false;
var sessionID;
var symbol;
var opponentSymbol;
var opponentID;
var turn;
var xScore;
var oScore;

var t = [];
var NAME;

let scope = angular.element(document.getElementById("view")).scope();

socket.on('errorOccured', function (server) {
	console.log(server.message);
	if(!scope){
		scope = angular.element(document.getElementById("view")).scope();
	}
	scope.nameError();
	scope.$apply();
});

socket.on('connected', function (server) {
	console.log(server.message);
	connected = true;
	serverData = { ip: server.ip };
	clientData = { id: server.clientid, ip: server.clientip, name: server.name };
	if(!scope){
		scope = angular.element(document.getElementById("view")).scope();
	}
	scope.showDiscovery();
	scope.$apply();
});

socket.on('update', function (server) {
	console.log(server.message);
	CLIENTS = server.clients;
	PLAYERS = server.players;
	for (let i = 0; i < CLIENTS.length; i++) {
		if (CLIENTS[i].id === clientData.id) {
			CLIENTS.splice(i, 1);
		}
	}
	scope.update();
	scope.$apply();
});

socket.on('play', function (server) {
	t = server.session.grid;
	xScore = server.session.xscore;
	oScore = server.session.oscore;
	turn = server.session.turn;
	sessionID = server.session.id;
	if (server.session.x == clientData.id) {
		symbol = "X";
		opponentSymbol = "O";
		opponentID = server.session.o;
	}
	else {
		opponentID = server.session.x;
		symbol = "O";
		opponentSymbol = "X";
	}
	scope.game();
	scope.updateUI();
	scope.$apply();
});


socket.on('syncClient', function (server) {
	console.log("Syncing");
	t = server.session.grid;
	xScore = server.session.xscore;
	oScore = server.session.oscore;
	turn = server.session.turn;
	if (turn === -1) {
		socket.emit('reset', { id: sessionID });
	}
	else if(turn === -2){
		socket.emit('reset', { id: sessionID });
	}
	scope.updateUI();
	scope.$apply();
});


socket.on('end', function (server) {
	console.log("GameOver");
	xScore = server.xscore;
	oScore = server.oscore;
	scope.displayScore();
	scope.$apply();
});



function CONNECT() {
	if (connected) {
		return;
	}
	socket.emit('connectToServer', { id: -1, name: NAME });
}

function PLAY(opponent) {
	opponentData = opponent;
	socket.emit('startGame', { client: clientData, opponent: opponent });
}

function REFRESH(){
	socket.emit('updates');
}



