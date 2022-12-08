let brain;

let dropArea;
let button;

let settings;

function preload(){
  settings = loadJSON('../gestureSettings.json');
}

function setup() {
  noCanvas();

  let brainOptions = {
    inputs: 63,
    outputs: settings.gestureCount,
    task: 'classification',
    debug: true
  }
  brain = ml5.neuralNetwork(brainOptions);

  button = createButton('Begin Training');
  button.id('trainbutton');
  button.mousePressed(startTraining);
}

function startTraining(){
  brain.loadData('model.json', dataReady);
}

function dataReady(){
  brain.normalizeData();
  brain.train({epochs: 80}, finished);
}

function finished(){
  console.log('model trained');
  brain.save();
}

function draw() {

}