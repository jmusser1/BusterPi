/* BusterPi code for Raspberry Pi 3
Jim Musser 2017-05-07

Hardware:
  Adafruit Motorshield Hat PRODUCT ID: 2348
  Server Hat PRODUCT ID: 2327

npm install johnny-five
npm install raspi-io
npm install express
npm install http

*/

var raspi = require('raspi-io');
var five = require('johnny-five'),
  board = new five.Board({
    io: new raspi()
  }),
  PORT = 8888,
  WebSocketServer = require('ws').Server,
  localtunnel = require('localtunnel'),
  request = require('request'),
  networkInterfaces = require('os').networkInterfaces(),
  motors,
  arms,
  led = {};

var wss = new WebSocketServer({port: PORT});

// board setup
board.on('ready', function() {
//  var configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2({
//    address: 0x60
//  });

//create each motor
  //var left = new five.Motor(configs.M1);
  //var right = new five.Motor(configs.M2);
  //var armupdown = new five.Motor(configs.M3);
  //var arminout = new five.Motor(configs.M4);

  motors = {
    left: new five.Motor({
      pins: [8, 9, 10],
      controller: 'PCA9685',
      address: 0x60
    }),
    right: new five.Motor({
      pins: [13, 12, 11],
      controller: 'PCA9685',
      address: 0x60
    })
  };

  arms = {
    updown: new five.Motor({
      pins: [2, 3, 4],
      controller: 'PCA9685',
      address: 0x60
    }),
    inout: new five.Motor({
      pins: [7, 6, 5],
      controller: 'PCA9685',
      address: 0x60
    })
  };

  led = new five.Led(13);
});

// ws setup
wss.on('connection', function(ws) {
  ws.on('message', function(data, flags) {
    if(data === 'forward') {
      forward(255);
    } else if(data === 'reverse') {
      reverse(255);
    } else if(data === 'turnRight') {
      turnRight(255);
    } else if(data === 'turnLeft') {
      turnLeft(255);
    } else if(data === 'stop') {
      stop();
    } else if(data === 'blink') {
      blink();
    } else if(data === 'noBlink') {
      noBlink();
    } else if(data === 'up') {
      up();
    } else if(data === 'down') {
      down();
    } else if(data === 'close') {
      close();
    } else if(data === 'open') {
      open();
    }
  });

  ws.on('close', function() {
    console.log('WebSocket connection closed');
  });

  ws.on('error', function(e) {
    console.log('WebSocket error: %s', e.message);
  });

});

// motor functions
var stop = function() {
  motors.left.stop();
  motors.right.stop();
  motors.updown.stop();
  motors.inout.stop();
};

var forward = function(speed) {
  motors.left.forward(speed);
  motors.right.forward(speed);
};

var reverse = function(speed) {
  motors.left.reverse(speed);
  motors.right.reverse(speed);
};

var turnRight = function(speed) {
  motors.left.forward(speed);
  motors.right.reverse(speed);
};

var turnLeft = function(speed) {
  motors.left.reverse(speed);
  motors.right.forward(speed);
};

var up = function(speed) {
  arms.updown.forward(speed);
};

var down = function(speed) {
  arms.updown.reverse(speed);
};

var close = function(speed) {
  arms.inout.forward(speed);
};

var open = function(speed) {
  arms.inout.reverse(speed);
};

var blink = function() {
  led.strobe(300);
};

var noBlink = function() {
  led.stop();
};

// create localtunnel and send to the webapp
localtunnel(PORT, function(err, tunnel) {
  var webappURL = 'http://localhost:3000',
    localIP;

  console.log('localtunnel address is %s', tunnel.url);

  // local_ip is useful for debugging
  // use en0 if on mac while developing
  if(networkInterfaces.wlan0) {
    localIP = networkInterfaces.wlan0[0].address;
  } else {
    localIP = networkInterfaces.en0[1].address;
  }

  webappURL += '/locate?local_ip=' + localIP;
  webappURL += '&public_url=' + tunnel.url;

  request.post(webappURL, function(e, r, body) {
    if (err) {
      return console.error('POST request failed:', err);
    }
  });
});
