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
    opacity = 0.5;
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
