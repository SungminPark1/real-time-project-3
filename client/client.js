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
