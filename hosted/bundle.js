'use strict';

var socket = void 0;
var canvas = void 0;
var width = 640;
var height = 640;
var ctx = void 0;

// images
var bullets16px = void 0;
var bullets32px = void 0;
var bullets64px = void 0;

// overlay vars
var username = void 0;
var roomname = void 0;
var overlay = void 0;
var changeRoom = void 0;

// side bar element
var roomInfo = void 0;
var roomList = void 0;
var refreshRooms = void 0;

// draw related
// help keep lower spec pc move at the same speed
var lastTime = new Date().getTime();
var dt = 0;

// game related vars
var roomState = 'preparing';
var players = {};
var enemy = {};
var bullets = [];
// let skills = [];

// player related vars
var updated = false;
var attacking = false;
var toggleSkill1 = false;
var toggleSkill2 = false;
var hash = void 0;

// keyboard stuff
var myKeys = {
  KEYBOARD: {
    KEY_W: 87,
    KEY_A: 65,
    KEY_S: 83,
    KEY_D: 68,
    KEY_J: 74,
    KEY_K: 75,
    KEY_L: 76,
    KEY_SHIFT: 16
  },
  keydown: []
};
var prevKeyDown = {
  KEY_W: false,
  KEY_S: false,
  KEY_J: false,
  KEY_K: false,
  KEY_L: false
};

// Utils
// returns an object { x: var, y: var }
var lerpPos = function lerpPos(pos0, pos1, alpha) {
  var x = (1 - alpha) * pos0.x + alpha * pos1.x;
  var y = (1 - alpha) * pos0.y + alpha * pos1.y;

  // limit decimal to 2
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100
  };
};

var clamp = function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
};

// used to create client side attack circles and random particle directions
var getRandomUnitVector = function getRandomUnitVector() {
  var x = Math.random() * 2 - 1;
  var y = Math.random() * 2 - 1;
  var length = Math.sqrt(x * x + y * y);

  if (length === 0) {
    // very unlikely
    x = 1; // point right
    y = 0;
    length = 1;
  } else {
    x /= length;
    y /= length;
  }

  return { x: x, y: y };
};

var updateMovement = function updateMovement(state) {
  var user = players[hash];
  updated = false;
  attacking = false;
  toggleSkill1 = false;
  toggleSkill2 = false;

  user.prevPos = user.pos;
  user.alpha = 0.05;

  // movement check
  // if shift is down or skill is active reduce movement by 50%
  var modifier = myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] || user.skill1Used || user.skill2Used ? 0.5 : 1;

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

  // check attack and skills
  if (state === 'playing') {
    var checkKeyJ = myKeys.keydown[myKeys.KEYBOARD.KEY_J] && !prevKeyDown.KEY_J;
    var checkKeyK = myKeys.keydown[myKeys.KEYBOARD.KEY_K] && !prevKeyDown.KEY_K;
    var checkKeyL = myKeys.keydown[myKeys.KEYBOARD.KEY_L] && !prevKeyDown.KEY_L;

    // basic attack
    if (checkKeyJ && user.currentAttRate <= 0) {
      attacking = true;
      updated = true;
    }

    // skill 1
    if (checkKeyK && user.energy >= user.skill1Cost) {
      toggleSkill1 = true;
      updated = true;
    }

    // skill 2
    if (checkKeyL && user.energy >= user.skill2Cost) {
      toggleSkill2 = true;
      updated = true;
    }
  }

  // prevent player from going out of bound
  user.destPos.x = clamp(user.destPos.x, user.hitbox, 640 - user.hitbox);
  user.destPos.y = clamp(user.destPos.y, user.hitbox, 540 - user.hitbox);

  // console.log(user.pos, user.prevPos, user.destPos);
  var checkX = user.pos.x > user.destPos.x + 0.05 || user.pos.x < user.destPos.x - 0.05;
  var checkY = user.pos.y > user.destPos.y + 0.05 || user.pos.y < user.destPos.y - 0.05;

  // if this client's user moves, send to server to update server
  if (updated === true || checkX || checkY) {
    socket.emit('updatePlayer', {
      pos: user.pos,
      prevPos: user.prevPos,
      destPos: user.destPos,
      attacking: attacking,
      toggleSkill1: toggleSkill1,
      toggleSkill2: toggleSkill2
    });
  }
};

var drawFillCircle = function drawFillCircle(pos, radius, color, opacity, startAng, endAngle, ccw) {
  ctx.save();
  ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ', ' + opacity + ')';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, startAng, endAngle, ccw);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
};

var drawStrokeCircle = function drawStrokeCircle(pos, radius, color, opacity, w, startAng, endAngle, ccw) {
  ctx.save();
  ctx.strokeStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ', ' + opacity + ')';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, startAng, endAngle, ccw);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
};

