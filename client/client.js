let socket;
let canvas;
let ctx;

// overlay vars
let username;
let roomname;
let overlay;
let changeRoom;

// side bar element
let roomInfo;
let roomList;
let refreshRooms;

// draw related
// help keep lower spec pc move at the same speed
let lastTime = new Date().getTime();
let dt = 0;

// game related vars
let roomState = 'preparing';
let players = {};
let bullets = [];
// let skills = [];

// player related vars
let updated = false;
let usedSkill = false;
let previousKeyDown = false;
let hash;

// keyboard stuff
const myKeys = {
  KEYBOARD: {
    KEY_W: 87,
    KEY_A: 65,
    KEY_S: 83,
    KEY_D: 68,
    KEY_J: 74,
    KEY_K: 75,
    KEY_L: 76,
    KEY_SHIFT: 16,
  },
  keydown: [],
};

// returns an object { x: var, y: var }
const lerpPos = (pos0, pos1, alpha) => {
  const x = ((1 - alpha) * pos0.x) + (alpha * pos1.x);
  const y = ((1 - alpha) * pos0.y) + (alpha * pos1.y);

  // limit decimal to 2
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
  };
};

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const updateMovement = (state) => {
  const user = players[hash];
  updated = false;
  usedSkill = false;

  user.prevPos = user.pos;
  user.alpha = 0.05;

  // movement check
  // if shift is down reduce movement by 50%
  const modifier = myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] ? 0.5 : 1;

  if (myKeys.keydown[myKeys.KEYBOARD.KEY_W]) {
    user.destPos.y += -user.speed * dt * modifier;
    updated = true;
  }
  if (myKeys.keydown[myKeys.KEYBOARD.KEY_A]) {
    user.destPos.x += -user.speed * dt * modifier;
    updated = true;
  }
  if (myKeys.keydown[myKeys.KEYBOARD.KEY_S]) {
    user.destPos.y += user.speed * dt * modifier;
    updated = true;
  }
  if (myKeys.keydown[myKeys.KEYBOARD.KEY_D]) {
    user.destPos.x += user.speed * dt * modifier;
    updated = true;
  }

  // skill check
  if (state === 'playing') {
    if (myKeys.keydown[myKeys.KEYBOARD.KEY_SPACE] && !previousKeyDown) {
      usedSkill = true;
      updated = true;
    }
  }

  // prevent player from going out of bound
  user.destPos.x = clamp(user.destPos.x, user.hitbox, 640 - user.hitbox);
  user.destPos.y = clamp(user.destPos.y, user.hitbox, 640 - user.hitbox);

  // console.log(user.pos, user.prevPos, user.destPos);
  const checkX = (user.pos.x > user.destPos.x + 0.05) || (user.pos.x < user.destPos.x - 0.05);
  const checkY = (user.pos.y > user.destPos.y + 0.05) || (user.pos.y < user.destPos.y - 0.05);

  // if this client's user moves, send to server to update server
  if (updated === true || checkX || checkY) {
    socket.emit('updatePlayer', {
      time: new Date().getTime(),
      pos: user.pos,
      prevPos: user.prevPos,
      destPos: user.destPos,
      usedSkill,
    });
  }
};

const drawFillCircle = (pos, radius, color, opacity, startAng, endAngle, ccw) => {
  ctx.save();
  ctx.fillStyle = `rgba(${color.r},${color.g},${color.b}, ${opacity})`;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, startAng, endAngle, ccw);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
};

const drawStrokeCircle = (pos, radius, color, opacity, width, startAng, endAngle, ccw) => {
  ctx.save();
  ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b}, ${opacity})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, startAng, endAngle, ccw);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
};

