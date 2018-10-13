var express = require('express');
var router = express.Router();
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var ip = require("ip");


let clientsDB = [];
let clients = [{}];
let sessions = [];

app.listen(8080);

io.on('connection', function (socket) 
{
  // we send a hello to the connected client
  var clientIp = socket.request.connection.remoteAddress;
  console.log('New connection request from ' + clientIp +':'+socket.request.connection.remotePort);	
  socket.emit('hello', { message:"Hello From Server",clientID: clients.length, ip:ip.address(),clientip:clientIp});
  socket.on('helloBack', function (client) 
  {
    clientsDB.push({socket:socket,id:client.id,ip:client.ip,name:client.name});
    clients.push({id:client.id,ip:client.ip,name:client.name});
    console.log("Client# "+client.id+" Connected Successfully with IP: "+client.ip);
  });


  socket.on('connectToGame', function(data){
    let p1 = data.player1;
    let p2 = data.player2;
    p1["team"] = "x";
    p2["team"] = "o";
    let session = {id:sessions.length,player1:p1,player2:p2,t:[],x:0,o:0,xTurn:true,oTurn:false,move:-1}
    sessions.push(session);
    socket.emit('connected',{message:"Connection Successful",session:session,code:200});
  });

  socket.on('sync', function(client,session){
    console.log("Player "+client.name+" made move");
    
    if(session.xTurn == true)
    {
      session.xTurn = false;
      session.oTurn = true;
      session.t[session.move] = 0;
    }
    else
    {
      session.xTurn = true;
      session.oTurn = false;
      session.t[session.move] = 1;
    }
    socket.emit("sync",{session:session});
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
    if(obj.ip != ip)
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
