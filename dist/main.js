// sizing and resizing dynamically is happening in css #mycanvas and #parentdiv - overrides what's happening in here

//look at correct way to tie images and sound in tone

// is the site in fact going at half speed?

// better touch and mouse implementation

//save to bring up a clearer dialogue

let theVolume = -24;
let seqSteps = 8;
let seqRows = 8;
let seqRowIncrement; // defined in setup
let seqRowPosition; // defined in setup
let radius; // radius of the buttons for looper and save button

let seqObject = {};
for(let i = 0; i < seqRows; i++){
  seqObject[`row${i}`] = new Array ();
}

let soundOn = false; // have we instigated Tone.start() yet? (needed to allow sound)

let seqOn, seqOff, seqStep1, seqStep2; // to store images in

let seqWidth;
let seqHeight;

let one = 'snapeLoop1';
let two = 'snapeLoop2';
let three = 'snapeLoop3';
let four = 'snapeLoop4';
let five = 'snapeLoop5';
let six = 'snapeLoop6';

let stepName = new Array;

for(let i = 0; i < seqRows; i++){
  stepName[i] = `snapeStep${i}`;
}

let seqPlayers = new Array;

for(let i = 0; i < seqRows; i++){
  seqPlayers[i] = new Tone.Player().toDestination();
}

let seqBuffers = new Array;

let originalTempo = 20;
Tone.Transport.bpm.value = originalTempo;
Tone.Transport.loopEnd.value = "8m";
console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);

let slower;
let faster;
let save;

let bpmShow = false;

let bpmTextSize;
let saveTextSize;
let speedTextSize;

let cnvDimension;

let saveText;

let inp;

let myJSON;

function preload() {
  seqOn = loadImage(`/images/triangleOn.png`);
  seqOff = loadImage(`/images/triangleOff.png`);
  seqStep1 = loadImage(`/images/triangleStep1.png`);
  seqStep2 = loadImage(`/images/triangleStep2.png`);

  for(let i = 0; i < seqRows; i++){
    seqBuffers[i] = new Tone.ToneAudioBuffer(`/sounds/${stepName[i]}.mp3`)
  }

}

function setup() {  // setup p5

  let masterDiv = document.getElementById("container");
  let divPos = masterDiv.getBoundingClientRect(); //The returned value is a DOMRect object which is the smallest rectangle which contains the entire element, including its padding and border-width. The left, top, right, bottom, x, y, width, and height properties describe the position and size of the overall rectangle in pixels.
  let masterLeft = divPos.left; // distance from left of screen to left edge of bounding box
  let masterRight = divPos.right; // distance from left of screen to the right edge of bounding box
  cnvDimension = masterRight - masterLeft; // size of div -however in some cases this is wrong, so i am now using css !important to set the size and sca;ing - but have kept this to work out size of other elements if needed

  console.log("canvas size = " + cnvDimension);

  let cnv = createCanvas(cnvDimension, cnvDimension); // create canvas - because i'm now using css size and !important this sizing actually reduntant
  cnv.id('mycanvas'); // assign id to the canvas so i can style it - this is where the css dynamic sizing is applied
  cnv.parent('p5parent'); //put the canvas in a div with this id if needed - this also needs to be sized

  // *** add vanilla JS event listeners for touch which i want to use in place of the p5 ones as I believe that they are significantly faster
  let el = document.getElementById("p5parent");
  el.addEventListener("click", handleClick);

  noStroke(); // no stroke on the drawings

  radius = width/14;
  seqWidth = width/13;
  seqHeight = width/13;
  seqRowIncrement = height/11; // how close are the rows to each other?
  seqRowPosition = (height/9) * 2; // where is the sequencer positioned on the y axis?
  speed_text_y =  height/10*9.5;
  bpmTextSize = width/8;
  speedTextSize = width/8;
  saveTextSize = width/16;
  slower = ({
    x: width/10,
    y: height/10*0.8,
    text: '-',
    colour: 'rgba(255, 255, 255, 0.9)'
  });
  faster = ({
    x: width/10*9,
    y: height/10*0.8,
    text: '+',
    colour: 'rgba(255, 255, 255, 0.9)'
  });
  save = ({
    x: width/2,
    y: height/10*0.75,
    text: 'Save',
    colour: 'rgba(255, 255, 255, 0.9)',
    status: false
  });

  welcomeScreen(); // initial screen for project - also allows an elegant place to put in the Tone.start() command.
                    // if animating put an if statement in the draw() function otherwise it will instantly overide it
  createButtonPositions(); // generate the default array info depending on number of buttons

  inp = createInput(([saveText]));
  inp.id("myInput");
  inp.parent('p5parent');
  inp.position(cnvDimension/4, cnvDimension/2);
  inp.size(cnvDimension/2);
  inp.hide();
}

