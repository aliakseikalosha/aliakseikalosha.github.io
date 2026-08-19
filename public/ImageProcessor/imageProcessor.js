const image_input = document.querySelector('#image_input');
const display = document.querySelector('#display_canvas');
const result = document.querySelector('#result_canvas');
const colorHolderTemplate = document.querySelector('#color_holder_temp');

let currentImage = null;
let colorDataList = [];
init();
function init() {

  image_input.addEventListener('change', function () {
    const file_reader = new FileReader();
    file_reader.addEventListener('load', () => {
      currentImage = new Image();
      currentImage.src = file_reader.result;
      currentImage.onload = () => {
        drawImageScaled(currentImage, display);
        fillSettings();
        convertImage();
      }
    });
    file_reader.readAsDataURL(this.files[0]);
  });
}

function drawImageScaled(img, canvas) {
  var ctx = canvas.getContext("2d");
  var ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
  var centerShift = {
    x: (canvas.width - img.width * ratio) / 2,
    y: (canvas.height - img.height * ratio) / 2
  };
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.width, img.height, centerShift.x, centerShift.y, img.width * ratio, img.height * ratio);
}

function fillSettings() {
  var ctx = display.getContext("2d");
  const imageData = ctx.getImageData(0, 0, display.width, display.height);
  const data = imageData.data;
  colorDataList = [];
  for (let i = 0; i < data.length; i += 4) {
    let color = createColor(data[i], data[i + 1], data[i + 2]);
    if (colorDataList.find((a) => isEqual(a.color, color)) == undefined) {
      colorDataList.push(createColorData(color));
    }
  }
  console.log(colorDataList)
}

function convertImage() {
  drawImageScaled(currentImage, result)
  var ctx = result.getContext("2d");
  const imageData = ctx.getImageData(0, 0, result.width, result.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const colorData = colorDataList.find((a) => isEqual(a.color, color));
    let value = colorData.value >= Math.floor(Math.random() * 255) ? 255 : 0;
    data[i] = value; // red
    data[i + 1] = value; // green
    data[i + 2] = value; // blue
  }
  ctx.putImageData(imageData, 0, 0);
}

const createColorData = (color) => {
  return {
    color: color,
    value: (color.r + color.g + color.b) / 3
  };
}

const createColor = (r, g, b) => {
  return {
    r: r,
    g: g,
    b: b
  }
}

const isEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key =>
    obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
};