const drawPlayer = (player) => {
  const opacity = player.dead ? 0.25 : 1;
  const graze = player.hitbox + player.graze;
  let color = {};
  let sAngle = 0;
  let eAngle = 0;

  // player hitbox
  drawFillCircle(player.pos, player.hitbox, player.color, opacity, 0, Math.PI * 2, false);

  // draw graze circle
  color = { r: 255, g: 255, b: 255 };
  drawStrokeCircle(player.pos, graze, color, 1, 2, 0, Math.PI * 2, false);

  // draw attack bar
  color = { r: 255, g: 255, b: 255 };
  sAngle = Math.PI / 2;
  eAngle = -Math.PI * ((player.attRate - player.currentAttRate) / player.attRate);
  drawStrokeCircle(player.pos, player.hitbox + 1, color, 1, 2, sAngle, sAngle + eAngle, true);

  // draw energy bar
  color = { r: 0, g: 0, b: 255 };
  eAngle = -Math.PI * (player.energy / player.maxEnergy);
  drawStrokeCircle(player.pos, graze, color, 1, 2, sAngle, sAngle + eAngle, true);

  // draw exp bar
  color = { r: 255, g: 255, b: 0 };
  sAngle = Math.PI / 2;
  eAngle = Math.PI * (player.currentExp / player.exp);
  drawStrokeCircle(player.pos, player.hitbox + 1, color, 1, 2, sAngle, sAngle + eAngle, false);

  // draw hp bar
  color = { r: 255, g: 0, b: 0 };
  eAngle = Math.PI * (player.hp / player.maxHp);
  drawStrokeCircle(player.pos, graze, color, 1, 2, sAngle, sAngle + eAngle, false);
};

// draw players
const drawPlayers = () => {
  const keys = Object.keys(players);

  for (let i = 0; i < keys.length; i++) {
    const player = players[keys[i]];

    // lerp players
    if (player.alpha < 1) {
      player.alpha += 0.05;
    }

    player.pos = lerpPos(player.prevPos, player.destPos, player.alpha);

    // prevent player from going out of bound
    player.pos.x = clamp(player.pos.x, player.hitbox, 640 - player.hitbox);
    player.pos.y = clamp(player.pos.y, player.hitbox, 640 - player.hitbox);

    // ignores this clients object
    if (keys[i] !== hash) {
      drawPlayer(player);
    }
  }

  // draw clients player
  const user = players[hash];
  drawPlayer(user);
};

// draw bullets
const drawBullets = () => {
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    const fill = `rgba(0, 0, 0, ${bullet.drained ? 1 : 0.5})`;

    ctx.strokeStyle = 'white';
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2, false);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }
};

/*
// draw text
const drawText = (text, x, y = 40, size = 30) => {
  ctx.fillStyle = 'black';
  ctx.font = `${size}px Arial`;
  ctx.fillText(text, x, y);
};

const checkReady = () => {
  const user = players[hash];

  // emit only when current keypress is down and previous is up
  if (myKeys.keydown[myKeys.KEYBOARD.KEY_SPACE] && !previousKeyDown) {
    socket.emit('togglePlayerReady', {
      ready: !user.ready,
    });
  }
};
*/

