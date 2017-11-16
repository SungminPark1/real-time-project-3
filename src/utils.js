const circlesDistance = (c1, c2) => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt((dx * dx) + (dy * dy));
  return distance;
};

const getRandomInt = (range, min = 0) => Math.floor((Math.random() * range) + min);

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

module.exports = {
  circlesDistance,
  getRandomInt,
  clamp,
};
