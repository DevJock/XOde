const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ip = require('ip');


app.use(express.static('public'))

let PORT = process.env.PORT || 80;

let clients = [];
let sessions = [];


server.listen(PORT);

app.get('/', (req, res) => res.send('Hello World!'));
console.log("Initialized Server on port: " + PORT);

io.set('origins', '*:*');

io.on('connection', function (socket) {
  var clientIp = socket.request.connection.remoteAddress;
  console.log('New connection request from ' + clientIp + ':' + socket.request.connection.remotePort);
  socket.on('connectToServer', function (client) {
    let updateCLIENT = { id: clients.length, ip: clientIp, name: client.name };
    let CLIENT = { id: clients.length, ip: clientIp, name: client.name, socket: socket };
    clients.push(CLIENT);
    let discoverable = [];
    clients.forEach(obj => {
      if (obj != CLIENT) {
        discoverable.push({ id: obj.id, ip: obj.ip, name: obj.name });
        obj.socket.emit('clientAdded', { client: updateCLIENT });
      }
    });
    socket.emit('connected', { message: "Connected to Game Server", clientid: CLIENT.id, ip: ip.address(), clientip: CLIENT.ip, name: CLIENT.name, clients: discoverable });
    console.log("Client# " + CLIENT.id + " Connected Successfully with IP: " + CLIENT.ip);
  });

  socket.on('startGame', function (data) {
    let p1;
    let p2;
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].ip == data.client.ip) {
        p1 = clients[i];
      }

      if (clients[i].ip == data.opponent.ip) {
        p2 = clients[i];
      }
    }
    let session = { id: sessions.length, p1: p1, p2: p2, xscore: 0, oscore: 0, turn: data.client.id, grid: [-1, -1, -1, -1, -1, -1, -1, -1, -1], x: data.client.id, o: data.opponent.id };
    let syncData = { id: session.id, turn: session.turn, xscore: session.xscore, oscore: session.oscore, grid: session.grid, x: session.p1.id, o: session.p2.id };
    sessions.push(session);
    clients.forEach(obj => {
      if (obj.ip == data.opponent.ip) {
        obj.socket.emit('play', { session: syncData });
      }
    });
    socket.emit('play', { session: syncData });
    console.log("Starting Game Session#: " + session.id + " with " + data.client.ip + " and " + data.opponent.ip);
  });

  socket.on('sync', function (moveData) {
    console.log("Server Syncing for session#: " + moveData.id);
    let session;
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].id == moveData.id) {
        session = sessions.splice(i, 1)[0];
        break;
      }
    }



    if (moveData.client.id == session.p1.id) {
      session.turn = session.p2.id;
    }
    else {
      session.turn = session.p1.id;
    }
    session.grid[moveData.move] = moveData.client.id;
    let syncData = { id: session.id, grid: session.grid, turn: session.turn, xscore: session.xscore++, oscore: 0 };
    sessions.push(session);
    session.p1.socket.emit('syncClient', { session: syncData });
    session.p2.socket.emit('syncClient', { session: syncData });
    console.log(moveData.client.name + " placed at " + moveData.move);
  });

  socket.on('disconnect', function () {
    let removedClient;
    clients.forEach(obj => {
      if (obj.socket == socket) {
        console.log("Client# " + obj.id + " with IP: " + obj.ip + " Got disconnected ");
        let i = clients.indexOf(obj);
        removedClient = clients.splice(i, 1)[0];
        for (let i = 0; i < sessions.length; i++) {
          if (sessions[i].p1.ip == removedClient.ip) {
            sessions[i].p2.socket.emit('end', { xscore: sessions[i].xscore, oscore: sessions[i].oscore });
            sessions.splice(i, 1)[0];
            break;
          }

          if (sessions[i].p2.ip == removedClient.ip) {
            sessions[i].p1.socket.emit('end', { xscore: sessions[i].xscore, oscore: sessions[i].oscore });
            sessions.splice(i, 1)[0];
            break;
          }
        }
      }
      else {
        obj.socket.emit('clientRemoved', { client: removedClient });
      }
    });

  });
});