function welcomeScreen() {
  background(150); // background is grey (remember 5 is maximum because of the setup of colorMode)
  textSize(cnvDimension/10);
  textAlign(CENTER, CENTER);
  text("Snape Maltings", width/2, height/10 * 2);
  textSize(cnvDimension/20);
  text( "Reed Marsh Sequencer", width/10, height/10, (width/10) * 8, (height/10) * 8);
  text( "Touch screen or click mouse to start", width/2, height/10 * 8);
}

function createButtonPositions() {

  let step = (seqSteps/seqSteps);
  let seqStepstart = width/(seqSteps*1.5);
  let seqStepIncrement = width/(seqSteps + (step*0.5));
  let seqStepDistance = seqStepstart;

  for(let i = 0; i < seqRows; i++){
    for(let j = 0; j < seqSteps; j++){
      seqObject[`row${i}`].push({
        x: seqStepDistance,
        y: seqRowPosition,
        state: 0,
        image: seqOff
      });
      seqStepDistance = seqStepDistance + seqStepIncrement;
    }
    seqStepDistance = seqStepstart;
    seqRowPosition = seqRowPosition + seqRowIncrement;
  }

}

function drawSynth(step) { // instead of using the draw function at 60 frames a second we will call this function when something changes

  if(save.status){
    background(156, 156, 184);
    inp.show();
    inp.value(saveText);
    background(150); // background is grey (remember 5 is maximum because of the setup of colorMode)
    textSize(cnvDimension/20);
    textAlign(CENTER, CENTER);
    text("Copy and paste this link to share your music", width/10, height/10, (width/10) * 8, (height/10) * 3);
    fill(99, 245, 66);
    ellipse(width/2, height/5*4, radius*2);
    fill(0);
    text("ok", width/2, height/5*4);
  }else{
    background(245, 218, 66);
    imageMode(CENTER);

    for(let i = 0; i < seqRows; i++){
      for(let j = 0; j < seqSteps; j++){
        if((j === step) && (seqObject[`row${i}`][j].state === 0)){ // if this is the current step and the step is "off"
          image(seqStep1, seqObject[`row${i}`][j].x, seqObject[`row${i}`][j].y, seqWidth, seqHeight); // then yellow seq for this step
        }else if((j === step) && (seqObject[`row${i}`][j].state === 1)){ // if this is the current step and the step is "on"
          image(seqStep2, seqObject[`row${i}`][j].x, seqObject[`row${i}`][j].y, seqWidth, seqHeight); // then purple seq for this step
        }
        else{
          image(seqObject[`row${i}`][j].image, seqObject[`row${i}`][j].x, seqObject[`row${i}`][j].y, seqWidth, seqHeight); // otherwise seq colour reflects step state
        }
      }
    }

    textFont('Helvetica');

    textSize(speedTextSize);
    fill(slower.colour);
    text(slower.text, slower.x, slower.y);
    fill(faster.colour);
    text(faster.text, faster.x, faster.y);
    textSize(saveTextSize);
    fill(save.colour);
    text(save.text, save.x, save.y);

    if(bpmShow){
      textSize(bpmTextSize);
      fill('rgba(255, 255, 255, 0.7)');
      text(`BPM ${Math.round(Tone.Transport.bpm.value)}`, width/2, (height/3)*2);
    }
  }
  myJSON = Flatted.stringify(seqSaveSteps);
  console.log(myJSON);
}

