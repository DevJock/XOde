/**
 * XOde Server Based TicTacToe Implementation
 * © 2018 Chiraag Bangera.
 * This file contains all the Server side Networking code and also contains the main server side logic for the game.
*/
const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const serverIP = require('ip');

// we are defining the port for our server to listen on
let PORT = process.env.PORT || 8080;

app.use(express.static('public'))
// A fix for the CORS Policy
io.set('origins', '*:*');

console.log("Initialized Server on port: " + PORT);

server.listen(PORT);

// this array stores all socket information pk: id
let sockets = [];
// this array stores all the connected client information pk: id
let clients = [];
// this array stores all the players information pk: id
let players = [];
// this array stores all the game sessions pk:id fk: client.id
let sessions = [];


//incomming connection from a client
io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;
    // a new Socket connection is opened 
    console.log('Connection request from ' + clientIp + ':' + socket.request.connection.remotePort);

    // Connect request from client
    socket.on('connectToServer', function (obj) {
        let client = { id: clients.length, ip: clientIp, name: obj.name };
        // username validation
        if (!validateNAME(client.name)) {
            sendError("Username is Invalid. Try again.")
            return;
        }
        clients.push(client);
        sockets.push({ id: sockets.length, socket: socket, clientID: client.id });
        // Sending handshake confirmation with necessary details
        socket.emit('connected', { message: "Connected to Game Server", clientid: client.id, ip: serverIP.address(), clientip: client.ip, name: client.name });
        // Sending updates to all cients but connecting client
        updateClients();
        console.log("Client# " + client.id + " Connected Successfully with IP: " + client.ip);
    });

    // when the client specifically requests for updates
    socket.on('updates', function () {
        console.log("Specific Request from Client for Updates");
        socket.emit('update', { message: "Client list update from Game Server", clients: clients, players: players });
    });


    // Client hits play against another opponent
    socket.on('startGame', function (data) {
        let p1;
        let p2;
        let p1Socket;
        let p2Socket;
        // we need to move our two playing clients off from the available list to the playing list ie. clients array to players array
        p1 = clientObjForID(data.client.id, true);
        p2 = clientObjForID(data.opponent.id, true);

        players.push(p1);
        players.push(p2);

        p1Socket = socketObjForClientWithID(p1.id).socket;
        p2Socket = socketObjForClientWithID(p2.id).socket;
        // we create a new session object with the required data 
        let session = { id: sessions.length, p1: p1, p2: p2, xscore: 0, oscore: 0, turn: p1.id, grid: [-1, -1, -1, -1, -1, -1, -1, -1, -1], x: p1.id, o: p2.id, p1Socket: p1Socket, p2Socket: p2Socket };

        // client copy of the server session that we will be sending to both players
        let syncData = { id: session.id, turn: session.turn, xscore: session.xscore, oscore: session.oscore, grid: session.grid, x: session.x, o: session.o };

        // every client waiting for a game gets a new updated clients database and also a list of players currently active in a session
        updateClients();

        // we start the session for our two active players
        p1Socket.emit('play', { session: syncData });
        p2Socket.emit('play', { session: syncData });
        // we store our session into our master database
        sessions.push(session);
        console.log("Starting Game Session#: " + session.id + " with " + session.p1.id + " and " + session.p2.id);
    });


    // here is where we sync the game with our two connected players
    socket.on('sync', function (moveData) {
        console.log("Server Syncing for session#: " + moveData.id);
        let session;
        // First we find the game session where our client is playing
        session = sessionObjForID(moveData.id, true);
        // we check who played and then assign the next turn
        if (moveData.client.id === session.p1.id) {
            session.turn = session.p2.id;
        }
        else if (moveData.client.id === session.p2.id) {
            session.turn = session.p1.id;
        }
        else {
            sendError("Unauthorized Move Performed");
            return;
        }
        // we synchronize the grid data from the client
        session.grid[moveData.move] = moveData.client.id;
        // we check for a winner
        let winner = winCheck(session.grid, -1);
        let winID = winner.winner;
        // if there is a winner we increment the score for them and then reset the game
        if (winID != -1 && winID != -2) {
            if (winID == session.p1.id) {
                session.xscore++;
            }
            else {
                session.oscore++;
            }
            console.log("Session#: " + session.id + " Player with Client ID: " + winID + " Won");
            // we tell that the game is over and that a winner has been declared
            session.turn = -1;
        }
        // if there is no winner we just repackage the updated values into a new game session and send a copy to the clients and push a copy back to the master database
        else {
            // Handle Ties
            if (winID === -2) {
                session.turn = -2;
                console.log("Handling Tie for session#: " + moveData.id);
            }
        }
        let syncData = { id: session.id, grid: session.grid, turn: session.turn, xscore: session.xscore, oscore: session.oscore };
        session.p1Socket.emit('syncClient', { session: syncData });
        session.p2Socket.emit('syncClient', { session: syncData });
        sessions.push(session);
    });

    // here is where we handle server reset
    socket.on('reset', function (data) {
        let session;
        // we search and get the session from our master db
        session = sessionObjForID(data.id, true);
        // we reset the game for this session
        session.turn = session.p1.id;
        session.grid = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
        let syncData = { id: session.id, grid: session.grid, turn: session.turn, xscore: session.xscore, oscore: session.oscore };
        session.p1Socket.emit('syncClient', { session: syncData });
        session.p2Socket.emit('syncClient', { session: syncData });
        sessions.push(session);
        console.log("Restarting Game Session#: " + session.id + " with " + session.p1.id + " and " + session.p2.id);
    });


    // Logic to handle client disconnects
    socket.on('disconnect', function () {
        let removedClient;
        let disconnectedSocket;
        let session;

        // get socket details
        disconnectedSocket = socketObjForSocket(socket, true);

        // finding out if they quit from an active session
        removedClient = playerObjForID(disconnectedSocket.clientID, true);

        // if a player is removed find his session details
        if (removedClient) {
            console.log("Player with Client# " + removedClient.id + " with IP: " + removedClient.ip + " Got disconnected ");
            session = sessionObjForClientWithID(removedClient.id, true);
        }

        // If session details found we do the appropriate updates to the database
        if (session) {
            // we transfer the opponent to active database and send him updates
            let client = playerObjForID(removedClient.id === session.p1.id ? session.p2.id: session.p1.id, true);
            clients.push(client);
            socketObjForClientWithID(client.id).socket.emit('end', { xscore: session.xscore, oscore: session.oscore });
            updateClients();
            return;
        };

        // we do 2 things here if a player not in a game quit we just remove him and update the other clients with new databse
        // if an active player had quit then we just need to update the clients cause we did the processing above
        removedClient = clientObjForID(disconnectedSocket.clientID, true);
        console.log("Client# " + removedClient.id + " with IP: " + removedClient.ip + " disconnected from server");
        updateClients();
    });


    function sendError(message) {
        console.log("Sending error Message");
       // socket.emit('error', { message: message });
    }

});

