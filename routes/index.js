var express = require('express');
var router = express.Router();
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var ip = require("ip");


let clientsDB = [];
let clients = [];
let sessions = [];
let t = [-1, -1, -1, -1, -1, -1, -1, -1, -1];


app.listen(5000);

io.set('origins', '*:*');


io.on('connection', function (socket) {
  var clientIp = socket.request.connection.remoteAddress;
  console.log('New connection request from ' + clientIp + ':' + socket.request.connection.remotePort);
  socket.on('connectToServer', function (client) {
    clientsDB.push({ socket: socket, id: clientsDB.length, ip: clientIp, name: client.name });
    clientsDB.forEach(obj => {
      //if (obj.ip != client.clientip) 
      {
        clients.push({ id: obj.id, ip: obj.ip, name: obj.name});
      }
    });
    socket.emit('connected', { message: "Connected to Game Server", clientid: clientsDB.length - 1, ip: ip.address(), clientip: clientIp, clients: clients });
    console.log("Client# " + clients.length - 1 + " Connected Successfully with IP: " + clientIp);
  });

  socket.on('startGame', function (client) {
    sessions.push({ id: sessions.length, p1: client.client, p2: client.opponent, xscore: 0, oscore: 0, turn: client.client.id, grid: t });
    socket.emit('play', { session: sessions[sessions.length - 1] });
    console.log("Starting Game with " + client.client.id + " and " + client.opponent.id);
  });

  socket.on('disconnect', function () {
    clientsDB.forEach(obj => {
      if (obj.socket == socket) {
        console.log("Client# " + obj.id + " with IP: " + obj.ip + " Got disconnected ");
        let i = clientsDB.indexOf(obj);
        clientsDB.splice(i, 1);
        clients.splice(i, 1);
      }
    });
  });
});





function handler(req, res) {
  fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    });
}
module.exports = router;
