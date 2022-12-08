let predictions = [];

let video;
let handpose;

let allReady = false;

let brain;
let state = 'waiting';

let targetLabel;
let gestureTracker = [];

let settings;

function preload(){
  settings = loadJSON('../gestureSettings.json');
}

function keyPressed(){
  if(key == 's'){
    brain.saveData();
  }
  else if(gestureTracker.includes(key)){
    let i = gestureTracker.indexOf(key);
    targetLabel = settings.gestures[i];
    console.log('Collecting for : ' + targetLabel);
    state = 'collecting';
    setTimeout(function(){
      console.log('Done!');
      state = 'waiting';
    }, settings.collectionWindow);
  };
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
  
  handpose = ml5.handpose(video, hpOptions, handposeReady);
  
  for (let i = 0; i < settings.gestures.length; i++) {
    gestureTracker.push((i+1).toString());
  }

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
        if(state == 'collecting'){
          let brainInputs = [];
          const prediction = predictions[0];
          for (let j = 0; j < prediction.landmarks.length; j++) {
            const keypoint = prediction.landmarks[j];
            let x = keypoint[0];
            let y = keypoint[1];
            let z = keypoint[2];
            brainInputs.push(x);
            brainInputs.push(y);
            brainInputs.push(z);
          }
          let target = [targetLabel];
          brain.addData(brainInputs, target);
        }
      }
    };
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


function draw() {
  background(167, 125, 171);
  if(allReady){
    push();
    translate(width,0);
    scale(-1,1);
    image(video, 0,0, width, height);
    pop();
    drawKeypoints();
  }
  else{
    fill(255);
    textSize(42);
    text('🎐...loading', 190, height/2-10);
   }

  if(settings.debugGrid){
    drawGrid(settings.gridCols, settings.gridRows)
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

function drawGrid(gridCols, gridRows){
  push();
  strokeWeight(2);
  stroke(0,255,0);
  if(gridCols > 1){
    for (let i = 0; i < gridCols; i++) {
      let x = width/gridCols*i;
      line(x,0,x,height);
    };
  }
  if(gridCols > 1){
    for (let i = 0; i < gridRows; i++) {
      let x = height/gridRows*i;
      line(0,x,width,x);
    };
  }
  pop();
}