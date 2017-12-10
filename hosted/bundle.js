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
var fighterStatsImage = void 0; // fighter stats
var bomberStatsImage = void 0; // bomber stats
var clericStatsImage = void 0; // cleric stats
var auraStatsImage = void 0; // aura stats
var skillIconImage = void 0; // skill icons
var normalImage = void 0; // normal attack
var criticalImage = void 0; // critcal attack
var finalStrikeImage = void 0; // fighter skill 1
var fullForceImage = void 0; // fighter skill 2
var smiteImage = void 0; // cleric skill 1
var hpRegenImage = void 0; // cleric skill 2
var fireballImage = void 0; // aura skill 1
var fireStormImage = void 0; // aura skill 2

// overlay vars
var username = void 0;
var roomname = void 0;
var overlay = void 0;
var changeRoom = void 0;
var isChangingRoom = false;

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
var skills = [];

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

var updateSkills = function updateSkills() {
  for (var i = 0; i < skills.length; i++) {
    var skill = skills[i];

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
      var player = players[skill.hash];

      skill.pos = player.pos;
    }
  }

  skills = skills.filter(function (skill) {
    return skill.active;
  });
};

// all skills are 192 x 192
var drawSkills = function drawSkills() {
  for (var i = 0; i < skills.length; i++) {
    var skill = skills[i];

    ctx.save();
    if (skill.image) {
      ctx.drawImage(skill.image, skill.imagePos.x * 192, skill.imagePos.y * 192, 192, 192, skill.pos.x - skill.size / 2, skill.pos.y - skill.size / 2, skill.size, skill.size);
    }
    ctx.restore();
  }
};

// show something when skill is used
var handleSkill = function handleSkill(type, data) {
  var skill = {
    active: false
  };

  // set up sprite only if the image exists
  if (type === 'normalAttack' && normalImage) {
    skill = {
      type: type,
      pos: data.pos,
      size: 100,
      image: normalImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 7,
      active: true
    };
  } else if (type === 'critcalAttack' && criticalImage) {
    skill = {
      type: type,
      pos: data.pos,
      size: 100,
      image: criticalImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 11,
      active: true
    };
  } else if (type === 'Final Strike' && finalStrikeImage) {
    skill = {
      type: type,
      pos: data.pos,
      size: 100,
      image: finalStrikeImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 7,
      active: true
    };
  } else if (type === 'Full Force' && fullForceImage) {
    skill = {
      type: type,
      pos: data.pos,
      size: 100,
      image: fullForceImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 8,
      active: true
    };
  } else if (type === 'Smite' && smiteImage) {
    skill = {
      type: type,
      pos: data.pos,
      size: 125,
      image: smiteImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 7,
      active: true
    };
  } else if (type === 'Hp Regen' && hpRegenImage) {
    var keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
      skill = {
        type: type,
        hash: players[keys[i]].hash,
        pos: players[keys[i]].pos,
        size: 100,
        image: hpRegenImage,
        imagePos: {
          x: 0,
          y: 0
        },
        frame: 0,
        currentSprite: 0,
        sprites: 20,
        active: true
      };
      skills.push(skill);
    }
    return;
  } else if (type === 'Fireball' && fireballImage) {
    var player = players[hash];
    var size = (player.hitbox + player.graze + 25) * 2;

    skill = {
      type: type,
      pos: data.pos,
      size: size,
      image: fireballImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 15,
      active: true
    };
  } else if (type === 'Fire Storm' && fireStormImage) {
    // randomize pos slightly
    var pos = {
      x: data.pos.x + Math.floor(Math.random() * 41 - 20),
      y: data.pos.y + Math.floor(Math.random() * 41 - 20)
    };

    skill = {
      type: type,
      pos: pos,
      size: 100,
      image: fireStormImage,
      imagePos: {
        x: 0,
        y: 0
      },
      frame: 0,
      currentSprite: 0,
      sprites: 12,
      active: true
    };
  }

  skills.push(skill);
};

// update client's preparing state
// handles user inputs
var updatePreparing = function updatePreparing() {
  var user = players[hash];

  // dont check update if user is undefined
  if (!user) {
    return;
  }

  updated = false;
  var toggleReady = false;

  var checkKeyW = myKeys.keydown[myKeys.KEYBOARD.KEY_W] && !prevKeyDown.KEY_W;
  var checkKeyS = myKeys.keydown[myKeys.KEYBOARD.KEY_S] && !prevKeyDown.KEY_S;
  var checkKeyJ = myKeys.keydown[myKeys.KEYBOARD.KEY_J] && !prevKeyDown.KEY_J;

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
      toggleReady: toggleReady
    });
  }
};

