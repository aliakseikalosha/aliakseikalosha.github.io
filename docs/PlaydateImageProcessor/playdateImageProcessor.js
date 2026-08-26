const MaxColorCount = 16;
const image_input = document.querySelector('#image_input');
const display = document.querySelector('#display_canvas');
const result = document.querySelector('#result_canvas');
const colorHolderTemplate = document.querySelector('#color_holder_temp');
const conversionSelector = document.querySelector(`#method`);
const conversionOption = {
  "Mesh": convertImageMesh,
  "Random": convertImageRandom,
  "Error": convertImageError
}
let currentImage = null;
let colorDataList = [];
let files = [];


init();


function init() {
  var options = Object.keys(conversionOption);
  conversionSelector.options = [];
  for (let i = 0; i < options.length; i++) {
    const x = options[i];
    conversionSelector.options[i] = new Option(x, x);
  }
  conversionSelector.onchange = function () {
    convertImage(currentImage);
  }

  image_input.addEventListener('change', function () {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      currentImage = new Image();
      currentImage.src = fileReader.result;
      currentImage.onload = () => {
        fitCanvasToImage(currentImage, display);
        initSettings();
        fillSettings();
        convertImage(currentImage);
      }
    });
    fileReader.readAsDataURL(this.files[0]);
    files = this.files;
  });
}

function fitCanvasToImage(img, canvas) {
  let ctx = canvas.getContext("2d");
  if (canFitOnPlayadte(img)) {
    canvas.width = img.width;
    canvas.height = img.height;
  } else {
    let aspectRatio = img.width / img.height;
    if (img.width > img.height) {
      canvas.width = 240 * aspectRatio;
      canvas.height = 240;
    } else {
      canvas.width = 240;
      canvas.height = 240 / aspectRatio;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
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
    node.children[0].style.backgroundColor = `rgb(${element.color.r},${element.color.g},${element.color.b})`;
    node.children[1].value = `${Math.floor(i / colorDataList.length * 100)}`;
    node.children[1].addEventListener('input', function () {
      element.value = node.children[1].value * 2.55;
      convertImage(currentImage);
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
    if (colorDataList.length > MaxColorCount) {
      colorDataList = [];
      return;
    }
  }
  colorDataList.sort((a, b) => a.value - b.value);
}

function convertImage(image) {
  fitCanvasToImage(image, result)
  var ctx = result.getContext("2d");
  const imageData = ctx.getImageData(0, 0, result.width, result.height);
  const data = imageData.data;
  conversionOption[conversionSelector.value](data);
  ctx.putImageData(imageData, 0, 0);
}

function convertImageMesh(data) {
  const ValueTo1BitColor = (colorData, i) => {
    let index = -1;
    if (colorDataList.length == 0) {
      index = colorData.value / 255;
    } else {
      index = colorDataList.findIndex(c => isEqual(c.color, colorData.color)) / colorDataList.length;
    }
    if (index < 0.25) {
      return 0;
    }
    if (index >= 0.75) {
      return 255;
    }
    let pixelIndex = i / 4;
    let x = Math.floor(pixelIndex % currentImage.width);
    let y = Math.floor(pixelIndex / currentImage.width);

    if (index < 0.5) {
      return x % 2 == y % 2 ? 255 : 0;
    } else {
      return x % 2 == 1 & y % 2 == 1 ? 0 : 255;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    setValue(data, i, ValueTo1BitColor(findColorData(data, i), i));
  }
}

function convertImageRandom(data) {
  const ValueTo1BitColor = (colorData) => {
    return colorData.value >= Math.floor(Math.random() * 255) ? 255 : 0;
  }

  for (let i = 0; i < data.length; i += 4) {
    setValue(data, i, ValueTo1BitColor(findColorData(data, i)));
  }
}

function convertImageError(data) {
  let errorDelta = 0;
  let value = 0;
  const ValueTo1BitColorError = (colorData, errorDelta) => {
    var errorDelta = (colorData.value + errorDelta) - Math.floor(Math.random() * 255);
    var result = errorDelta > 0 ? 255 : 0;
    return [result, colorData.value - result];
  }
  for (let i = 0; i < data.length; i += 4) {
    [value, errorDelta] = ValueTo1BitColorError(findColorData(data, i), errorDelta);
    setValue(data, i, value);
  }
}

function canFitOnPlayadte(img) {
  return Math.max(img.width, img.height) <= 400 && Math.min(img.width, img.height) <= 240;
}

function findColorData(data, i) {
  let color = createColor(data[i], data[i + 1], data[i + 2]);
  if (colorDataList.length == 0) {
    return createColorData(color);
  }
  return colorDataList.find((a) => isEqual(a.color, color));
}

function setValue(data, i, value) {
  data[i] = value;
  data[i + 1] = value;
  data[i + 2] = value;
}

function createColorData(color) {
  return {
    color: color,
    value: (color.r + color.g + color.b) / 3
  };
}

function createColorFromData(data, i) {
  return createColor(data[i], data[i + 1], data[i + 2]);
}

function createColor(r, g, b) {
  return {
    r: r,
    g: g,
    b: b
  }
}

function isEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key =>
    obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
};

function downloadResult() {
  for (let i = 0; i < files.length; i++) {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      let image = new Image();
      image.src = fileReader.result;
      image.onload = () => {
        convertImage(image);
        const anchor = document.createElement("a");

        anchor.href = result.toDataURL("image/png").replace("image/png", "image/octet-stream");
        anchor.download = 'result' + files[i].name;
        document.body.appendChild(anchor);

        setTimeout(() => {
          anchor.click();
          document.body.removeChild(anchor);
        }, i * 100);
      }
    });
    fileReader.readAsDataURL(files[i]);
  }
}