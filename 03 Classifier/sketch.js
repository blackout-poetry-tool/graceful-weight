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


// PRELOAD SOUNDS + SETTINGS
function preload() {
  settings = loadJSON('../gestureSettings.json');

  soundFormats('mp3', 'wav');
  let path = 'sounds/'
  //bases
  note_base_1 = loadSound(path+'A_Base_C.wav');
  note_base_2 = loadSound(path+'B_Base_G.wav');
  note_base_3 = loadSound(path+'C_Base_B.wav');
  note_base_4 = loadSound(path+'D_Base_Cc.wav');
  //peaks
  note_peak_1 = loadSound(path+'A_Peak_C.wav');
  note_peak_2 = loadSound(path+'B_Peak_G.wav');
  note_peak_3 = loadSound(path+'C_Peak_B.wav');
  note_peak_4 = loadSound(path+'D_Peak_Cc.wav');

  //melodies
  notes_C = {
      '1':{
          high: loadSound(path+'003_C.a_1.wav'),
          mid: loadSound(path+'003_C.a_2.wav'),
          low: loadSound(path+'003_C.a_3.wav')
      },
      '2':{
          high: loadSound(path+'004_C.b_1.wav'),
          mid: loadSound(path+'004_C.b_2.wav'),
          low: loadSound(path+'004_C.b_3.wav')
      },
      '3':{
          high: loadSound(path+'005_C.c_1.wav'),
          mid: loadSound(path+'005_C.c_2.wav'),
          low: loadSound(path+'005_C.c_3.wav')
      },
      '4':{
          high: loadSound(path+'006_C.d_1.wav'),
          mid: loadSound(path+'006_C.d_2.wav'),
          low: loadSound(path+'006_C.d_3.wav')
      }
  }

  notes_G = {
      '1':{
          high: loadSound(path+'007_G.a_1.wav'),
          mid: loadSound(path+'007_G.a_2.wav'),
          low: loadSound(path+'007_G.a_3.wav')
      },
      '2':{
          high: loadSound(path+'008_G.b_1.wav'),
          mid: loadSound(path+'008_G.b_2.wav'),
          low: loadSound(path+'008_G.b_3.wav')
      },
      '3':{
          high: loadSound(path+'009_G.c_B.a_1.wav'),
          mid: loadSound(path+'009_G.c_B.a_2.wav'),
          low: loadSound(path+'009_G.c_B.a_3.wav')
      },
      '4':{
          high: loadSound(path+'010_G.d_B.b_CC.a_1.wav'),
          mid: loadSound(path+'010_G.d_B.b_CC.a_2.wav'),
          low: loadSound(path+'010_G.d_B.b_CC.a_3.wav')
      }
  }
  
  notes_B = {
      '1':{
          high: notes_G['3'].high,
          mid: notes_G['3'].mid,
          low: notes_G['3'].low
      },
      '2':{
          high: notes_G['4'].high,
          mid: notes_G['4'].mid,
          low: notes_G['4'].low
      },
      '3':{
          high: loadSound(path+'011_B.c_CC.b_1.wav'),
          mid: loadSound(path+'011_B.c_CC.b_2.wav'),
          low: loadSound(path+'011_B.c_CC.b_3.wav')
      },
      '4':{
          high: loadSound(path+'012_B.d_CC.c_1.wav'),
          mid: loadSound(path+'012_B.d_CC.c_2.wav'),
          low: loadSound(path+'012_B.d_CC.c_3.wav')
      }
  }

  notes_Cc = {
      '1':{
          high: notes_G['4'].high,
          mid: notes_G['4'].mid,
          low: notes_G['4'].low
      },
      '2':{
          high: notes_B['3'].high,
          mid: notes_B['3'].mid,
          low: notes_B['3'].low
      },
      '3':{
          high: notes_B['4'].high,
          mid: notes_B['4'].mid,
          low: notes_B['4'].low
      },
      '4':{
          high: loadSound(path+'013_CC.d_1.wav'),
          mid: loadSound(path+'013_CC.d_2.wav'),
          low: loadSound(path+'013_CC.d_3.wav')
      }
  }

}

let predictions = [];

let video;
let handpose;

let allReady = false;

let brain;

let targetLabel;
let gestureTracker = [];

let signal = '...waiting on camera';


let settings;


