const circlesDistance = (c1, c2) => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt((dx * dx) + (dy * dy));
  return distance;
};

const getRandomInt = (range, min = 0) => Math.floor((Math.random() * range) + min);

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// include victor and do unit vector through that
const getRandomUnitVector = () => {
  let x = (Math.random() * 2) - 1;
  let y = (Math.random() * 2) - 1;
  let length = Math.sqrt((x * x) + (y * y));

  if (length === 0) { // very unlikely
    x = 1; // point right
    y = 0;
    length = 1;
  } else {
    x /= length;
    y /= length;
  }

  return { x, y };
};

module.exports = {
  circlesDistance,
  getRandomInt,
  getRandomUnitVector,
  clamp,
};
