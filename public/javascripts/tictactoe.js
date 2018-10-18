/**
 * XOde Server Based TicTacToe Implementation
 * © 2018 Chiraag Bangera.
 * Main p5JS file the handles client side Game GUI 
 */


var baseSize = {
	w: 720,
	h: 1280
}
var gameCanvas;

let gridSize;
let lineThickness;
let scale;

let xStart;
let xEnd;
let yStart;
let yEnd;
let x1;
let x2;
let y1;
let y2;

let fSize;

let Width;
let Height;

let aspectRatio;

let setupDone;

function SETUPGAME() {
	gameCanvas = createCanvas(1,1);
	windowResized();
	gameCanvas.parent(canvasHolder);
	rescale();
	textAlign(CENTER, CENTER);
	ellipseMode(CENTER);
	rectMode(CENTER);
	angleMode(DEGREES);
	frameRate(5);
	setupDone = true;
}

function windowResized() {
	let w = document.getElementById("canvasHolder").offsetWidth;
	let h = document.getElementById("canvasHolder").offsetWidth;
	resizeCanvas(w, h);
	rescale();
}


function rescale() {
	Width = gameCanvas.width;
	Height = gameCanvas.height;
	scale = 0.5;
	gridSize = Width / 3 * scale;
	lineThickness = 5 / scale;
	fSize = 100;
	xStart = Width / 2 - gridSize * 3;
	xEnd = Width / 2 + gridSize * 3;
	yStart = Height / 2 - gridSize * 3;
	yEnd = Height / 2 + gridSize * 3;
	x1 = Width / 2 - gridSize;
	x2 = Width / 2 + gridSize;
	y1 = Height / 2 - gridSize;
	y2 = Height / 2 + gridSize;
}


function draw() {
	if(!setupDone)
	{
		return;
	}
	background(0);
	drawFrame();
}


function mouseClicked() {
	let x = mouseX;
	let y = mouseY;
	let pos = processClick(x, y);
	if (pos == null) {
		return;
	}
	if (turn == clientData.id) {
		socket.emit('sync', { id: sessionID, client: clientData, move: pos.val - 1 });
		placePiece2(symbol, pos.x, pos.y);
	}
}

function placePiece2(sym, x, y) {
	fill(255);
	textSize(fSize);
	text(sym, x, y);
}

function placePiece(sym, ind) {
	let data = processIndex(ind);
	fill(255);
	textSize(fSize);
	text(sym, data.x, data.y);
}

function drawFrame() {
	fill(255);
	strokeWeight(lineThickness);
	stroke(255);
	line(x1, yStart, x1, yEnd);
	line(x2, yStart, x2, yEnd);
	line(xStart, y1, xEnd, y1);
	line(xStart, y2, xEnd, y2);

	for (let i = 0; i < t.length; i++) {
		if (t[i] == clientData.id) {
			placePiece(symbol, i);
		}
		else if (t[i] == opponentID) {
			placePiece(opponentSymbol, i);
		}
	}
}


function processClick(x, y) {
	if (x >= xStart && x < x1 && y >= yStart && y < y1) {
		return { x: (xStart + x1) / 2, y: (yStart + y1) / 2, val: 1 };
	}
	else if (x >= x1 && x < x2 && y >= yStart && y < y1) {
		return { x: (x1 + x2) / 2, y: (yStart + y1) / 2, val: 2 };
	}
	else if (x >= x2 && x < xEnd && y >= yStart && y < y1) {
		return { x: (x2 + xEnd) / 2, y: (yStart + y1) / 2, val: 3 };
	}
	else if (x >= xStart && x < x1 && y >= y1 && y < y2) {
		return { x: (xStart + x1) / 2, y: (y1 + y2) / 2, val: 4 };
	}
	else if (x >= x1 && x < x2 && y >= y1 && y < y2) {
		return { x: (x1 + x2) / 2, y: (y1 + y2) / 2, val: 5 };
	}
	else if (x >= x2 && x < xEnd && y >= y1 && y < y2) {
		return { x: (x2 + xEnd) / 2, y: (y1 + y2) / 2, val: 6 };
	}
	else if (x >= xStart && x < x1 && y >= y2 && y < yEnd) {
		return { x: (xStart + x1) / 2, y: (y2 + yEnd) / 2, val: 7 };
	}
	else if (x >= x1 && x < x2 && y >= y2 && y < yEnd) {
		return { x: (x1 + x2) / 2, y: (y2 + yEnd) / 2, val: 8 };
	}
	else if (x >= x2 && x < xEnd && y >= y2 && y < yEnd) {
		return { x: (x2 + xEnd) / 2, y: (y2 + yEnd) / 2, val: 9 };
	}
	else return null;
}

function processIndex(ind) {
	switch (ind) {
		case 0: return processClick(xStart, yStart);
		case 1: return processClick(x1, yStart);
		case 2: return processClick(x2, yStart);
		case 3: return processClick(xStart, y1);
		case 4: return processClick(x1, y1);
		case 5: return processClick(x2, y1);
		case 6: return processClick(xStart, y2);
		case 7: return processClick(x1, y2);
		case 8: return processClick(x2, y2);
	}
}