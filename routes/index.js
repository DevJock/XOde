var express = require('express');
var router = express.Router();
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var ip = require("ip");


let clientsDB = [];
let clients = [];
let sessions = [];
let t = [-1,-1,-1,-1,-1,-1,-1,-1,-1];


app.listen(5000);

io.set('origins', '*:*');


io.on('connection', function (socket) 
{
  var clientIp = socket.request.connection.remoteAddress;
  console.log('New connection request from ' + clientIp +':'+socket.request.connection.remotePort);	
  socket.on('connectToServer', function (client) 
  {
    clientsDB.push({socket:socket,id:clients.length,ip:clientIp,name:client.name});
    clients.push({id:clients.length,ip:clientIp,name:client.name});
    socket.emit('connected', { message:"Connected to Game Server",clientid: clients.length, ip:ip.address(),clientip:clientIp,clients:clients});
    console.log("Client# "+clients.length+" Connected Successfully with IP: "+clientIp);
  });

  socket.on('startGame', function(client){
    sessions.push({id:sessions.length,p1:client.client,p2:client.opponent,xscore:0,oscore:0,turn:client.client.id,grid:t});
    socket.emit('play', {session:sessions[sessions.length - 1]});
    console.log("Starting Game with "+client.client.id+" and "+client.opponent.id);
  });

  socket.on('disconnect', function() {
    clientsDB.forEach(obj => {
      if(obj.socket == socket)
      {
        console.log("Client# "+obj.id+" with IP: "+obj.ip+" Got disconnected ");
        let i = clientsDB.indexOf(obj);
        clientsDB.splice(i,1);
        clients.splice(i,1);
      }
    });
 });
});



router.post('/clients', function(req,res) {
  let ip = req.body.ip;
  let discoverDB = [];
  clients.forEach(obj => {
  //  if(obj.ip != ip)
    {
      discoverDB.push(obj);
    }
  });
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(discoverDB));
});



function handler (req, res) {
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
