const image_input = document.querySelector('#image_input');
const display = document.querySelector('#display_canvas');
const result = document.querySelector('#result_canvas');
const colorHolderTemplate = document.querySelector('#color_holder_temp');
const conversionSelector = document.querySelector(`#method`);
const conversionOption = {
  "Random": convertImageRandom,
  "Mesh": convertImageMesh,
  "Error": convertImageError
}
let currentImage = null;
let colorDataList = [];
init();
function init() {
  var options = Object.keys(conversionOption);
  conversionSelector.options = [];
  for (let i = 0; i < options.length; i++) {
    const x = options[i];
    conversionSelector.options[i] = new Option(x, x);
  }
  conversionSelector.onchange = function () {
    convertImage();
  }

  image_input.addEventListener('change', function () {
    const file_reader = new FileReader();
    file_reader.addEventListener('load', () => {
      currentImage = new Image();
      currentImage.src = file_reader.result;
      currentImage.onload = () => {
        fitCanvasToImage(currentImage, display);
        initSettings();
        fillSettings();
        convertImage();
      }
    });
    file_reader.readAsDataURL(this.files[0]);
  });
}

function fitCanvasToImage(img, canvas) {
  var ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
}

function fillSettings() {
  for (let i = 0; i < colorDataList.length; i++) {
    let node = document.getElementById(colorHolderTemplate.id.replace("temp", i));
    if (node) {
      node.remove();
    }
    const element = colorDataList[i];
    node = colorHolderTemplate.cloneNode(true);
    node.id = node.id.replace("temp", i);
    element.node = node;
    colorHolderTemplate.parentElement.appendChild(node);
    node.children[0].style.backgroundColor = `#${element.color.r.toString(16)}${element.color.g.toString(16)}${element.color.b.toString(16)}`;
    node.children[1].value = `${Math.floor(element.value / 255.0)}`;
    node.children[1].addEventListener('input', function () {
      element.value = node.children[1].value * 2.55;
      convertImage();
    }, false);
  }
}

function initSettings() {
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
  colorDataList.sort((a, b) => a.value - b.value);
}

function convertImage() {
  fitCanvasToImage(currentImage, result)
  var ctx = result.getContext("2d");
  const imageData = ctx.getImageData(0, 0, result.width, result.height);
  const data = imageData.data;
  conversionOption[conversionSelector.value](data);
  ctx.putImageData(imageData, 0, 0);
}

function convertImageMesh(data) {
  const ValueTo1BitColor = (colorData, i) => {
    if (isEqual(colorData.color, colorDataList[0].color)) {
      return 0;
    }
    if (isEqual(colorData.color, colorDataList[3].color)) {
      return 255;
    }
    let pixelIndex = i / 4;
    let x = Math.floor(pixelIndex % currentImage.width);
    let y = Math.floor(pixelIndex / currentImage.width);
    if (isEqual(colorData.color, colorDataList[1].color)) {
      return x % 2 == y % 2 ? 255 : 0;
    }
    if (isEqual(colorData.color, colorDataList[2].color)) {
      return x % 2 == 1 & y % 2 == 1 ? 0 : 255;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    let color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const colorData = colorDataList.find((a) => isEqual(a.color, color));
    setValue(data, i, ValueTo1BitColor(colorData, i));
  }
}

function convertImageRandom(data) {
  const ValueTo1BitColor = (colorData) => {
    if (isEqual(colorData.color, colorDataList[0].color)) {
      return 0;
    }
    if (isEqual(colorData.color, colorDataList[colorDataList.length - 1].color)) {
      return 255;
    }
    return colorData.value >= Math.floor(Math.random() * 255) ? 255 : 0;
  }

  for (let i = 0; i < data.length; i += 4) {
    let color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const colorData = colorDataList.find((a) => isEqual(a.color, color));
    setValue(data, i, ValueTo1BitColor(colorData));
  }

}

function convertImageError(data) {
  let errorDelta = 0;
  const ValueTo1BitColorError = (colorData, errorDelta) => {
    if (isEqual(colorData.color, colorDataList[0].color)) {
      return [0, 0];
    }
    if (isEqual(colorData.color, colorDataList[colorDataList.length - 1].color)) {
      return [255, 0];
    }
    var errorDelta = (colorData.value + errorDelta) - Math.floor(Math.random() * 255);
    return [errorDelta > 0 ? 255 : 0, errorDelta];
  }
  for (let i = 0; i < data.length; i += 4) {
    let color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const colorData = colorDataList.find((a) => isEqual(a.color, color));
    let value = 0;
    [value, errorDelta] = ValueTo1BitColorError(colorData, errorDelta);
    setValue(data, i, value);
  }
}

function setValue(data, i, value) {
  data[i] = value; // red
  data[i + 1] = value; // green
  data[i + 2] = value; // blue
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

function saveImage() {
  var link = document.getElementById('save_link');
  link.setAttribute('download', 'resultPlaydateImage.png');
  link.setAttribute('href', result.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  link.click();
}