function copySave() {
  /* Get the text field */
  var copyText = document.getElementById("myInput");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  //alert("Copied the text: " + copyText.value);

}

function startAudio() {
  Tone.start(); // we need this to allow audio to start.
  soundOn = true;
  drawSynth();

  for(let i = 0; i < seqRows; i++){
    seqPlayers[i].buffer = seqBuffers[i].get();
    seqPlayers[i].set(
      {
        "mute": false,
        "volume": -20,
        "autostart": false,
        "fadeIn": 0,
        "fadeOut": 0,
        "loop": false,
        "playbackRate": 1,
        "reverse": false
      }
    );
  }

  Tone.Transport.start();
  Tone.Transport.scheduleRepeat(repeat, '8n'); // call our function 'repeat' every x time (8n or an 8th note in this case)

  retrieveSavedWork();
}


function handleClick(e){
  if(soundOn) {
    if(save.status){
      let d = dist(mouseX, mouseY, width/2, height/5*4);
      if (d < radius) {
        save.status = false;
        copySave();
        inp.hide();
      }
    }else{
      for(let i = 0; i < seqRows; i++){
        for(let j = 0; j < seqSteps; j++){
          let d = dist(mouseX, mouseY, seqObject[`row${i}`][j].x, seqObject[`row${i}`][j].y);
          if (d < seqHeight/2) {
            seqPressed(i, j);
          }
        }
      }

      if(isMouseInsideText(slower.text, slower.x, slower.y)){
        console.log("slower");
        if(Tone.Transport.bpm.value > 20){
          Tone.Transport.bpm.value = Tone.Transport.bpm.value - 5;
        }
        setSpeed(Tone.Transport.bpm.value);
        console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);
        slower.colour = 'rgba(255, 0, 255, 0.9)'
        bpmShow = true;
        drawSynth();
        setTimeout(() => {
          bpmShow = false;
          slower.colour = 'rgba(255, 255, 255, 0.9)';
          drawSynth();
        }, 1000);
      }

      if(isMouseInsideText(faster.text, faster.x, faster.y)){
        console.log("faster");
        if(Tone.Transport.bpm.value < 195){
          Tone.Transport.bpm.value = Tone.Transport.bpm.value + 5;
        }
        setSpeed(Tone.Transport.bpm.value);
        console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);
        faster.colour = 'rgba(255, 0, 255, 0.9)'
        bpmShow = true;
        drawSynth();
        setTimeout(() => {
          bpmShow = false;
          faster.colour = 'rgba(255, 255, 255, 0.9)';
          drawSynth();
        }, 1000);
      }

      if(isMouseInsideText(save.text, save.x, save.y)){
        console.log("save");
        save.status = true;
        save.colour = 'rgba(255, 0, 255, 0.9)'
        saveSeq();
        drawSynth();
        setTimeout(() => {
          save.colour = 'rgba(255, 255, 255, 0.9)';
          drawSynth();
        }, 1000);
      }
    }
  }else{
    startAudio();
  }
}

function seqPressed(row, step) {

  if(seqObject[`row${row}`][step].state === 0) { // if the synth is not playing that note at the moment
    seqObject[`row${row}`][step].image = seqOn;
    drawSynth();
    seqObject[`row${row}`][step].state = 1; // change the array to reflect that the note is playing
  }
  else { // if the synth is playing that note at the moment
    seqObject[`row${row}`][step].image = seqOff;
    drawSynth();
    seqObject[`row${row}`][step].state = 0; // change the array to reflect that the note is playing
  }
  console.log(`row${row} step ${step} = ${seqObject[`row${row}`][step].state}`);


}

function setSpeed(tempo) {
  for(let i = 0; i < seqPlayers.length; i++){
    seqPlayers[i].playbackRate = tempo/originalTempo;
  }
}

let index = 0;