function updateClients() {
    clientBroadcast('update', { message: "Client list update from Game Server", clients: clients, players: players });
}

function clientBroadcast(trigger, obj) {
    console.log("Client Broadcasting");
    clients.forEach(client => {
        socketObjForClientWithID(client.id).socket.emit(trigger, obj);
    })
}

function clientObjForID(id, splice = false) {
    let client;
    clients.forEach(obj => {
        if (obj.id === id) {
            if (splice) {
                client = clients.splice(clients.indexOf(obj), 1)[0];
            }
            client = obj;
        }
    });
    return client;
}

function playerObjForID(id, splice = false) {
    let player;
    players.forEach(obj => {
        if (obj.id === id) {
            if (splice) {
                player = players.splice(players.indexOf(obj), 1)[0];
            }
            player = obj;
        }
    });
    return player;
}

function sessionObjForID(id, splice = false) {
    let session;
    sessions.forEach(obj => {
        if (obj.id === id) {
            if (splice) {
                session = sessions.splice(sessions.indexOf(obj), 1)[0];
            }
            session = obj;
        }
    });
    return session;
}

function sessionObjForClientWithID(id, splice = false) {
    let session;
    sessions.forEach(obj => {
        if (obj.p1.id === id || obj.p2.id === id) {
            if (splice) {
                session = sessions.splice(sessions.indexOf(obj), 1)[0];
            }
            session = obj;
        }
    });
    return session;
}


function socketObjForClientWithID(id, splice = false) {
    let socketObj;
    sockets.forEach(obj => {
        if (obj.clientID === id) {
            if (splice) {
                socketObj = sockets.splice(sockets.indexOf(obj), 1)[0];
            }
            socketObj = obj;
        }
    });
    return socketObj;
}

function socketObjForSocket(socket, splice = false) {
    let socketObj;
    sockets.forEach(obj => {
        if (obj.socket === socket) {
            if (splice) {
                socketObj = sockets.splice(sockets.indexOf(obj), 1)[0];
            }
            socketObj = obj;
        }
    });
    return socketObj;
}



function validateNAME(str) {
    if(str == undefined){
        return false;
    }
    str = str.trim();
    var usernameRegex = /^[\wa-zA-Z]{3,12}$/;
    if (str.match(usernameRegex)) {
        return true;
    }
    return false;
}

function winCheck(data, empty) {
    if (data[0] === data[1] && data[0] === data[2] && data[0] != empty) {
        return { pos: [0, 1, 2], winner: data[0] };
    }

    else if (data[3] === data[4] && data[3] === data[5] && data[3] != empty) {
        return { pos: [3, 4, 5], winner: data[3] };
    }

    else if (data[6] === data[7] && data[6] === data[8] && data[6] != empty) {
        return { pos: [6, 7, 8], winner: data[6] };
    }
    else if (data[0] === data[3] && data[0] === data[6] && data[0] != empty) {
        return { pos: [0, 3, 6], winner: data[0] };
    }

    else if (data[1] === data[4] && data[1] === data[7] && data[1] != empty) {
        return { pos: [1, 4, 7], winner: data[1] };
    }

    else if (data[2] == data[5] && data[2] == data[8] && data[2] != empty) {
        return { pos: [2, 5, 8], winner: data[2] };
    }

    else if (data[0] == data[4] && data[0] == data[8] && data[0] != empty) {
        return { pos: [0, 4, 8], winner: data[0] };
    }

    else if (data[2] == data[4] && data[2] == data[6] && data[2] != empty) {
        return { pos: [2, 4, 6], winner: data[2] };
    }


    for (let i = 0; i < data.length; i++) {
        if (data[i] === empty) {
            return { winner: -1, pos: null };
        }
    }
    return { winner: -2, pos: null }
}