// update client's playing state
// handles user inputs
var updatePlaying = function updatePlaying() {
  var user = players[hash];

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

// draw players (playing state)
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

// draw enemy (playing state)
var drawEnemy = function drawEnemy() {
  // check if enemy exist remove later when enemy build is all set up ?
  if (enemy) {
    var _enemy = enemy,
        pos = _enemy.pos,
        size = _enemy.size;

    ctx.save();
    ctx.fillStyle = 'rgb(255, 0, 255)';
    ctx.fillRect(pos.x - size.width / 2, pos.y - size.width / 2, size.width, size.height);
    ctx.restore();

    // enemy health bar
    var radius = Math.round((size.width + size.height) / 2) + 10;
    var color = { r: 255, g: 0, b: 0 };
    var sAngle = -Math.PI / 2;
    var eAngle = Math.PI * 2 * (enemy.hp / enemy.maxHp);
    drawStrokeCircle(pos, radius, color, 1, 2, sAngle, sAngle + eAngle, false);
  }
};

// draw bullets (playing state)
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
    if (sprite.type === 16) {
      ctx.drawImage(bullets16px, sprite.x * 16, sprite.y * 16, sprite.type, sprite.type, x, y, sprite.type, sprite.type);
    } else if (sprite.type === 32) {
      ctx.drawImage(bullets32px, sprite.x * 32, sprite.y * 32, sprite.type, sprite.type, x, y, sprite.type, sprite.type);
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
var drawText = function drawText(text, x) {
  var y = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 40;
  var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 30;
  var color = arguments[4];

  ctx.save();
  var alpha = color && color.a ? color.a : 1;
  ctx.fillStyle = color ? 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')' : 'white';
  ctx.font = size + 'px Arial';
  ctx.fillText(text, x, y);
  ctx.restore();
};

// draw player ready state (prepare state)
var drawPlayersReady = function drawPlayersReady() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 491, width - 2, 48);
  ctx.fillRect(1, 491, width - 2, 48);

  // draw player stats
  var keys = Object.keys(players);
  var rectWidth = width / 4 - 2;

  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];
    var x = 1 + i * (width / 4);

    if (player.ready) {
      ctx.fillStyle = 'green';
    } else {
      ctx.fillStyle = 'black';
    }
    ctx.strokeRect(x, 491, rectWidth, 48);
    ctx.fillRect(x, 491, rectWidth, 48);

    drawText(player.type, x + rectWidth / 2, 505, 18);
  }
  ctx.restore();
};

// draw class select (prepare state)
var drawSelectScreen = function drawSelectScreen() {
  var user = players[hash];
  var rectWidth = width / 4 - 2;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.strokeStyle = 'white';
  ctx.strokeRect(1, 1, rectWidth, height - 102);

  drawText('Classes', rectWidth / 2, 115, 24);

  // show highlight on current selected class
  // and set class stat image
  var classStatImage = void 0;
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
    ctx.drawImage(classStatImage, 2, 0, 478, 480, rectWidth + 2, 0, 480, 480);
  } else {
    var red = { r: 255, g: 0, b: 0 };
    drawText('Error: Unable to find class\'s stat', rectWidth + 240, 260, 20, red);
  }

  // label boxes with class names
  ctx.strokeRect(11, 160, rectWidth - 20, 58);
  drawText('Fighter', rectWidth / 2, 180, 20);

  ctx.strokeRect(11, 240, rectWidth - 20, 58);
  drawText('Bomber', rectWidth / 2, 260, 20);

  ctx.strokeRect(11, 320, rectWidth - 20, 58);
  drawText('Cleric', rectWidth / 2, 340, 20);

  ctx.strokeRect(11, 400, rectWidth - 20, 58);
  drawText('Aura', rectWidth / 2, 420, 20);

  // room name
  ctx.strokeRect(1, 1, rectWidth, 98);
  drawText('Room', rectWidth / 2, 20, 24);
  drawText(roomname.value, rectWidth / 2, 60, 20);

  ctx.restore();
};

