let socket = io.connect('http://127.0.0.1:5000');
let clientData = {};
let serverData = {};

let session = {};

let Width = window.innerWidth;
let Height = window.innerHeight;

let gridSize = 100;
let lineThickness = 5;


let xStart = Width/2 - gridSize*3;
let xEnd = Width/2 + gridSize*3;
let yStart = Height/2 - gridSize*3;
let yEnd = Height/2 + gridSize*3;
let x1 = Width/2 - gridSize;
let x2 = Width/2 + gridSize;
let y1 = Height/2 - gridSize;
let y2 = Height/2 + gridSize;


let turn;
let xScore;
let oScore;

let t = [];

let me;

var gameCanvas;

socket.on('hello', function (server) 
{
  serverData = {ip:server.ip};
  clientData = {id:server.clientID,name:"Someone",ip:server.clientip};
  socket.emit('helloBack',{id:clientData.id, message:"Hello from Client",ip:clientData.ip,name:"Someone"})
});

socket.on('connected', function(response){
  console.log(response.message);
  if(response.code == 200)
  {
	  gameCanvas.show();
  }
  session = response.session;
  t = session.t;
  turn = session.turn;
  xScore = session.xScore;
  oScore = session.oScore;
});

socket.on('sync', function(session){
	session = session;
	t = session.t;
	turn = session.turn;
	xScore = session.xScore;
	oScore = session.oScore;
});

function CONNECT(p1,p2)
{
	socket.emit('connectToGame',{player1:p1,player2:p2});
}


function setup() {
	gameCanvas = createCanvas(Width, Height);
	gameCanvas.hide();
	textAlign(CENTER, CENTER);
	ellipseMode(CENTER);
	rectMode(CENTER);
	angleMode(DEGREES);
	frameRate(60);
}

function draw() {
	background(0);
	drawFrame();
}


function mouseClicked()
{
	let x = mouseX;
	let y = mouseY;
	let pos = processClick(x,y);
	if(pos == null)
	{
		return;
	}
	if(session.xTurn == me)
	{
		session.move = pos.val - 1;
		socket.emit('sync',session);
	}
}

function placePiece2(sym,x,y)
{
	fill(255);
	textSize(200);
	text(sym,x,y);
}

function placePiece(sym,ind)
{
	let data = processIndex(ind);
	fill(255);
	textSize(120);
	text(sym,data.x,data.y);
}

function drawFrame()
{
	fill(255);
	strokeWeight(5);
	stroke(255);
	line(x1,yStart,x1,yEnd);
	line(x2,yStart,x2,yEnd);
	line(xStart,y1,xEnd,y1);
	line(xStart,y2,xEnd,y2);

	for(let i=0;i<t.length;i++)
	{
		if(t[i] == 0)
		{
			placePiece("X",i);
		}
		else if(t[i] == 1)
		{
			placePiece("O",i);
		}
	}
}


function processClick(x,y)
{
	if(x >= xStart && x < x1 && y >= yStart && y < y1)
	{
		return {x:(xStart + x1)/2,y:(yStart+y1)/2,val:1};
	}
	else if(x >= x1 && x < x2 && y >= yStart && y < y1)
	{
		return {x:(x1 + x2)/2,y:(yStart+y1)/2,val:2};
	}
	else if(x >= x2 && x < xEnd && y >= yStart && y < y1)
	{
		return {x:(x2 + xEnd)/2,y:(yStart+y1)/2,val:3};
	}
	else if(x >= xStart && x < x1 && y >= y1 && y < y2)
	{
		return {x:(xStart + x1)/2,y:(y1+y2)/2,val:4};
	}
	else if(x >= x1 && x < x2 && y >= y1 && y < y2)
	{
		return {x:(x1 + x2)/2,y:(y1+y2)/2,val:5};
	}
	else if(x >= x2 && x < xEnd && y >= y1 && y < y2)
	{
		return {x:(x2 + xEnd)/2,y:(y1+y2)/2,val:6};
	}
	else if(x >= xStart && x < x1 && y >= y2 && y < yEnd)
	{
		return {x:(xStart + x1)/2,y:(y2+yEnd)/2,val:7};
	}
	else if(x >= x1 && x < x2 && y >= y2 && y < yEnd)
	{
		return {x:(x1 + x2)/2,y:(y2+yEnd)/2,val:8};
	}
	else if(x >= x2 && x < xEnd && y >= y2 && y < yEnd)
	{
		return {x:(x2 + xEnd)/2,y:(y2+yEnd)/2,val:9};
	}
	else return null;
}

function processIndex(ind)
{
	switch(ind)
	{
		case 0: return processClick(xStart,yStart);
		case 1: return processClick(x1,yStart);
		case 2: return processClick(x2,yStart);
		case 3: return processClick(xStart,y1);
		case 4: return processClick(x1,y1);
		case 5: return processClick(x2,y1);
		case 6: return processClick(xStart,y2);
		case 7: return processClick(x1,y2);
		case 8: return processClick(x2,y2);
	}
}