function setup() {
  createCanvas(640, 480);
  frameRate(60);
  video = createCapture(VIDEO);
  video.size(width,height);
  video.hide();

  baseNotes = [note_base_1, note_base_2, note_base_3, note_base_4];
  peakNotes = [note_peak_1, note_peak_2, note_peak_3, note_peak_4];
  melodyNotes = [notes_C, notes_G, notes_B, notes_Cc];

  let soundButton = createButton("Conduct Orchestra");
  soundButton.id('soundbutton');
  // soundButton.mouseClicked(playSoundScape.bind(this, 1));
  soundButton.mouseClicked(conductNow);

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
              soundManager();
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
        soundManager();
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

// ADSR params
var attackLevel = 0.2;
var releaseLevel = 0;
  
var attackTime = 0.6;
var decayTime = 0.4;
var susPercent = 0.4;
var releaseTimeBase = 2.85;
var releaseTimePeak = 0.85;
  
let baseEnv = null, baseNotes;
let peakEnv = null, peakNotes;

let melodyNotes, melodyInterval;
var noteCount=1;


let orchestra = {
  'act': 1,
  'baseline': true,
  'melody': true,
  'solo': false,
  'chord_A': false,
  'chord_B': false,
  'peak': false
}

let isPlaying = {
  'baseline':false,
  'melody': false,
  'peak': false
}

function conductNow(){
  let act = orchestra['act']-1;
  //BASELINE
  console.log("CONDUCTOR CALLED");
  if(orchestra['baseline'] && !isPlaying['baseline']){
    console.log('BASELINE TRIGGERED');
    userStartAudio();
    baseEnv = new p5.Envelope();
    baseEnv.setADSR(attackTime, decayTime, susPercent, releaseTimeBase);
    baseEnv.setRange(attackLevel, releaseLevel);
    
    // console.log(baseNotes[act]);
    baseNotes[act].loop();
    // baseNotes[act].setVolume(0.4);
    baseEnv.setInput(baseNotes[act]);
    baseEnv.triggerAttack();
    isPlaying['baseline'] = true;
  }
  else if(!orchestra['baseline'] && isPlaying['baseline']){
    baseEnv.triggerRelease();
    isPlaying['baseline'] = false;
    console.log("BASELINE STOPPED");
  };

  //MELODY
  if(orchestra['melody'] && !isPlaying['melody']){
    console.log('MELODY TRIGGERED');
    isPlaying['melody'] = true;
    let noteSet = melodyNotes[act];
    melodyInterval = setInterval(function(){
        let noteToPlay = random(['mid','mid','mid', 'low','low']);
        noteSet[noteCount][noteToPlay].setVolume(0.5);
        noteSet[noteCount][noteToPlay].play();
        // console.log("Note "+ noteCount);
    }, 1200);
  }
  else if(!orchestra['melody'] && isPlaying['melody']){
    clearInterval(melodyInterval);
    isPlaying['melody'] = false;
    console.log("MELODY STOPPED");
  }

  //SOLO
  if(orchestra['solo']){
    console.log('SOLO TRIGGERED');
    let noteSet = melodyNotes[act];
    let noteToPlay = random(['mid','mid','mid', 'low','low']);
    noteSet[noteCount][noteToPlay].play();
    orchestra['solo'] = false;
  }

  // CHORD_A
  if(orchestra['chord_A']){
    let noteSet = melodyNotes[act];
    console.log("CHORUS 1 TRIGGERED");
      noteSet[1]['low'].play();
      noteSet[3]['mid'].play();
      orchestra['chord_A'] = false;
  }

  // CHORD_B
  if(orchestra['chord_B']){
    let noteSet = melodyNotes[act];
    console.log("CHORUS 2 TRIGGERED");
      noteSet[1]['low'].play();
      noteSet[2]['low'].play();
      noteSet[4]['low'].play();
      orchestra['chord_B'] = false;
  }

  //PEAK
  if(orchestra['peak'] && !isPlaying['peak']){
    console.log('PEAK TRIGGERED');
    userStartAudio();
    peakEnv = new p5.Envelope();
    peakEnv.setADSR(attackTime, decayTime, susPercent, releaseTimePeak);
    peakEnv.setRange(attackLevel, releaseLevel);

    peakNotes[act].loop();
    peakEnv.setInput(peakNotes[act]);
    peakEnv.triggerAttack();
    isPlaying['peak'] = true;
  }
  else if(!orchestra['peak'] && isPlaying['peak']){
    peakEnv.triggerRelease();
    isPlaying['peak'] = false;
    console.log("PEAK STOPPED");
  };

}

let flowBar = 0;
let flowBarInterval;

function manageFlowBar(direction){
  flowBarInterval = setInterval(function(){
    if(direction == -1){
      flowBar -= 10;
    }else{
      flowBar += 10;
    }
    flowBar = constrain(flowBar,0,140);
    // console.log("BAR: :"+flowBar);
  },300);
}

let interval_open, interval_nohand, interval_close;
let setHandDist = null;
let increment = 60;
let newSession = true;

let silenceFlag = false;
let disableInput = false;

function soundManager(){
  if(allReady && !disableInput){
    clearInterval(flowBarInterval);
    clearInterval(interval_open);
    clearInterval(interval_nohand);
    clearInterval(interval_close);

    if(oscMessage == settings.gestures[0]){
      console.log("SOUND CHECKER: FIRST OPEN");
      manageFlowBar(-1);
      manageSilence();
      setTimeout(function(){
        if(newSession){
          setHandDist = getHandDistance();
          newSession = false;
          console.log("New Hand Pos: "+ setHandDist);
        }
      },800);
      interval_open = setInterval(function(){  
        if(setHandDist!=null){
          let gap = setHandDist - getHandDistance();
          // console.log(gap);
          if(gap<200){
            noteCount = 2;
          }
          else if(gap>=150 && gap<400){
            noteCount = 3;
          }
          else if(gap>=500){
            noteCount = 4;
          }
        }
      }, 50);
    }
    else if(oscMessage == settings.gestures[1]){
      console.log("SOUND CHECKER: CLOSE");
      orchestra['melody'] = false;
      if(!isPlaying['baseline']){
        orchestra['baseline'] = true;
      }
      conductNow();
      manageFlowBar(1);
      interval_close = setInterval(function(){
        if(flowBar == 10){
          orchestra['chord_A'] = true;
          conductNow();
        }
        if(flowBar == 60){
          orchestra['chord_B'] = true;
          conductNow();
        }
        if(flowBar > 90){
          if(!isPlaying['peak']){
          orchestra['peak'] = true;
          conductNow();
          }
        }
        if(flowBar > 100){
          if(isPlaying['baseline']){
            orchestra['baseline'] = false;
            conductNow();
          }
        }
        if(flowBar == 140){
          console.log("SILENCE FLAG TRIGGERED");
          silenceFlag = true;
        }
      },300);
    }
    else{
      console.log("SOUND CHECKER: NO HAND");
      manageFlowBar(-1);
      noteCount = 1;
      let secondsPassed = 0;
      manageSilence();
      interval_nohand = setInterval(function(){  
        secondsPassed++;
        console.log(secondsPassed);
        if(secondsPassed == 3){
          newSession = true;
          clearInterval(interval_nohand);
        }
      }, 3700);
    }
  }
}


function getHandDistance(){
  if(predictions.length > 0){
    let points = predictions[0].landmarks;
    let totalLength = 0;
    for (let i = 0; i < points.length-1; i++) {
      let d = dist(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
      totalLength += d;        
    }
    return totalLength;
  }
  else{ 
    return 0;
  }
}

function manageSilence(){
  if(silenceFlag){
    disableInput = true;
    if(orchestra['act'] == 4){
      orchestra['act'] = 0;
    }
    orchestra['act']++;
    orchestra['peak'] = false;
    conductNow();
    setTimeout(function(){
      if(!isPlaying['baseline']){
        orchestra['baseline'] = true;
      }
      if(!isPlaying['melody']){
        orchestra['melody'] = true;
      }
      if(isPlaying['peak']){
        orchestra['peak'] = false;
      }
      silenceFlag = false;
    },2500);
    setTimeout(function(){
      disableInput = false;
      soundManager();
    },3500);
  }
  else if(!silenceFlag){
    if(!isPlaying['baseline']){
      orchestra['baseline'] = true;
    }
    if(!isPlaying['melody']){
      orchestra['melody'] = true;
    }
    if(isPlaying['peak']){
      orchestra['peak'] = false;
    }
  }
  conductNow();
}



/*
NOTES FOR L8er
 - Add flukecheck to messagemanager call?
*/