// players can move and update ready state.
const preparing = (state) => {
  if (state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

// players can move, place bombs and see bombs
const playing = (state) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateMovement(state);

  drawPlayers();
  drawBullets();
};

// handles the clients draw related functions
const handleDraw = () => {
  const now = new Date().getTime();
  // in seconds
  dt = (now - lastTime) / 1000;
  lastTime = now;

  // handle update based on game state
  if (roomState === 'preparing') {
    preparing(roomState);
  } else if (roomState === 'playing') {
    playing(roomState);
  }

  // prevent toggling ready each frame and placing bomb at the beginning
  if (myKeys.keydown[myKeys.KEYBOARD.KEY_J]) {
    previousKeyDown = true;
  } else {
    previousKeyDown = false;
  }

  window.requestAnimationFrame(handleDraw);
};

const updatePlayer = (users) => {
  const keys = Object.keys(users);

  // loop through players to update
  for (let i = 0; i < keys.length; i++) {
    const player = players[keys[i]];
    const updatedPlayer = users[keys[i]];

    // if player exist and last update is less than server's - update the player
    // else - do nothing
    if (player) {
      // values that should be constantly updated

      // values that should be updated if the client emited updatedPlayer
      if (player.lastUpdate < updatedPlayer.lastUpdate) {
        // Move last update out of player and keep track of rooms last update?
        player.lastUpdate = updatedPlayer.lastUpdate;

        player.alpha = 0.05;

        // only update other users pos
        if (player.hash !== hash) {
          player.prevPos = updatedPlayer.prevPos;
          player.destPos = updatedPlayer.destPos;
        }
      }
    }
  }
};

// called when server sends update
const handleUpdate = (data) => {
  roomState = data.state;
  bullets = data.bullets;

  updatePlayer(data.players);
};

const addPlayer = (data) => {
  players[data.hash] = data.player;
};

const removePlayer = (userHash) => {
  if (players[userHash]) {
    delete players[userHash];
  }
};

const setupSocket = () => {
  socket.emit('join');

  socket.on('update', handleUpdate);

  // socket.on('skillUsed', handleSkill);

  socket.on('addPlayer', addPlayer);

  socket.on('removePlayer', removePlayer);

  socket.on('playerReady', (data) => {
    const player = players[data.hash];

    player.ready = data.ready;
  });

  socket.on('playerDead', (data) => {
    const player = players[data.hash];

    player.dead = data.dead;
  });

  socket.on('hash', (data) => {
    hash = data.hash;
  });

  // get other clients data from server
  socket.on('initData', (data) => {
    roomState = data.state;
    players = data.players;
    bullets = data.bullets;

    overlay.style.display = 'none';
    roomInfo.style.display = 'none';

    window.requestAnimationFrame(handleDraw);
  });

  socket.on('roomList', (data) => {
    const keys = Object.keys(data);
    roomList.innerHTML = '';

    for (let i = 0; i < keys.length; i++) {
      const room = data[keys[i]];
      let content = `<div class="room__container"><h2>${keys[i]}</h2>`;
      content += `<p>State: ${room.state}</p><p>Player(s): ${room.count}</p></div>`;

      roomList.innerHTML += content;
    }
  });

  socket.on('usernameError', (data) => {
    username.style.border = 'solid 1px red';
    console.log(data.msg);
  });
};

const init = () => {
  socket = io.connect();
  canvas = document.querySelector('#main');
  ctx = canvas.getContext('2d');

  canvas.setAttribute('width', 640);
  canvas.setAttribute('height', 640);

  // overlay
  username = document.querySelector('#username');
  roomname = document.querySelector('#roomname');
  overlay = document.querySelector('.canvas__overlay');
  changeRoom = document.querySelector('.change__room');

  // sidebar
  roomInfo = document.querySelector('.room__infos');
  roomList = document.querySelector('.room__list');
  refreshRooms = document.querySelector('.refresh__room');

  setupSocket();

  // event listeners
  changeRoom.addEventListener('click', () => {
    if (roomname.value) {
      socket.emit('changeRoom', {
        room: roomname.value,
        user: {
          hash,
          name: username.value ? username.value : `guest${Math.floor((Math.random() * 1000) + 1)}`,
        },
      });
    } else {
      roomname.style.border = 'solid 1px red';
    }
  });

  refreshRooms.addEventListener('click', () => {
    socket.emit('refreshRoom');
  });

  window.addEventListener('keydown', (e) => {
    // console.log(`keydown: ${e.keyCode}`);
    // prevent spaces in name and scroll down function
    if (e.keyCode === myKeys.KEYBOARD.KEY_SPACE) e.preventDefault();

    myKeys.keydown[e.keyCode] = true;
  });

  window.addEventListener('keyup', (e) => {
    // console.log(`keyup: ${e.keyCode}`);
    // prevent spaces in name and scroll down function
    if (e.keyCode === myKeys.KEYBOARD.KEY_SPACE) e.preventDefault();

    myKeys.keydown[e.keyCode] = false;
  });
};

window.onload = init;

window.onunload = () => {
  socket.emit('disconnect');
};