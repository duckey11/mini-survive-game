const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const socket = io();

const player = { x: 300, y: 200, size: 20, color: 'lime', health:100, score:0 };
const players = {};
let items = [];
let safeZone = { x:0,y:0,width:600,height:400 };
const keys = {};

// Movement input
window.addEventListener('keydown', e=>keys[e.key]=true);
window.addEventListener('keyup', e=>keys[e.key]=false);

// Initialize
socket.on('init', data=>{
  Object.assign(players,data.players);
  items = data.items;
  safeZone = data.safeZone;
});

// New player
socket.on('newPlayer', data=>players[data.id]=data.player);

// Player moved
socket.on('playerMoved', data=>{ if(players[data.id]) { players[data.id].x=data.x; players[data.id].y=data.y; } });

// Item picked
socket.on('itemPicked', data=>{
  items = items.filter(i=>i.id!==data.itemId);
  if(data.playerId===socket.id) player.score+=1;
});

// Player disconnected
socket.on('playerDisconnected', id=>delete players[id]);

// Safe zone update
socket.on('updateSafeZone', data=>safeZone=data);

function update(){
  if(keys['ArrowUp']) player.y-=3;
  if(keys['ArrowDown']) player.y+=3;
  if(keys['ArrowLeft']) player.x-=3;
  if(keys['ArrowRight']) player.x+=3;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  socket.emit('move',{x:player.x,y:player.y});

  // Check item pickup
  items.forEach(item=>{
    if(player.x < item.x+20 && player.x+player.size > item.x &&
       player.y < item.y+20 && player.y+player.size > item.y){
         socket.emit('pickup', item.id);
       }
  });

  hud.textContent = `Score: ${player.score} | Health: ${player.health}`;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw safe zone
  ctx.strokeStyle='red';
  ctx.lineWidth=3;
  ctx.strokeRect(safeZone.x,safeZone.y,safeZone.width,safeZone.height);

  // Draw items
  items.forEach(item=>{
    ctx.fillStyle='yellow';
    ctx.fillRect(item.x,item.y,20,20);
  });

  // Draw players
  for(let id in players){
    let p = players[id];
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,player.size,player.size);
  }

  // Draw self
  ctx.fillStyle=player.color;
  ctx.fillRect(player.x,player.y,player.size,player.size);
}

function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }
gameLoop();
