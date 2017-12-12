let socket;
let canvas;
const width = 640;
const height = 640;
let ctx;

// images
let bullets16px;
let bullets32px;
let bullets64px;
let fighterStatsImage; // fighter stats
let bomberStatsImage; // bomber stats
let clericStatsImage; // cleric stats
let auraStatsImage; // aura stats
let skillIconImage; // skill icons
let normalImage; // normal attack
let criticalImage; // critcal attack
let finalStrikeImage; // fighter skill 1
let fullForceImage; // fighter skill 2
let smiteImage; // cleric skill 1
let hpRegenImage; // cleric skill 2
let fireballImage; // aura skill 1
let fireStormImage; // aura skill 2

// overlay vars
let username;
let roomname;
let overlay;
let changeRoom;
let isChangingRoom = false;

// draw related
// help keep lower spec pc move at the same speed
let lastTime = new Date().getTime();
let dt = 0;

// game related vars
let roomState = 'preparing';
let players = {};
let enemy = {};
let emitters = [];
let bullets = [];
let skills = [];

// player related vars
let updated = false;
let attacking = false;
let toggleSkill1 = false;
let toggleSkill2 = false;
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
const prevKeyDown = {
  KEY_W: false,
  KEY_S: false,
  KEY_J: false,
  KEY_K: false,
  KEY_L: false,
};


// Utils
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


// SKILL RELATED
const updateSkills = () => {
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    if (skill.image) {
      skill.frame++;

      if (skill.frame > 6) {
        skill.frame = 0;
        skill.currentSprite++;

        // if currentSprite is greater - set active to false
        if (skill.currentSprite > skill.sprites) {
          skill.active = false;
        }

        // max x is 4 set back to 0 and increase y
        if (skill.imagePos.x >= 4) {
          skill.imagePos.x = 0;
          skill.imagePos.y++;
        } else {
          skill.imagePos.x++;
        }
      }

      // make the skill follow players
      if (skill.type === 'Hp Regen') {
        const player = players[skill.hash];

        skill.pos = player.pos;
      }
    } else if (skill.type === 'bs1') {
      skill.outerRadius *= 0.99;
      skill.innerRadius *= 0.97;
      skill.opacity += -0.01;
      skill.life += -1;

      skill.active = skill.life > 0;
    } else if (skill.type === 'bs2') {
      skill.outerRadius += 4;
      skill.innerRadius += 3;
      skill.opacity -= 0.003;
      skill.life += -1;

      skill.active = skill.life > 0;
    }
  }

  skills = skills.filter(skill => skill.active);
};

// all skills are 192 x 192
const drawSkills = () => {
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    ctx.save();
    if (skill.image) {
      ctx.drawImage(
        skill.image,
        skill.imagePos.x * 192, skill.imagePos.y * 192, 192, 192,
        skill.pos.x - (skill.size / 2), skill.pos.y - (skill.size / 2), skill.size, skill.size
      );
    } else if (skill.type === 'bs1' || skill.type === 'bs2') {
      const x = skill.pos.x;
      const y = skill.pos.y;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, skill.outerRadius);
      if (skill.type === 'bs1') {
        grad.addColorStop(0, `rgba(${skill.color.r}, ${skill.color.g}, ${skill.color.b}, 0)`);
        grad.addColorStop(1, `rgba(${skill.color.r}, ${skill.color.g}, ${skill.color.b}, ${skill.opacity})`);
      } else if (skill.type === 'bs2') {
        grad.addColorStop(0, `rgba(${skill.color.r}, ${skill.color.g}, ${skill.color.b}, ${skill.opacity})`);
        grad.addColorStop(1, `rgba(${skill.color.r}, ${skill.color.g}, ${skill.color.b}, 0)`);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, skill.outerRadius, 0, Math.PI * 2, false); // outer
      ctx.arc(x, y, skill.innerRadius, 0, Math.PI * 2, true); // inner
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }
};

