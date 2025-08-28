const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let items = [];

// Initialize random items
for (let i = 0; i < 20; i++) {
  items.push({ id: i, x: Math.random()*550, y: Math.random()*350, type: 'health' });
}

let safeZone = { x: 50, y: 50, width: 500, height: 300 };

io.on('connection', socket => {
  console.log('Player connected:', socket.id);

  players[socket.id] = { x: Math.random()*500+50, y: Math.random()*300+50, color: getRandomColor(), health: 100, score: 0 };

  // Send initial data
  socket.emit('init', { players, items, safeZone });

  // Notify others
  socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

  // Player movement
  socket.on('move', data => {
    if(players[socket.id]){
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
    }
  });

  // Item pickup
  socket.on('pickup', itemId => {
    const index = items.findIndex(i => i.id === itemId);
    if(index !== -1){
      items.splice(index,1);
      players[socket.id].score += 1;
      io.emit('itemPicked', { itemId, playerId: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// Shrink safe zone every second
setInterval(() => {
  safeZone.x += 0.5;
  safeZone.y += 0.5;
  safeZone.width -= 1;
  safeZone.height -= 1;
  io.emit('updateSafeZone', safeZone);
}, 1000);

function getRandomColor(){
  const colors = ['lime','cyan','yellow','magenta','orange','white'];
  return colors[Math.floor(Math.random()*colors.length)];
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
