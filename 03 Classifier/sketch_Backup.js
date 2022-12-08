// SOCKET
var socket = io('http://127.0.0.1:8081');
socket.on('connect', function() {
     // sends to socket.io server the host/port of oscServer
     // and oscClient
     socket.emit('config',
         {
             server: {
                 port: 3333,
                 host: '127.0.0.1'
             },
             client: {
                 port: 3334,
                 host: '127.0.0.1'
             }
         }
     );
 });


let predictions = [];

let video;
let handpose;

let allReady = false;

let brain;

let targetLabel;
let gestureTracker = [];

let signal = '...waiting on camera';


let settings;

function preload(){
  settings = loadJSON('../gestureSettings.json');
}

function setup() {
  createCanvas(640, 480);
  frameRate(60);
  video = createCapture(VIDEO);
  video.size(width,height);
  video.hide();

  const hpOptions = {
    flipHorizontal: true
  };

  let brainOptions = {
    inputs: 63,
    outputs: settings.gestureCount,
    task: 'classification',
    debug: true
  }
  brain = ml5.neuralNetwork(brainOptions);
  
  const modelDetails = {
    model: 'model/model.json',
    metadata: 'model/model_meta.json',
    weights: 'model/model.weights.bin'
  }
  brain.load(modelDetails, brainmodelReady);
  
  handpose = ml5.handpose(video, hpOptions, handposeReady);
  
  for (let i = 0; i < settings.gestures.length; i++) {
    gestureTracker.push((i+1).toString());
  }

}

function brainmodelReady(){
  console.log("handpose classsification ready");
  classifyHand();
  //messageManager();
}

function classifyHand(){
  if(predictions.length>0){
    let handInputs = [];
    const prediction = predictions[0];
    for (let j = 0; j < prediction.landmarks.length; j++) {
      const keypoint = prediction.landmarks[j];
      let x = keypoint[0];
      let y = keypoint[1];
      let z = keypoint[2];
      handInputs.push(x);
      handInputs.push(y);
      handInputs.push(z);
    }
  brain.classify(handInputs, gotResults);
  }
  else{
    messageManager();
    if(allReady){
      signal = 'no hand';
    }
    setTimeout(classifyHand, 100);
  }
}

function gotResults(error, results){
  // console.log(results[0].label);
  signal = results[0].label;
  messageManager();
  classifyHand();
}

function handposeReady(){
  handpose.on('hand', handPredict);
  allReady = true;
  // console.log('Handpose Ready');
}

function handPredict(results){
    predictions = [];
    if(results.length>0){
      // noFlukes(results);
      if(noFlukes(results)){
        // console.log("no fluke");
        predictions = results;
      }
    }
}

function noFlukes(results){
  let points = results[0].landmarks;
  let totalLength = 0;
  for (let i = 0; i < points.length-1; i++) {
    let d = dist(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
    totalLength += d;        
  }
  if(totalLength>settings.flukeDist){
    return 1;
  }
  else{
    // console.log("..a fluke");
    return 0;
  };
}

let prevSignal = '...';
let timer;
let flukeCount = 0;
let changeFlag = 0;
let oscMessage = '...';
 
function messageManager(){
  if(signal != prevSignal){
    prevSignal = signal;

    if(signal == 'no hand'){
      changeFlag = 0;
      timer = setInterval(function(){
          flukeCount++;
          // console.log("flukeCount: "+flukeCount);
          if(flukeCount == settings.flukeWindow){
            if(oscMessage!=prevSignal){
              oscMessage = prevSignal;
              sendOSCMessage(oscMessage);
              console.log(oscMessage);
            }
            flukeCount = 0;
            clearInterval(timer);
          }
          else if(changeFlag){
            flukeCount = 0;
            clearInterval(timer);
          }
        },10);
      }
    else{
      changeFlag = 1;
      if(oscMessage!=prevSignal){
        oscMessage = prevSignal;
        sendOSCMessage(oscMessage);
        console.log(oscMessage);
      }
    }
  }
}

function draw() {
  background(36, 57, 94);
  if(allReady){
    if(settings.debugStream){
      push();
      translate(width,0);
      scale(-1,1);
      image(video, 0,0, width, height);
      pop();
      drawKeypoints();
    }
    fill(255);
    textSize(42);
    text(signal, 190, height/2-10);
  }
  else{
    fill(255);
    textSize(42);
    text('🎐...loading', 190, height/2-10);
   }
}

function drawKeypoints() {
  if(predictions.length>0){
      const prediction = predictions[0];
      for (let j = 0; j < prediction.landmarks.length; j++) {
        const keypoint = prediction.landmarks[j];
        fill(255,0,0);
        noStroke();
        ellipse(keypoint[0], keypoint[1], 8, 8);
      }
  };
}

function sendOSCMessage(message){
  if(allReady){
    if(message == settings.gestures[0]){
      socket.emit('message', ['/gesture',1]);
    }
    else if(message == settings.gestures[1]){
      socket.emit('message', ['/gesture',2]);
    }
    else{
      socket.emit('message', ['/gesture',0]);
    }
  }
}