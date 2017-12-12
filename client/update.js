// client updates to server
// update client's preparing state
const updatePreparing = () => {
  const user = players[hash];

  // dont check update if user is undefined
  if (!user) {
    return;
  }

  updated = false;
  let toggleReady = false;

  const checkKeyW = myKeys.keydown[myKeys.KEYBOARD.KEY_W] && !prevKeyDown.KEY_W;
  const checkKeyS = myKeys.keydown[myKeys.KEYBOARD.KEY_S] && !prevKeyDown.KEY_S;
  const checkKeyJ = myKeys.keydown[myKeys.KEYBOARD.KEY_J] && !prevKeyDown.KEY_J;

  if (checkKeyW && !user.ready) {
    if (user.type === 'fighter') {
      user.type = 'aura';
    } else if (user.type === 'bomber') {
      user.type = 'fighter';
    } else if (user.type === 'cleric') {
      user.type = 'bomber';
    } else if (user.type === 'aura') {
      user.type = 'cleric';
    }
    updated = true;
  }
  if (checkKeyS && !user.ready) {
    if (user.type === 'fighter') {
      user.type = 'bomber';
    } else if (user.type === 'bomber') {
      user.type = 'cleric';
    } else if (user.type === 'cleric') {
      user.type = 'aura';
    } else if (user.type === 'aura') {
      user.type = 'fighter';
    }
    updated = true;
  }

  // check if user is ready.
  if (checkKeyJ) {
    toggleReady = true;
    updated = true;
  }

  if (updated) {
    socket.emit('updatePlayer', {
      type: user.type,
      toggleReady,
    });
  }
};

// update client's playing state
const updatePlaying = () => {
  const user = players[hash];

  // dont check update if user is undefined
  if (!user) return;

  updated = false;
  attacking = false;
  toggleSkill1 = false;
  toggleSkill2 = false;


  user.prevPos = user.pos;
  user.alpha = 0.05;

  // movement check
  // if shift is down or skill is active reduce movement by 50%
  const modifier = myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] ||
    user.skill1Used || user.skill2Used
    ? 0.5
    : 1;

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

  const checkKeyJ = myKeys.keydown[myKeys.KEYBOARD.KEY_J] && !prevKeyDown.KEY_J;
  const checkKeyK = myKeys.keydown[myKeys.KEYBOARD.KEY_K] && !prevKeyDown.KEY_K;
  const checkKeyL = myKeys.keydown[myKeys.KEYBOARD.KEY_L] && !prevKeyDown.KEY_L;

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

  // prevent player from going out of bound
  user.destPos.x = clamp(user.destPos.x, user.hitbox, 640 - user.hitbox);
  user.destPos.y = clamp(user.destPos.y, user.hitbox, 540 - user.hitbox);

  // console.log(user.pos, user.prevPos, user.destPos);
  const checkX = (user.pos.x > user.destPos.x + 0.05) || (user.pos.x < user.destPos.x - 0.05);
  const checkY = (user.pos.y > user.destPos.y + 0.05) || (user.pos.y < user.destPos.y - 0.05);

  // if this client's user moves, send to server to update server
  if (updated === true || checkX || checkY) {
    socket.emit('updatePlayer', {
      pos: user.pos,
      prevPos: user.prevPos,
      destPos: user.destPos,
      attacking,
      toggleSkill1,
      toggleSkill2,
    });
  }
};

// Updates from server
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
      player.hp = updatedPlayer.hp;
      player.energy = updatedPlayer.energy;
      player.currentAttRate = updatedPlayer.currentAttRate;
      player.currentExp = updatedPlayer.currentExp;
      player.isHit = updatedPlayer.isHit;
      player.reviveTimer = updatedPlayer.reviveTimer;
      player.skill1Used = updatedPlayer.skill1Used;
      player.skill2Used = updatedPlayer.skill2Used;
      player.critcalPos = updatedPlayer.critcalPos;

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

const handleUpdate = (data) => {
  roomState = data.state;
  emitters = data.emitters;
  bullets = data.bullets;
  enemy = data.enemy;

  updatePlayer(data.players);
};
