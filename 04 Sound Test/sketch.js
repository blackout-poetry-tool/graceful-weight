function preload() {
    soundFormats('mp3', 'wav');
    let path = './sounds/'
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
  
  // ADSR params
  var attackLevel = 0.2;
  var releaseLevel = 0;
  
  var attackTime = 0.6;
  var decayTime = 0.4;
  var susPercent = 0.65;
  var releaseTime = 2.85;
  
  let baseEnv, baseNotes;
  let peakEnv, peakNotes;

  let melodyNotes, melodyInterval;

  
  function setup() {

    baseNotes = [note_base_1, note_base_2, note_base_3, note_base_4];
    peakNotes = [note_peak_1, note_peak_2, note_peak_3, note_peak_4];
    melodyNotes = [notes_C, notes_G, notes_B, notes_Cc];

    console.dir(melodyNotes);

    
    createCanvas(300, 300);
    background(0);

    let soundButton = createButton('Begin Sound');
    soundButton.id('soundbutton');
    soundButton.mouseClicked(playSoundScape.bind(this, 1));
  }


  function playSoundScape(act_count){
    console.log(act_count);
    userStartAudio();
    console.log("..and go");

    baseEnv = new p5.Envelope();
    baseEnv.setADSR(attackTime, decayTime, susPercent, releaseTime);
    baseEnv.setRange(attackLevel, releaseLevel);

    baseNotes[act_count-1].loop();
    baseEnv.setInput(baseNotes[act_count-1]);
    baseEnv.triggerAttack();
    playMelody(act_count-1);
  }

  function playSilence(){
    if(baseEnv){
    baseEnv.triggerRelease();
    }
    if(peakEnv){
    peakEnv.triggerRelease();
    }
    clearInterval(melodyInterval);
  }

  let noteCount=1;
//   let cancelChorusFlag = false;

  function playMelody(act_count){
    let noteSet = melodyNotes[act_count];
    console.dir(noteSet); 
    melodyInterval = setInterval(function(){
        let noteToPlay = random(['high','mid','mid', 'mid']);
        console.log(noteSet[noteCount][noteToPlay]);
        noteSet[noteCount][noteToPlay].play();
    },2600);
  }

//   function playChorus(act_count){
//     let noteSet = melodyNotes[act_count];
//     console.log("playing chorus");
//     noteSet[1]['high'].play();
//     noteSet[3]['high'].play();
//      setTimeout(function(){
//         if(!cancelChorusFlag){
//             noteSet[1]['high'].play();
//             noteSet[4]['high'].play();
//             noteSet[2]['high'].play();
//         }
//         },1800);
//   }

//   function cancelChorus(act_count){
//     cancelChorusFlag = true;
//     playMelody(act_count-1);
//   }

  function playChorus(act_count, hold_stage){
    let noteSet = melodyNotes[act_count-1];
    if(hold_stage == 1){
    console.log("playing chorus 1");
        noteSet[1]['high'].play();
        noteSet[3]['high'].play();
    }
    else if(hold_stage == 2){
        console.log("playing chorus 2");
        noteSet[1]['high'].play();
        noteSet[4]['high'].play();
        noteSet[2]['high'].play();
    }
    else if(hold_stage == 3){
        peakEnv = new p5.Envelope();
        peakEnv.setADSR(attackTime, decayTime, susPercent, 1.83);
        peakEnv.setRange(attackLevel, releaseLevel);
        
        peakNotes[act_count-1].loop();
        peakEnv.setInput(peakNotes[act_count-1]);

        peakEnv.triggerAttack();
        clearInterval(melodyInterval);
        if(baseEnv){
        baseEnv.triggerRelease();
        }
    }
  }
  
//   function playPeak(act_count, chorus_flag = true){
//     peakEnv = new p5.Envelope();
//     let peakDelay = 0;
//     clearInterval(melodyInterval);
//     if(chorus_flag){
//     playChorus(act_count-1);
//     peakDelay = 3600;
//     }
//     setTimeout(function(){
//         if(!cancelChorusFlag){
//             peakEnv.setADSR(attackTime, decayTime, susPercent, 1.83);
//             peakEnv.setRange(attackLevel, releaseLevel);

//             peakNotes[act_count-1].loop();
//             peakEnv.setInput(peakNotes[act_count-1]);

//             peakEnv.triggerAttack();
//             if(baseEnv){
//             baseEnv.triggerRelease();
//             }
//         }
//     },peakDelay);
//   }
  
//   let i, baseInterval;
  
//   function playEnv() {
//     userStartAudio();
//     console.log("clicked");
//     let i = 0;
//     baseInterval = setInterval(function(){
//         i++;
//         if(i<5){
//         baseEnv = new p5.Envelope();
//         baseEnv.setADSR(attackTime, decayTime, susPercent, releaseTime);
//         baseEnv.setRange(attackLevel, releaseLevel);
//         baseNotes[i-1].loop();
//         baseEnv.setInput(baseNotes[i-1]); //P5 -> clearInputs to reset new inputs;
//         console.log("starting base"+i);
//         baseEnv.triggerAttack();
//         setTimeout(function(){
//             baseEnv.triggerRelease();
//         },3000);    
//         console.dir(baseEnv);
//         }
//         else{
//             console.log("the end");
//             clearInterval(baseInterval);
//         };
//     }, 5000);

//   }
  
//   function stopEnv() {
//     console.log("you ended it :(");
//     clearInterval(baseInterval);
//     baseEnv.triggerRelease();
//   }
  