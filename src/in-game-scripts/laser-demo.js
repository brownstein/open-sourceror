const Laser = require("laser");
const Reflector = require("reflector");
// const solarpanel = require("solarpanel");

const l = new Laser({
  intensity: 1,
  relativePosition: {
    x: 16,
    y: 0
  },
  direction: {
    x: 1,
    y: 0
  }
});

const r = new Reflector([100, 0]);

// turn laser off after 5 seconds
setTimeout(() => l.off(), 1000);
setTimeout(() => l.on(), 1500);
setTimeout(() => l.off(), 2000);
setTimeout(() => {}, 5000);