// show something when skill is used
const handleSkill = (type, data) => {
  let skill = {
    active: false,
  };

  // set up sprite only if the image exists
  if (type === 'normalAttack' && normalImage) {
    skill = {
      type,
      pos: data.pos,
      size: 100,
      image: normalImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 7,
      active: true,
    };
  } else if (type === 'critcalAttack' && criticalImage) {
    skill = {
      type,
      pos: data.pos,
      size: 100,
      image: criticalImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 11,
      active: true,
    };
  } else if (type === 'Final Strike' && finalStrikeImage) {
    skill = {
      type,
      pos: data.pos,
      size: 100,
      image: finalStrikeImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 7,
      active: true,
    };
  } else if (type === 'Full Force' && fullForceImage) {
    skill = {
      type,
      pos: data.pos,
      size: 100,
      image: fullForceImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 8,
      active: true,
    };
  } else if (type === 'bs1') {
    const player = players[data.hash];

    skill = {
      type,
      pos: player.pos,
      color: {
        r: Math.round(player.color.r),
        g: Math.round(player.color.g),
        b: Math.round(player.color.b),
      },
      outerRadius: (2 * (player.hitbox + player.graze)),
      innerRadius: (2 * (player.hitbox + player.graze)),
      opacity: 0.5,
      life: 50,
      active: true,
    };
  } else if (type === 'bs2') {
    const player = players[data.hash];

    skill = {
      type,
      pos: player.pos,
      color: {
        r: Math.round(player.color.r),
        g: Math.round(player.color.g),
        b: Math.round(player.color.b),
      },
      outerRadius: 1,
      innerRadius: 0,
      opacity: Math.Min((28 + (2 * player.level)) / 100, 1),
      life: 120,
      active: true,
    };
  } else if (type === 'Smite' && smiteImage) {
    skill = {
      type,
      pos: data.pos,
      size: 125,
      image: smiteImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 7,
      active: true,
    };
  } else if (type === 'Hp Regen' && hpRegenImage) {
    const keys = Object.keys(players);
    for (let i = 0; i < keys.length; i++) {
      skill = {
        type,
        hash: players[keys[i]].hash,
        pos: players[keys[i]].pos,
        size: 100,
        image: hpRegenImage,
        imagePos: {
          x: 0,
          y: 0,
        },
        frame: 0,
        currentSprite: 0,
        sprites: 20,
        active: true,
      };
      skills.push(skill);
    }
    return;
  } else if (type === 'Fireball' && fireballImage) {
    const player = players[hash];
    const size = (player.hitbox + player.graze + 25) * 2;

    skill = {
      type,
      pos: data.pos,
      size,
      image: fireballImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 15,
      active: true,
    };
  } else if (type === 'Fire Storm' && fireStormImage) {
    // randomize pos slightly
    const pos = {
      x: data.pos.x + Math.floor((Math.random() * 41) - 20),
      y: data.pos.y + Math.floor((Math.random() * 41) - 20),
    };

    skill = {
      type,
      pos,
      size: 100,
      image: fireStormImage,
      imagePos: {
        x: 0,
        y: 0,
      },
      frame: 0,
      currentSprite: 0,
      sprites: 12,
      active: true,
    };
  }

  skills.push(skill);
};


// CLIENT UPDATE RELATED
// update client's preparing state
// handles user inputs
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
// handles user inputs
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


// DRAW RELATED
const drawFillCircle = (pos, radius, color, opacity, startAng, endAngle, ccw) => {
  ctx.save();
  ctx.fillStyle = `rgba(${color.r},${color.g},${color.b}, ${opacity})`;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, startAng, endAngle, ccw);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
};

