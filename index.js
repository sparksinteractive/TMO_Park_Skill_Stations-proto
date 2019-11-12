//// Import Modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const cors = require('cors');
require('custom-env').env(true);


//// posenet
import * as posenet from '@tensorflow-models/posenet';
async function estimatePoseOnImage(imageElement) {
  // load the posenet model from a checkpoint
  const net = await posenet.load();

  const pose = await net.estimateSinglePose(imageElement, {
    flipHorizontal: false
  });
  return pose;
}

const imageElement = document.getElementById('cat');
const pose = estimatePoseOnImage(imageElement);
console.log(pose);




const net = await posenet.load({
  architecture: 'MobileNetV1',
  outputStride: 16,
  inputResolution: { width: 640, height: 480 },
  multiplier: 0.75
});


//// Express Init
const app = express();
const port = parseInt(process.env.PORT, 10) || 8000;
app.set('port', port);
console.log("listening on port:", port);
console.log("environment:", process.env.NODE_ENV)

const server = http.createServer(app);
server.listen(port);


//// CORS Setup
app.use(cors())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//// parse requests
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));


//// Express static root
app.use("/", express.static(__dirname + '/dist/')); // Serve dist folder through express instead of NGINX


//// Socket Setup
const io = require('socket.io')(server);


//// Socket Init
io.on('connection', function(client) {
    console.log("connection");
    client.on('join', function(handshake) {
        console.log(handshake);
    });


    io.emit("global-init", {msg:"welcome"});


    //// socket badge scan
    client.on('badgeScanned', function(data, returnData) {
        console.log("badge scan event");
        getUserFromBadge(endpoint1, data, function(output) {
            console.log(endpoint1, output);
            returnData(output);
        });

    });
});