var drawPlayer = function drawPlayer(player) {
  var graze = player.hitbox + player.graze;
  var opacity = 1;
  var color = {};
  var sAngle = 0;
  var eAngle = 0;

  if (player.isAlive && player.isHit) {
    opacity = 0.75;
  } else if (!player.isAlive) {
    opacity = 0.5;
  }

  // player hitbox
  drawFillCircle(player.pos, player.hitbox, player.color, opacity, 0, Math.PI * 2, false);

  // if alive - draw stats when alive
  // else - draw revive timer
  if (player.isAlive) {
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
  } else {
    // draw revive bar
    color = { r: 255, g: 255, b: 0 };
    sAngle = Math.PI / 2;
    eAngle = Math.PI * 2 * ((player.reviveTime - player.reviveTimer) / player.reviveTime);
    drawStrokeCircle(player.pos, graze, color, 1, 2, sAngle, sAngle + eAngle, false);
  }
};

// draw players
var drawPlayers = function drawPlayers() {
  var keys = Object.keys(players);

  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];

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
  var user = players[hash];
  drawPlayer(user);
};

// draw enemy
var drawEnemy = function drawEnemy() {
  // check if enemy exist remove later when enemy build is all set up ?
  if (enemy) {
    ctx.save();
    ctx.fillStyle = 'rgb(255, 0, 255)';
    ctx.fillRect(300, 40, 40, 40);
    ctx.restore();

    // enemy health bar
    var pos = { x: 320, y: 60 };
    var color = { r: 255, g: 0, b: 0 };
    var sAngle = -Math.PI / 2;
    var eAngle = Math.PI * 2 * (enemy.hp / enemy.maxHp);
    drawStrokeCircle(pos, 50, color, 1, 2, sAngle, sAngle + eAngle, false);
  }
};

// draw bullets
var drawBullets = function drawBullets() {
  for (var i = 0; i < bullets.length; i++) {
    var bullet = bullets[i];
    var sprite = bullet.sprite;
    var x = bullet.pos.x - sprite.type / 2;
    var y = bullet.pos.y - sprite.type / 2;

    ctx.save();
    // translate and rotate bullet if sprite has angle
    if (sprite.rotate) {
      x = -sprite.type / 2;
      y = -sprite.type / 2;

      ctx.translate(bullet.pos.x, bullet.pos.y);
      ctx.rotate(sprite.angle);
    }
    ctx.globalAlpha = !bullet.drained ? 1 : 0.5;
    ctx.drawImage(bullets16px, sprite.x * 16, sprite.y * 16, sprite.type, sprite.type, x, y, sprite.type, sprite.type);
    ctx.restore();

    // see hitbox
    ctx.save();
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2, false);
    ctx.stroke();
    ctx.restore();
  }
};

// draw text
var drawText = function drawText(text, x) {
  var y = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 40;
  var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 30;
  var color = arguments[4];

  ctx.save();
  ctx.fillStyle = color ? 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')' : 'white';
  ctx.font = size + 'px Arial';
  ctx.fillText(text, x, y);
  ctx.restore();
};

// draw Hud
var drawHUD = function drawHUD() {
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 541, width - 2, 98);
  ctx.fillRect(1, 541, width - 2, 98);

  // draw player stats
  ctx.fillStyle = 'white';
  var keys = Object.keys(players);
  var rectWidth = width / 4 - 2;

  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];
    var damageText = 'Damage: ' + player.minDamage + ' ~ ' + player.maxDamage;
    var x = 1 + i * (width / 4);

    ctx.strokeRect(x, 541, rectWidth, 98);
    drawText(player.name, x + rectWidth / 2, 550, 18, player.color);
    drawText(damageText, x + rectWidth / 2, 575, 12);

    // draw skill icons
    // skill 1
    var opacity = player.energy > player.skill1Cost ? 1 : 0.5;
    var fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x + rectWidth / 4, 595, 30, 30);
    ctx.strokeRect(x + rectWidth / 4, 595, 30, 30);

    // skill 2
    opacity = player.energy > player.skill2Cost ? 1 : 0.5;
    fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x + rectWidth / 2 + 10, 595, 30, 30);
    ctx.strokeRect(x + rectWidth / 2 + 10, 595, 30, 30);
  }
  ctx.restore();
};