const drawStrokeCircle = (pos, radius, color, opacity, w, startAng, endAngle, ccw) => {
  ctx.save();
  ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b}, ${opacity})`;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, startAng, endAngle, ccw);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
};

const drawCritcalPoint = (pos, sprite, opacity) => {
  // something
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(
    bullets64px,
    sprite * 64, 0, 64, 64,
    pos.x - 32, pos.y - 32, 64, 64
  );
  // drawStrokeCircle(pos, 32, { r: 255, g: 255, b: 255 }, 1, 2, 0, Math.PI * 2, false);
  ctx.restore();
};

const drawPlayer = (player) => {
  const graze = player.hitbox + player.graze;
  let opacity = 1;
  let color = {};
  let sAngle = 0;
  let eAngle = 0;

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
    eAngle = (Math.PI * 2) * ((player.reviveTime - player.reviveTimer) / player.reviveTime);
    drawStrokeCircle(player.pos, graze, color, 1, 2, sAngle, sAngle + eAngle, false);
  }
};

// draw players (playing state)
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
  const opacity = user.currentAttRate === 0 ? 1 : 0.5;
  drawCritcalPoint(user.critcalPos, user.color.sprite, opacity);
  drawPlayer(user);
};

// draw enemy (playing state)
const drawEnemy = () => {
  // check if enemy exist remove later when enemy build is all set up ?
  if (enemy) {
    const { pos, size } = enemy;
    ctx.save();
    ctx.fillStyle = 'rgb(255, 0, 255)';
    ctx.fillRect(pos.x - (size.width / 2), pos.y - (size.width / 2), size.width, size.height);
    ctx.restore();

    // enemy health bar
    const radius = Math.round((size.width + size.height) / 2) + 10;
    const color = { r: 255, g: 0, b: 0 };
    const sAngle = -Math.PI / 2;
    const eAngle = (Math.PI * 2) * (enemy.hp / enemy.maxHp);
    drawStrokeCircle(pos, radius, color, 1, 2, sAngle, sAngle + eAngle, false);
  }
};

// draw bullet emitters
const drawEmitters = () => {
  for (let i = 0; i < emitters.length; i++) {
    const emitter = emitters[i];
    const sprite = emitter.sprite;
    const x = emitter.pos.x - (sprite.type / 2);
    const y = emitter.pos.y - (sprite.type / 2);

    ctx.save();
    if (sprite.type === 32) {
      ctx.drawImage(
        bullets32px,
        sprite.x * 32, sprite.y * 32, sprite.type, sprite.type,
        x, y, sprite.type, sprite.type
      );
    }
    ctx.restore();
  }
};

// draw bullets (playing state)
const drawBullets = () => {
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    const sprite = bullet.sprite;
    let x = bullet.pos.x - (sprite.type / 2);
    let y = bullet.pos.y - (sprite.type / 2);

    ctx.save();
    // translate and rotate bullet if sprite has angle
    if (sprite.rotate) {
      x = -sprite.type / 2;
      y = -sprite.type / 2;

      ctx.translate(bullet.pos.x, bullet.pos.y);
      ctx.rotate(sprite.angle);
    }
    ctx.globalAlpha = !bullet.drained ? 1 : 0.5;
    if (sprite.type === 16) {
      ctx.drawImage(
        bullets16px,
        sprite.x * 16, sprite.y * 16, sprite.type, sprite.type,
        x, y, sprite.type, sprite.type
      );
    } else if (sprite.type === 32) {
      ctx.drawImage(
        bullets32px,
        sprite.x * 32, sprite.y * 32, sprite.type, sprite.type,
        x, y, sprite.type, sprite.type
      );
    } else if (sprite.type === 64) {
      ctx.drawImage(
        bullets64px,
        sprite.x * 64, sprite.y * 64, sprite.type, sprite.type,
        x, y, sprite.type, sprite.type
      );
    }
    ctx.restore();

    // see hitbox
    /*
      ctx.save();
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.restore();
    */
  }
};

// draw text
const drawText = (text, x, y = 40, size = 30, color) => {
  ctx.save();
  const alpha = color && color.a ? color.a : 1;
  ctx.fillStyle = color ? `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})` : 'white';
  ctx.font = `${size}px Arial`;
  ctx.fillText(text, x, y);
  ctx.restore();
};

// draw player ready state (prepare state)
const drawPlayersReady = () => {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 491, width - 2, 48);
  ctx.fillRect(1, 491, width - 2, 48);

  // draw player stats
  const keys = Object.keys(players);
  const rectWidth = (width / 4) - 2;

  for (let i = 0; i < keys.length; i++) {
    const player = players[keys[i]];
    const x = 1 + (i * (width / 4));

    if (player.ready) {
      ctx.fillStyle = 'green';
    } else {
      ctx.fillStyle = 'black';
    }
    ctx.strokeRect(x, 491, rectWidth, 48);
    ctx.fillRect(x, 491, rectWidth, 48);

    drawText(player.type, x + (rectWidth / 2), 505, 18);
  }
  ctx.restore();
};

// draw class select (prepare state)
const drawSelectScreen = () => {
  const user = players[hash];
  const rectWidth = (width / 4) - 2;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'white';
  ctx.strokeRect(1, 1, rectWidth, height - 102);

  drawText('Classes', (rectWidth / 2), 115, 24);

  // show highlight on current selected class
  // and set class stat image
  let classStatImage;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

  if (user.type === 'fighter') {
    ctx.fillRect(11, 160, rectWidth - 20, 58);

    classStatImage = fighterStatsImage;
  } else if (user.type === 'bomber') {
    ctx.fillRect(11, 240, rectWidth - 20, 58);

    classStatImage = bomberStatsImage;
  } else if (user.type === 'cleric') {
    ctx.fillRect(11, 320, rectWidth - 20, 58);

    classStatImage = clericStatsImage;
  } else if (user.type === 'aura') {
    ctx.fillRect(11, 400, rectWidth - 20, 58);

    classStatImage = auraStatsImage;
  }

  // draw class stats if image isn't null
  if (classStatImage) {
    ctx.drawImage(
      classStatImage,
      2, 0, 478, 480,
      rectWidth + 2, 0, 480, 480
    );
  } else {
    const red = { r: 255, g: 0, b: 0 };
    drawText('Error: Unable to find class\'s stat', rectWidth + 240, 260, 20, red);
  }

  // label boxes with class names
  ctx.strokeRect(11, 160, rectWidth - 20, 58);
  drawText('Fighter', (rectWidth / 2), 180, 20);

  ctx.strokeRect(11, 240, rectWidth - 20, 58);
  drawText('Bomber', (rectWidth / 2), 260, 20);

  ctx.strokeRect(11, 320, rectWidth - 20, 58);
  drawText('Cleric', (rectWidth / 2), 340, 20);

  ctx.strokeRect(11, 400, rectWidth - 20, 58);
  drawText('Aura', (rectWidth / 2), 420, 20);

  // room name
  ctx.strokeRect(1, 1, rectWidth, 98);
  drawText('Room', rectWidth / 2, 20, 24);
  drawText(roomname.value, rectWidth / 2, 60, 20);

  ctx.restore();
};

// draw Hud (both states)
const drawHUD = (state) => {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 541, width - 2, 98);
  ctx.fillRect(1, 541, width - 2, 98);

  // draw player stats
  ctx.fillStyle = 'white';
  const keys = Object.keys(players);
  const rectWidth = (width / 4) - 2;

  for (let i = 0; i < keys.length; i++) {
    const player = players[keys[i]];
    const damageText = `Damage: ${player.minDamage} ~ ${player.maxDamage}`;
    const x = 1 + (i * (width / 4));

    ctx.strokeRect(x, 541, rectWidth, 98);
    if (state === 'preparing') {
      // temporary color for players
      let color;
      if (i === 0) {
        color = {
          r: 255,
          g: 0,
          b: 0,
        };
      } else if (i === 1) {
        color = {
          r: 0,
          g: 255,
          b: 0,
        };
      } else if (i === 2) {
        color = {
          r: 0,
          g: 255,
          b: 255,
        };
      } else {
        color = {
          r: 255,
          g: 165,
          b: 0,
        };
      }
      drawText(player.name, x + (rectWidth / 2), 550, 18, color);
    } else if (state === 'playing') {
      drawText(player.name, x + (rectWidth / 2), 550, 18, player.color);
      drawText(damageText, x + (rectWidth / 2), 575, 12);
    }

    // draw skill icons
    let opacity = player.energy > player.skill1Cost ? 1 : 0.5;
    ctx.fillStyle = 'white';

    // skill box location
    ctx.strokeRect(x + (rectWidth / 4), 595, 30, 30);
    ctx.strokeRect(x + (rectWidth / 2) + 10, 595, 30, 30);

    if (player.type === 'fighter') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        0, 0, 42, 42,
        x + (rectWidth / 4), 595, 30, 30
      );
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        42, 0, 42, 42,
        x + (rectWidth / 2) + 10, 595, 30, 30
      );
      ctx.restore();
    } else if (player.type === 'bomber') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        0, 42, 42, 42,
        x + (rectWidth / 4), 595, 30, 30
      );
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        42, 42, 42, 42,
        x + (rectWidth / 2) + 10, 595, 30, 30
      );
      ctx.restore();
    } else if (player.type === 'cleric') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        0, 84, 42, 42,
        x + (rectWidth / 4), 595, 30, 30
      );
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        42, 84, 42, 42,
        x + (rectWidth / 2) + 10, 595, 30, 30
      );
      ctx.restore();
    } else if (player.type === 'aura') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        0, 126, 42, 42,
        x + (rectWidth / 4), 595, 30, 30
      );
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        skillIconImage,
        42, 126, 42, 42,
        x + (rectWidth / 2) + 10, 595, 30, 30
      );
      ctx.restore();
    }
  }
  ctx.restore();
};

// players can move and update ready state.
const preparing = (state) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePreparing();

  drawSelectScreen();
  drawPlayersReady();
  drawHUD(state);
};

// players can move, place bombs and see bombs
const playing = (state) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlaying();
  updateSkills();

  drawEnemy();
  drawEmitters();
  drawPlayers();
  drawSkills();
  drawBullets();
  drawHUD(state);
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
  prevKeyDown.KEY_W = myKeys.keydown[myKeys.KEYBOARD.KEY_W];
  prevKeyDown.KEY_S = myKeys.keydown[myKeys.KEYBOARD.KEY_S];
  prevKeyDown.KEY_J = myKeys.keydown[myKeys.KEYBOARD.KEY_J];
  prevKeyDown.KEY_K = myKeys.keydown[myKeys.KEYBOARD.KEY_K];
  prevKeyDown.KEY_L = myKeys.keydown[myKeys.KEYBOARD.KEY_L];

  window.requestAnimationFrame(handleDraw);
};


// SOCKET.ON RELATED
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

// called in handleUpdate
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
