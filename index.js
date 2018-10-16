const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ip = require('ip');


app.use(express.static('public'))

let PORT = process.env.PORT || 8080;

let clients = [];
let players = [];
let sessions = [];
let playing = [];

server.listen(PORT);

app.get('/', (req, res) => res.send('Hello World!'));
console.log("Initialized Server on port: " + PORT);

io.set('origins', '*:*');

io.on('connection', function (socket) {
  var clientIp = socket.request.connection.remoteAddress;

  // Socket opened 
  //console.log('New connection request from ' + clientIp + ':' + socket.request.connection.remotePort);

  // Connect request from client
  socket.on('connectToServer', function (client) {
    let CLIENT = { id: clients.length, ip: clientIp, name: client.name, socket: socket };
    clients.push(CLIENT);
    let discoverable = [];
    // Creating a clients database
    clients.forEach(obj => {
      discoverable.push({ id: obj.id, ip: obj.ip, name: obj.name });
    });

    // Sending handshake confirmation with necessary details
    socket.emit('connected', { message: "Connected to Game Server", clientid: CLIENT.id, ip: ip.address(), clientip: CLIENT.ip, name: CLIENT.name });

    // Sending updates to all cients but connecting client
    clients.forEach(obj => {
      obj.socket.emit('update', { clients: discoverable, players: playing });
    });
    console.log("Client# " + CLIENT.id + " Connected Successfully with IP: " + CLIENT.ip);
  });


  // Client hits play against another opponent
  socket.on('startGame', function (data) {
    let p1;
    let p2;
    // we need to move our two playing clients off from the available list to the playing list
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].ip === data.client.ip) {
        p1 = clients.splice(i, 1)[0];
      }

      if (clients[i].ip === data.opponent.ip) {
        p2 = clients.splice(i, 1)[0];
      }
    }
    // messy but need it, for now
    if (!p1) {
      p1 = clients.splice(0, 1)[0];
    }
    players.push(p1);
    players.push(p2);
    // we create a new session object with the required data 
    let session = { id: sessions.length, p1: p1, p2: p2, xscore: 0, oscore: 0, turn: p1.id, grid: [-1, -1, -1, -1, -1, -1, -1, -1, -1], x: p1.id, o: p2.id };

    // client copy of the server session that we will be sending to both players
    let syncData = { id: session.id, turn: session.turn, xscore: session.xscore, oscore: session.oscore, grid: session.grid, x: session.x, o: session.o };

    // we add a duplicate copy of the active players
    playing.push({ p1: { id: p1.id, ip: p1.ip, name: p1.name }, p2: { id: p2.id, ip: p2.ip, name: p2.name }, id: session.id });

    // we create a new discoverable list for clients to see available players
    let discoverable = [];
    clients.forEach(obj => {
      discoverable.push({ id: obj.id, ip: obj.ip, name: obj.name });
    });

    // every client waiting for a game gets a new updated clients database and also a list of players currently active in a session
    clients.forEach(obj => {
      obj.socket.emit('update', { clients: discoverable, players: playing });
    });

    // we start the session for our two active players
    session.p1.socket.emit('play', { session: syncData });
    session.p2.socket.emit('play', { session: syncData });

    // we store our session into our master database
    sessions.push(session);
    console.log("Starting Game Session#: " + session.id + " with " + data.client.ip + " and " + data.opponent.ip);
  });

  // here is where we sync the game with our two connected players
  socket.on('sync', function (moveData) {
    console.log("Server Syncing for session#: " + moveData.id);
    let session;
    // First we find the game session where our client is playing
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].id === moveData.id) {
        session = sessions.splice(i, 1)[0];
        break;
      }
    }
    // we check who played and then assign the next turn
    if (moveData.client.id === session.p1.id) {
      session.turn = session.p2.id;
    }
    else {
      session.turn = session.p1.id;
    }
    // we synchronize the grid data from the client
    session.grid[moveData.move] = moveData.client.id;
    // we check for a winner
    let winner = winCheck(session.grid, -1);
    let winID = winner.winner;
    // if there is a winner we increment the score for them and then reset the game
    if (winID != -1) {
      if (winID == session.p1.id) {
        session.xscore++;
      }
      else {
        session.oscore++;
      }
      console.log("Session#: " + session.id + " Player with Client ID: " + winID + " Won");
      // we tell that the game is over and that a winner has been declared
      session.turn = -1;
      let syncData = { id: session.id, grid: session.grid, turn: -1, xscore: session.xscore, oscore: session.oscore };
      session.p1.socket.emit('syncClient', { session: syncData });
      session.p2.socket.emit('syncClient', { session: syncData });
    }
    // if there is no winner we just repackage the updated values into a new game session and send a copy to the clients and push a copy back to the master database
    else {
      let syncData = { id: session.id, grid: session.grid, turn: session.turn, xscore: session.xscore, oscore: session.oscore };
      session.p1.socket.emit('syncClient', { session: syncData });
      session.p2.socket.emit('syncClient', { session: syncData });
      console.log(moveData.client.name + " placed at " + moveData.move);
    }
    sessions.push(session);
  });

  socket.on('updates', function(){
    console.log("Client Requested Updates");
    let discoverable = [];
    clients.forEach(obj => {
      discoverable.push({ id: obj.id, ip: obj.ip, name: obj.name });
    });
    socket.emit('update', {clients:discoverable, players: playing});
  });


  socket.on('reset', function (data) {
    let session;
    sessions.forEach(obj => {
      if (obj.id === data.id) {
        let i = sessions.indexOf(obj);
        session = sessions.splice(i, 1)[0];
      }
    });
    session.turn = session.p1.id;
    session.grid = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
    let syncData = { id: session.id, grid: session.grid, turn: session.turn, xscore: session.xscore, oscore: session.oscore };
    session.p1.socket.emit('syncClient', { session: syncData });
    session.p2.socket.emit('syncClient', { session: syncData });
    sessions.push(session);
    console.log("Restarting Game Session#: " + session.id + " with " + session.p1.ip + " and " + session.p2.ip);
  });

  // Logic to handle client disconnects
  socket.on('disconnect', function () {
    let removedClient;
    let discoverable = [];
    let playingObj;

    // Iterating through players list to find out if they quit from an active session
    players.forEach(obj => {
      if (obj.socket == socket) {
        console.log("Player with Client# " + obj.id + " with IP: " + obj.ip + " Got disconnected ");
        let i = players.indexOf(obj);
        removedClient = players.splice(i, 1)[0];
      }
    });

    // if a player is removed find his session details
    if (removedClient) {
      for (let i = 0; i < playing.length; i++) {
        if (playing[i].p1.ip === removedClient.ip || playing[i].p2.ip === removedClient.ip) {
          playingObj = playing.splice(i, 1)[0];
          break;
        }
      }
    }

    // If session details found we do the appropriate updates to the database
    if (playingObj) {
      let session;
      
      // we delete the game session from our database  
      for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].p1.ip === removedClient.ip || sessions[i].p2.ip === removedClient.ip) {
          session = sessions.splice(i, 0);
        }
      }
      // we transfer the opponent to active database and send him updates
      for (let i = 0; i < players.length; i++) {
        if (players[i].ip === playingObj.p1.ip || players[i].ip === playingObj.p2.ip) {
          let client = players.splice(i, 1)[0];
          client.socket.emit('end', { xscore: session.xscore, oscore: session.oscore });
          clients.push(client);
          break;
        }
      }

      
      return;
    };


    // we do 2 things here if a player not in a game quit we just remove him and update the other clients with new databse
    // if an active player had quit then we just need to update the clients cause we did the processing above
    clients.forEach(obj => {
      if (obj.socket == socket) {
        console.log("Client# " + obj.id + " with IP: " + obj.ip + " disconnected from server");
        let i = clients.indexOf(obj);
        removedClient = clients.splice(i, 1)[0];
      }
      else {
        discoverable.push({ id: obj.id, ip: obj.ip, name: obj.name });
      }
    });

    // we just send databse updates here
    clients.forEach(client => {
      client.socket.emit('update', { clients: discoverable, players: playing });
    });
  });
});


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
  return { winner: -1, pos: null };
}