/*
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
var preparing = function preparing(state) {
  if (state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

// players can move, place bombs and see bombs
var playing = function playing(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateMovement(state);

  drawEnemy();
  drawPlayers();
  drawBullets();
  drawHUD();
};

// handles the clients draw related functions
var handleDraw = function handleDraw() {
  var now = new Date().getTime();
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
  prevKeyDown.KEY_W = myKeys.keydown[myKeys.KEYBOARD.KEY_W];
  prevKeyDown.KEY_S = myKeys.keydown[myKeys.KEYBOARD.KEY_S];
  prevKeyDown.KEY_J = myKeys.keydown[myKeys.KEYBOARD.KEY_J];
  prevKeyDown.KEY_K = myKeys.keydown[myKeys.KEYBOARD.KEY_K];
  prevKeyDown.KEY_L = myKeys.keydown[myKeys.KEYBOARD.KEY_L];

  window.requestAnimationFrame(handleDraw);
};

var updatePlayer = function updatePlayer(users) {
  var keys = Object.keys(users);

  // loop through players to update
  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];
    var updatedPlayer = users[keys[i]];

    // if player exist and last update is less than server's - update the player
    // else - do nothing
    if (player) {
      // values that should be constantly updated
      player.hp = updatedPlayer.hp;
      player.energy = updatedPlayer.energy;
      player.currentAttRate = updatedPlayer.currentAttRate;
      player.currentExp = updatedPlayer.currentExp;
      player.isHit = updatedPlayer.isHit;
      player.reviveTimer = updatedPlayer.reviveTimer;
      player.skill1Used = updatedPlayer.skill1Used;
      player.skill2Used = updatedPlayer.skill2Used;

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
var handleUpdate = function handleUpdate(data) {
  roomState = data.state;
  bullets = data.bullets;
  enemy = data.enemy;

  updatePlayer(data.players);
};

var addPlayer = function addPlayer(data) {
  players[data.hash] = data.player;
};

var removePlayer = function removePlayer(userHash) {
  if (players[userHash]) {
    delete players[userHash];
  }
};

var levelPlayer = function levelPlayer(data) {
  var player = players[data.hash];

  player.maxHp = data.player.maxHp;
  player.maxEnergy = data.player.maxEnergy;
  player.maxDamage = data.player.maxDamage;
  player.minDamage = data.player.minDamage;
  player.attRate = data.player.attRate;
  player.exp = data.player.exp;
  player.hitbox = data.player.hitbox;
  player.graze = data.player.graze;
};

var playerIsAlive = function playerIsAlive(data) {
  var player = players[data.hash];

  player.isAlive = data.isAlive;
  player.reviveTimer = data.reviveTimer;
  player.reviveTime = data.reviveTime;
};

var setupSocket = function setupSocket() {
  socket.emit('join');

  socket.on('hash', function (data) {
    hash = data.hash;
  });

  // get other clients data from server
  socket.on('initData', function (data) {
    roomState = data.state;
    players = data.players || {};
    enemy = data.enemy || {};
    bullets = data.bullets || [];

    overlay.style.display = 'none';
    roomInfo.style.display = 'none';

    window.requestAnimationFrame(handleDraw);
  });

  socket.on('update', handleUpdate);

  socket.on('addPlayer', addPlayer);

  socket.on('removePlayer', removePlayer);

  socket.on('levelPlayer', levelPlayer);

  socket.on('playerIsAlive', playerIsAlive);

  // socket.on('skillUsed', handleSkill);

  socket.on('playerReady', function (data) {
    var player = players[data.hash];

    player.ready = data.ready;
  });

  socket.on('roomList', function (data) {
    var keys = Object.keys(data);
    roomList.innerHTML = '';

    for (var i = 0; i < keys.length; i++) {
      var room = data[keys[i]];
      var content = '<div class="room__container"><h2>' + keys[i] + '</h2>';
      content += '<p>State: ' + room.state + '</p><p>Player(s): ' + room.count + '</p></div>';

      roomList.innerHTML += content;
    }
  });

  socket.on('usernameError', function (data) {
    username.style.border = 'solid 1px red';
    console.log(data.msg);
  });
};

var init = function init() {
  socket = io.connect();
  canvas = document.querySelector('#main');
  ctx = canvas.getContext('2d');

  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);

  // images
  bullets16px = document.querySelector('#bullets16px');
  bullets32px = document.querySelector('#bullets32px');
  bullets64px = document.querySelector('#bullets64px');

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
  changeRoom.addEventListener('click', function () {
    if (roomname.value) {
      socket.emit('changeRoom', {
        room: roomname.value,
        user: {
          hash: hash,
          name: username.value ? username.value : 'guest' + Math.floor(Math.random() * 1000 + 1)
        }
      });
    } else {
      roomname.style.border = 'solid 1px red';
    }
  });

  refreshRooms.addEventListener('click', function () {
    socket.emit('refreshRoom');
  });

  window.addEventListener('keydown', function (e) {
    // console.log(`keydown: ${e.keyCode}`);
    // prevent spaces in name and scroll down function
    if (e.keyCode === myKeys.KEYBOARD.KEY_SPACE) e.preventDefault();

    myKeys.keydown[e.keyCode] = true;
  });

  window.addEventListener('keyup', function (e) {
    // console.log(`keyup: ${e.keyCode}`);
    // prevent spaces in name and scroll down function
    if (e.keyCode === myKeys.KEYBOARD.KEY_SPACE) e.preventDefault();

    myKeys.keydown[e.keyCode] = false;
  });
};

window.onload = init;

window.onunload = function () {
  socket.emit('disconnect');
};
