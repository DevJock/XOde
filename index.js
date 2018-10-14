const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ip = require('ip');


app.use(express.static('public'))

let PORT = 3000;

let clients = [];
let sessions = [];
let t = [-1, -1, -1, -1, -1, -1, -1, -1, -1];


server.listen(PORT);

app.get('/', (req, res) => res.send('Hello World!'));
console.log("Initialized Server on port: "+PORT);

io.set('origins', '*:*');

io.on('connection', function (socket) {
  var clientIp = socket.request.connection.remoteAddress;
  console.log('New connection request from ' + clientIp + ':' + socket.request.connection.remotePort);
  socket.on('connectToServer', function (client) {
    let CLIENT = { socket: socket, id: clients.length, ip: clientIp, name: client.name };
    clients.push(CLIENT);
    let discoverable = [];
    clients.forEach(obj => {
      if (obj != CLIENT) 
      {
        discoverable.push({ id: obj.id, ip: obj.ip, name: obj.name});
      }
    });
    socket.emit('connected', { message: "Connected to Game Server", clientid: CLIENT.id, ip: ip.address(), clientip: CLIENT.ip, clients: discoverable });
    console.log("Client# " + CLIENT.id + " Connected Successfully with IP: " + CLIENT.ip);
  });

  socket.on('startGame', function (client) {
    sessions.push({ id: sessions.length, p1: client.client, p2: client.opponent, xscore: 0, oscore: 0, turn: client.client.id, grid: t });
    socket.emit('play', { session: sessions[sessions.length - 1] });
    console.log("Starting Game with " + client.client.id + " and " + client.opponent.id);
  });

  socket.on('disconnect', function () {
    clients.forEach(obj => {
      if (obj.socket == socket) {
        console.log("Client# " + obj.id + " with IP: " + obj.ip + " Got disconnected ");
        let i = clients.indexOf(obj);
        clients.splice(i, 1);
      }
    });
  });
});
