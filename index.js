//// Import Modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const cors = require('cors');

const {
    createCanvas,
    loadImage
} = require('canvas')
const fs = require('fs')

require('custom-env').env(true);




//// posenet
// import posenet from '@tensorflow-models/posenet';
const tf = require('@tensorflow/tfjs-node');
const posenet = require('@tensorflow-models/posenet');
async function estimatePoseOnImage(imageElement) {
    const net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: {
            width: 1280,
            height: 720
        },
        multiplier: 0.75
    });

    const pose = await net.estimateMultiplePoses(imageElement, {
        flipHorizontal: false
    });
    return pose;
}




function randomNoRepeats(array) {
  var copy = array.slice(0);
  return function() {
    if (copy.length < 1) { copy = array.slice(0); }
    var index = Math.floor(Math.random() * copy.length);
    var item = copy[index];
    copy.splice(index, 1);
    return item;
  };
}




//// canvas
const canvas = createCanvas(1280, 720);
const ctx = canvas.getContext('2d');

//// node-webcam (for testing)
const NodeWebcam = require("node-webcam");
var opts = {
    width: 1280,
    height: 720,
    quality: 100,
    saveShots: true,
    output: "png",
    device: false,
    callbackReturn: "location",
    verbose: true
};
var Webcam = NodeWebcam.create(opts);
Webcam.capture( "test_picture", function( err, data ) {
    console.log(data);
    loadImage(data).then(async (image) => {
        console.log("image", image);
        ctx.drawImage(image, 0, 0);
        var poses = await estimatePoseOnImage(canvas);


        // console.log(pose)

        var colors = ["#ffe900", "#ff3900", "cyan", "#18e074", "#359aff"];
        var chooser = randomNoRepeats(colors);


        for (var i = 0; i < poses.length; i ++) {
            var pose = poses[i];
            var score = pose.score;
            console.log(i, score);
            var points = pose.keypoints

            if (score > 0.25) {
                ctx.beginPath()

                for (var j = 0; j < points.length; j++) {
                    var point = points[j];
                    var coords = point.position;
                    // console.log(point);

                    ctx.lineTo(coords.x, coords.y)
                }

                ctx.strokeStyle = chooser();
                ctx.lineWidth = 2;
                ctx.stroke()
                ctx.closePath()
            }
        }

        const out = fs.createWriteStream(__dirname + '/points.png')
        const stream = canvas.createPNGStream()
        stream.pipe(out)
        out.on('finish', () =>  console.log('The PNG file was created.'))


        // var keypoints = pose.keypoints;
        // ctx.beginPath()
        // for (var i = 0; i < keypoints.length; i++) {
        //     var coords = keypoints[i].position;
        //     console.log();
        //     ctx.lineTo(coords.x, coords.y)
        // };
        // ctx.stroke()
        //
        // const out = fs.createWriteStream(__dirname + '/points.png')
        // const stream = canvas.createPNGStream()
        // stream.pipe(out)
        // out.on('finish', () =>  console.log('The PNG file was created.'))


    })
} );



//// realsense
const rs2 = require('node-librealsense');
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');

function drawPointCloud(win, color, points) {
  win.beginPaint();
  if (points.vertices && points.textureCoordinates ) {
    let count = points.size;
    glfw.drawDepthAndColorAsPointCloud(
        win.window,
        new Uint8Array(points.vertices.buffer),
        count,
        new Uint8Array(points.textureCoordinates.buffer),
        color.data,
        color.width,
        color.height,
        'rgb8');
  }
  win.endPaint();
}

// // Open a GLFW window
// const win = new GLFWWindow(1280, 720, 'Node.js PointCloud Example');
// const pc = new rs2.PointCloud();
// const pipeline = new rs2.Pipeline();
//
// pipeline.start();
//
// console.log('Drag to change perspective, scroll mouse wheel to zoom in/out.');
//
// while (! win.shouldWindowClose()) {
//   const frameSet = pipeline.waitForFrames();
//   const pointsFrame = pc.calculate(frameSet.depthFrame);
//   pc.mapTo(frameSet.colorFrame);
//   drawPointCloud(win, frameSet.colorFrame, pointsFrame);
// }
//
// pc.destroy();
// pipeline.stop();
// pipeline.destroy();
// win.destroy();
//
// rs2.cleanup();


// A GLFW Window to display the captured image
const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

// Colorizer is used to map distance in depth image into different colors
const colorizer = new rs2.Colorizer();

// The main work pipeline of camera
const pipeline = new rs2.Pipeline();

// Start the camera
pipeline.start();

while (! win.shouldWindowClose()) {
  const frameset = pipeline.waitForFrames();
  // Build the color map
  const depthMap = colorizer.colorize(frameset.depthFrame);
  if (depthMap) {
    // Paint the images onto the window
    win.beginPaint();
    const color = frameset.colorFrame;
    glfw.draw2x2Streams(win.window, 2,
        depthMap.data, 'rgb8', depthMap.width, depthMap.height,
        color.data, 'rgb8', color.width, color.height);
    win.endPaint();
  }
}

pipeline.stop();
pipeline.destroy();
win.destroy();
rs2.cleanup();



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


    io.emit("global-init", {
        msg: "welcome"
    });


    //// socket badge scan
    client.on('badgeScanned', function(data, returnData) {
        console.log("badge scan event");
        getUserFromBadge(endpoint1, data, function(output) {
            console.log(endpoint1, output);
            returnData(output);
        });

    });
});