function repeat(time) {
  let _step = index % seqSteps;
  drawSynth(_step)
  for(let i = 0; i < seqRows; i++) {
    if(seqObject[`row${i}`][_step].state === 1) {
      seqPlayers[i].start();
    }
  }
  index++;
}

function isMouseInsideText(text, textX, textY) {
  const messageWidth = textWidth(text);
  const messageTop = textY - textAscent();
  const messageBottom = textY + textDescent();

  return mouseX > textX - messageWidth/2 && mouseX < textX + messageWidth/2 && // note messageWidth/2 because text being drawn centred in draw
    mouseY > messageTop && mouseY < messageBottom;
}



// save functionality here

//document.URL is the current url
var url_ob = new URL(document.URL);


let seqSaveSteps = {};
for(let i = 0; i < seqRows; i++){
  seqSaveSteps[`row${i}`] = new Array ();
}

for(let i = 0; i < seqRows; i++){ // setup and initialise the array
  for(let j = 0; j < seqSteps; j++){
    seqSaveSteps[`row${i}`].push(0);
  }
}


function saveSeq() {
  for(let i = 0; i < seqRows; i++){
    for(let j = 0; j < seqSteps; j++){
      seqSaveSteps[`row${i}`][j] = seqObject[`row${i}`][j].state;
    }

  }

  let seqRowsArray = new Array;
  for(let i = 0; i < seqRows; i++){
    seqRowsArray[i] = seqSaveSteps[`row${i}`].join('');
  }
  let seqHex = new Array;
  for(let i = 0; i < seqRows; i++){
    seqHex[i] = parseInt(seqRowsArray[i], 2).toString(16);
  }
  let bpmToSave = parseInt(Tone.Transport.bpm.value, 10).toString(16);
  let hexToSave = '';
  for(let i = 0; i < seqRows; i++){
    hexToSave = `${hexToSave}${seqHex[i]}_`;
  }
  hexToSave = `${hexToSave}_${bpmToSave}`;
  console.log(hexToSave);
  url_ob.hash = `#${hexToSave}`;
  var new_url = url_ob.href;
  document.location.href = new_url;
  saveText = new_url;
}


function retrieveSavedWork() {

var savedWork = url_ob.hash; //retrieve saved work from url
var savedWorkNoHash = savedWork.replace('#', ''); // remove the hash from it leaving only the number
var savedWorkAsArray = savedWorkNoHash.split('_');
console.log(savedWorkAsArray);
var  savedseqRowBinary = new Array;
for(let i = 0; i < seqRows; i++){
  savedseqRowBinary[i] = (parseInt(savedWorkAsArray[i], 16).toString(2)); // convert seq row to binary
}
var savedseqRow = new Array;
for(let i = 0; i < seqRows; i++){
  savedseqRow[i] = savedseqRowBinary[i].split(''); // convert to array
  console.log(`seq row${i} ${savedseqRow[i]}`);
}
var savedTempo = (parseInt(savedWorkAsArray[seqRows+1], 16).toString(10));// convert tempo to decimal
console.log(`saved tempo  ${savedTempo}`);

for(let i = 0; i < seqRows; i++){
  console.log(`am i here? seqRow ${i}`);
  for(let j = seqSteps - 1; j >= 0 ; j--){
    let a = [];
    console.log(`savedseqRow ${i} = ${savedseqRow[i]}`);
    if(savedseqRow[i].length > 0){
      a[j] = savedseqRow[i].pop();
      }else{
      a[j] = 0;
      }
    if(a[j] === "1"){ // you need to put "" around the number because you are comparing a number with a string
      seqPressed(i, j);
    }
  }
}

if(isNaN(savedTempo) === false){
  Tone.Transport.bpm.value = savedTempo;

  setSpeed(Tone.Transport.bpm.value);
  console.log(`saved bpm ${Math.round(Tone.Transport.bpm.value)}`);
  bpmShow = true;
  //drawSynth();
  setTimeout(() => {
    bpmShow = false;
    faster.colour = 'rgba(255, 255, 255, 0.9)';
    drawSynth();
  }, 1000);

}

}
