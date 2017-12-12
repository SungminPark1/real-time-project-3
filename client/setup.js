const setHash = (data) => {
  console.log(`got hash ${data.hash}`);
  hash = data.hash;
};

const handleInitData = (data) => {
  roomState = data.state;
  players = data.players || {};
  enemy = data.enemy || {};
  bullets = data.bullets || [];

  overlay.style.display = 'none';

  window.requestAnimationFrame(handleDraw);
};

const handleStartUp = (data) => {
  roomState = data.state;
  players = data.players;
  enemy = data.enemy;
  bullets = data.bullets;
  skills = [];
};

const addPlayer = (data) => {
  players[data.hash] = data.player;
};

const removePlayer = (userHash) => {
  if (players[userHash]) {
    delete players[userHash];
  }
};

const levelPlayer = (data) => {
  const player = players[data.hash];

  player.level = data.player.level;
  player.maxHp = data.player.maxHp;
  player.maxEnergy = data.player.maxEnergy;
  player.maxDamage = data.player.maxDamage;
  player.minDamage = data.player.minDamage;
  player.attRate = data.player.attRate;
  player.exp = data.player.exp;
  player.hitbox = data.player.hitbox;
  player.graze = data.player.graze;
  player.speed = data.player.speed;
};

const playerPreparing = (data) => {
  const player = players[data.hash];

  player.type = data.type;
  player.ready = data.ready;
};

const playerIsAlive = (data) => {
  const player = players[data.hash];

  player.isAlive = data.isAlive;
  player.reviveTimer = data.reviveTimer;
  player.reviveTime = data.reviveTime;
};

const playerAttacking = (data) => {
  if (data.isCritcalHit) {
    handleSkill('critcalAttack', data);
  } else {
    handleSkill('normalAttack', data);
  }
};

const playerUsedSkill = (data) => {
  handleSkill(data.skillName, data);
};

const changeRoomError = (data) => {
  isChangingRoom = false;
  console.log(data.msg);
  socket.emit('disconnect');
};

const usernameError = (data) => {
  username.style.border = 'solid 1px red';
  isChangingRoom = false;
  console.log(data.msg);
  socket.emit('disconnect');
};

const setupSocket = () => {
  // socket.emit('join');

  socket.on('hash', setHash);

  // game room update related
  socket.on('initData', handleInitData);
  socket.on('startGame', handleStartUp);
  socket.on('update', handleUpdate);

  // player update related
  socket.on('addPlayer', addPlayer);
  socket.on('removePlayer', removePlayer);
  socket.on('levelPlayer', levelPlayer);
  socket.on('playerPreparing', playerPreparing);
  socket.on('playerIsAlive', playerIsAlive);
  socket.on('playerAttacking', playerAttacking);
  socket.on('playerUsedSkill', playerUsedSkill);

  // lobby related
  socket.on('changeRoomError', changeRoomError);
  socket.on('usernameError', usernameError);
};

const init = () => {
  canvas = document.querySelector('#main');
  ctx = canvas.getContext('2d');

  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);

  // images
  bullets16px = document.querySelector('#bullets16px') || null;
  bullets32px = document.querySelector('#bullets32px') || null;
  bullets64px = document.querySelector('#bullets64px') || null;
  fighterStatsImage = document.querySelector('#fighterStats') || null;
  bomberStatsImage = document.querySelector('#bomberStats') || null;
  clericStatsImage = document.querySelector('#clericStats') || null;
  auraStatsImage = document.querySelector('#auraStats') || null;
  skillIconImage = document.querySelector('#skillIcon') || null;
  normalImage = document.querySelector('#normal') || null;
  criticalImage = document.querySelector('#critical') || null;
  finalStrikeImage = document.querySelector('#finalStrike') || null;
  fullForceImage = document.querySelector('#fullForce') || null;
  smiteImage = document.querySelector('#smite') || null;
  hpRegenImage = document.querySelector('#hpRegen') || null;
  fireballImage = document.querySelector('#fireball') || null;
  fireStormImage = document.querySelector('#fireStorm') || null;

  // overlay
  username = document.querySelector('#username');
  roomname = document.querySelector('#roomname');
  overlay = document.querySelector('.canvas__overlay');
  changeRoom = document.querySelector('.change__room');

  // event listeners
  changeRoom.addEventListener('click', () => {
    // if user is valid connect socket and emit join
    if (roomname.value && !isChangingRoom) {
      // prevent attempt to change room multiple times
      isChangingRoom = true;

      // prevent multiple socket connects
      if (!socket) {
        socket = io.connect();

        setupSocket();
      }

      socket.emit('join', {
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
