// Code from Szenia Zadvornykh
// CodePen https://codepen.io/zadvorsky/pen/xxwbBQV/license?editors=0010

// JavaScript Coding Part


const config = {
  src: 'images/open-peeps-sheet.png',
  rows: 7, // 15
  cols: 15 }; // 7
  // src: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/open-peeps-sheet.png',
  // src: 'data/open-peeps-sheet-test.png',
  // src: 'images/hero_compressed.png',
  

// UTILS

const randomRange = (min, max) => min + Math.random() * (max - min);

const randomIndex = array => randomRange(0, array.length) | 0;

const removeFromArray = (array, i) => array.splice(i, 1)[0];

const removeItemFromArray = (array, item) => removeFromArray(array, array.indexOf(item));

const removeRandomFromArray = array => removeFromArray(array, randomIndex(array));

const getRandomFromArray = (array) =>
array[randomIndex(array) | 0];


// TWEEN FACTORIES

const resetPeep = ({ stage, peep }) => {
  const direction = Math.random() > 0.5 ? 1 : -1;
  // using an ease function to skew random to lower values to help hide that peeps have no legs
  const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
  const startY = stage.height - peep.height + offsetY;
  let startX;
  let endX;

  if (direction === 1) {
    startX = -peep.width;
    endX = stage.width;
    peep.scaleX = 1;
  } else {
    startX = stage.width + peep.width;
    endX = 0;
    peep.scaleX = -1;
  }

  peep.x = startX;
  peep.y = startY;
  peep.anchorY = startY;

  return {
    startX,
    startY,
    endX };

};

const normalWalk = ({ peep, props }) => {
  const {
    startX,
    startY,
    endX } =
  props;
  
  // console.log("peep.width", peep.width)
  console.log("peep.rect", peep.rect)
  const xDuration = canvas.width/peep.width;
  const yDuration = 0.25;

  const tl = gsap.timeline();
  tl.timeScale(randomRange(0.5, 1.5));
  tl.to(peep, {
    duration: xDuration,
    x: endX,
    ease: 'none' },
  0);
  tl.to(peep, {
    duration: yDuration,
    repeat: xDuration / yDuration,
    yoyo: true,
    y: startY - 10 },
  0);

  return tl;
};

const walks = [
normalWalk];


// CLASSES

class Peep {
  constructor({
    image,
    rect })
  {
    this.image = image;
    this.setRect(rect);

    this.x = 0;
    this.y = 0;
    this.anchorY = 0;
    this.scaleX = 1;
    this.walk = null;
  }

  setRect(rect) {
    this.rect = rect;
    this.width = rect[2];
    this.height = rect[3];

    this.drawArgs = [
    this.image,
    ...rect,
    0, 0, this.width, this.height];

  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scaleX, 1);
    ctx.drawImage(...this.drawArgs);
    ctx.restore();
  }}


// MAIN

const img = document.createElement('img');
img.onload = init;
img.src = config.src;

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const stage = {
  width: 0,
  height: 0 };


const allPeeps = [];
const availablePeeps = [];
const crowd = [];

function init() {
  createPeeps();

  // resize also (re)populates the stage
  resize();

  gsap.ticker.add(render);
  window.addEventListener('resize', resize);
}

// Define the indices of the peeps you want to display
const selectedIndices = [1, 3, 6, 8, 9, 10, 11, 12, 13, 14,
                        15, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29,
                        32, 33, 34, 35, 36, 37, 38, 40, 41, 42, 43, 44,
                        45, 46, 49, 50, 51, 52, 54, 55, 56, 57, 59,
                        60, 62, 63, 65, 66, 67, 68, 69, 70, 71, 73,
                        75, 76, 79, 80, 81, 83, 85, 87,
                        94, 95, 96, 98, 99, 102, 103
];

function createPeeps() {
  const {
    rows,
    cols
  } = config;
  const {
    naturalWidth: width,
    naturalHeight: height
  } = img;

  // canvas width / peeps width 
  // 3000 / 240  * 10
  // 105

  const total = rows * cols;
  const rectWidth = width / cols;
  const rectHeight = height / rows;
  const number_people =  Math.floor((canvas.clientWidth * devicePixelRatio / rectWidth)*14);
  console.log("LOG", total, rectWidth, rectHeight, number_people)
  
  let iter = number_people%total
  for (let i = 0; i < iter; i++) {
    if (selectedIndices.includes(i)) {
      allPeeps.push(new Peep({
        image: img,
        rect: [
        i % cols * rectWidth,
        (i / cols | 0) * rectHeight,
        rectWidth,
        rectHeight] }));
    }
  }

  for (let j = 0; j < Math.floor(number_people/total); j++) {
    for (let i = 0; i < total; i++) {
      if (selectedIndices.includes(i)) {
        allPeeps.push(new Peep({
          image: img,
          rect: [
          i % cols * rectWidth,
          (i / cols | 0) * rectHeight,
          rectWidth,
          rectHeight] }));
      }
    }
  }
}

function resize() {
  stage.width = canvas.clientWidth;
  stage.height = canvas.clientHeight;
  canvas.width = stage.width * devicePixelRatio;
  canvas.height = stage.height * devicePixelRatio;

  crowd.forEach(peep => {
    peep.walk.kill();
  });

  crowd.length = 0;
  availablePeeps.length = 0;
  availablePeeps.push(...allPeeps);

  initCrowd();
}

function initCrowd() {
  while (availablePeeps.length) {
    // setting random tween progress spreads the peeps out
    addPeepToCrowd().walk.progress(Math.random());
  }
}

function addPeepToCrowd() {
  const peep = removeRandomFromArray(availablePeeps);
  const walk = getRandomFromArray(walks)({
    peep,
    props: resetPeep({
      peep,
      stage }) }).

  eventCallback('onComplete', () => {
    removePeepFromCrowd(peep);
    addPeepToCrowd();
  });

  peep.walk = walk;

  crowd.push(peep);
  crowd.sort((a, b) => a.anchorY - b.anchorY);

  return peep;
}

function removePeepFromCrowd(peep) {
  removeItemFromArray(crowd, peep);
  availablePeeps.push(peep);
}

function render() {
  canvas.width = canvas.width;
  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  crowd.forEach(peep => {
    peep.render(ctx);
  });

  ctx.restore();
}