// draw Hud (both states)
var drawHUD = function drawHUD(state) {
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
  var keys = Object.keys(players);
  var rectWidth = width / 4 - 2;

  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];
    var damageText = 'Damage: ' + player.minDamage + ' ~ ' + player.maxDamage;
    var x = 1 + i * (width / 4);

    ctx.strokeRect(x, 541, rectWidth, 98);
    if (state === 'preparing') {
      // temporary color for players
      var color = void 0;
      if (i === 0) {
        color = {
          r: 255,
          g: 0,
          b: 0
        };
      } else if (i === 1) {
        color = {
          r: 0,
          g: 255,
          b: 0
        };
      } else if (i === 2) {
        color = {
          r: 0,
          g: 255,
          b: 255
        };
      } else {
        color = {
          r: 255,
          g: 165,
          b: 0
        };
      }
      drawText(player.name, x + rectWidth / 2, 550, 18, color);
    } else if (state === 'playing') {
      drawText(player.name, x + rectWidth / 2, 550, 18, player.color);
      drawText(damageText, x + rectWidth / 2, 575, 12);
    }

    // draw skill icons
    var opacity = player.energy > player.skill1Cost ? 1 : 0.5;
    ctx.fillStyle = 'white';

    // skill box location
    ctx.strokeRect(x + rectWidth / 4, 595, 30, 30);
    ctx.strokeRect(x + rectWidth / 2 + 10, 595, 30, 30);

    if (player.type === 'fighter') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 0, 0, 42, 42, x + rectWidth / 4, 595, 30, 30);
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 42, 0, 42, 42, x + rectWidth / 2 + 10, 595, 30, 30);
      ctx.restore();
    } else if (player.type === 'bomber') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 0, 42, 42, 42, x + rectWidth / 4, 595, 30, 30);
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 42, 42, 42, 42, x + rectWidth / 2 + 10, 595, 30, 30);
      ctx.restore();
    } else if (player.type === 'cleric') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 0, 84, 42, 42, x + rectWidth / 4, 595, 30, 30);
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 42, 84, 42, 42, x + rectWidth / 2 + 10, 595, 30, 30);
      ctx.restore();
    } else if (player.type === 'aura') {
      // skill 1
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 0, 126, 42, 42, x + rectWidth / 4, 595, 30, 30);
      ctx.restore();

      opacity = player.energy > player.skill2Cost ? 1 : 0.5;

      // skill 2
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(skillIconImage, 42, 126, 42, 42, x + rectWidth / 2 + 10, 595, 30, 30);
      ctx.restore();
    }
  }
  ctx.restore();
};

// players can move and update ready state.
var preparing = function preparing(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePreparing();

  drawSelectScreen();
  drawPlayersReady();
  drawHUD(state);
};

// players can move, place bombs and see bombs
var playing = function playing(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlaying();
  updateSkills();

  drawEnemy();
  drawPlayers();
  drawSkills();
  drawBullets();
  drawHUD(state);
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

var roomRefresh = function roomRefresh(data) {
  console.log('got room lists');
  var keys = Object.keys(data);
  roomList.innerHTML = '';

  for (var i = 0; i < keys.length; i++) {
    var room = data[keys[i]];
    var content = '<div class="room__container"><h2>' + keys[i] + '</h2>';
    content += '<p>State: ' + room.state + '</p><p>Player(s): ' + room.count + '</p></div>';

    roomList.innerHTML += content;
  }
};

var setupSocket = function setupSocket() {
  // socket.emit('join');

  socket.on('hash', function (data) {
    console.log('got hash ' + data.hash);
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

  socket.on('startGame', function (data) {
    roomState = data.state;
    players = data.players;
    enemy = data.enemy;
    bullets = data.bullets;
    skills = [];
  });

  socket.on('update', handleUpdate);

  socket.on('addPlayer', addPlayer);

  socket.on('removePlayer', removePlayer);

  socket.on('levelPlayer', levelPlayer);

  socket.on('playerPreparing', function (data) {
    var player = players[data.hash];

    player.type = data.type;
    player.ready = data.ready;
  });

  socket.on('playerIsAlive', playerIsAlive);

  socket.on('playerAttacking', function (data) {
    if (data.isCritcal) {
      handleSkill('critcalAttack', data);
    } else {
      handleSkill('normalAttack', data);
    }
  });

  socket.on('playerUsedSkill', function (data) {
    handleSkill(data.skillName, data);
  });

  socket.on('roomList', roomRefresh);

  socket.on('changeRoomError', function (data) {
    isChangingRoom = false;
    console.log(data.msg);
  });

  socket.on('usernameError', function (data) {
    username.style.border = 'solid 1px red';
    isChangingRoom = false;
    console.log(data.msg);
  });
};

var init = function init() {
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

  // sidebar
  roomInfo = document.querySelector('.room__infos');
  roomList = document.querySelector('.room__list');
  refreshRooms = document.querySelector('.refresh__room');

  // event listeners
  changeRoom.addEventListener('click', function () {
    // if user is valid connect socket and emit join
    if (roomname.value && !isChangingRoom) {
      // prevent attempt to change room multiple times
      isChangingRoom = true;

      socket = io.connect();

      setupSocket();

      socket.emit('join', {
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
    // socket.emit('refreshRoom');
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
