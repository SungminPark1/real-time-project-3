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
