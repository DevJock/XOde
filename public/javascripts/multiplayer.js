var socket = io.connect();
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

let scope;


function CONNECT() {
	if (connected) {
		return;
	}
	socket.emit('connectToServer', { id: -1, name: NAME });
}

socket.on('connected', function (server) {
	connected = true;
	serverData = { ip: server.ip };
	clientData = { id: server.clientid, ip: server.clientip, name: server.name };
});

socket.on('update', function (server) {
	console.log("Updating Player Lists");
	CLIENTS = server.clients;
	PLAYERS = [];
	for (let i = 0; i < server.players.length; i++) {
		PLAYERS.push(server.players[i].p1);
		PLAYERS.push(server.players[i].p2);
	}
	for (let i = 0; i < CLIENTS.length; i++) {
		if (CLIENTS[i].ip === clientData.ip) {
			CLIENTS.splice(i, 1);
		}
	}
	scope = angular.element(document.getElementById("view")).scope();
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
	scope.$apply();
});


socket.on('syncClient', function (server) {
	console.log("Syncing");
	t = server.session.grid;
	xScore = server.session.xscore;
	oScore = server.session.oscore;
	turn = server.session.turn;
	if (turn == -1) {
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

function PLAY(opponent) {
	opponentData = opponent;
	socket.emit('startGame', { client: clientData, opponent: opponentData });
}

function REFRESH(){
	socket.emit('updates');
}



