let uploadedImageObj = null;
let imgOffsetX = 0;
let imgOffsetY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

const canvasWrapper = document.getElementById('canvasWrapper');
const previewCanvas = document.getElementById('previewCanvas');

canvasWrapper.addEventListener('mousedown', startDrag);
canvasWrapper.addEventListener('mousemove', drag);
canvasWrapper.addEventListener('mouseup', endDrag);
canvasWrapper.addEventListener('mouseleave', endDrag);

canvasWrapper.addEventListener('touchstart', startDrag, { passive: false });
canvasWrapper.addEventListener('touchmove', drag, { passive: false });
canvasWrapper.addEventListener('touchend', endDrag);

function startDrag(e) {
  if (!uploadedImageObj) return;
  isDragging = true;
  startX = (e.clientX || e.touches[0].clientX) - imgOffsetX;
  startY = (e.clientY || e.touches[0].clientY) - imgOffsetY;
  e.preventDefault();
}

function drag(e) {
  if (!isDragging || !uploadedImageObj) return;
  const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
  imgOffsetX = clientX - startX;
  imgOffsetY = clientY - startY;
  updatePreview();
  e.preventDefault();
}

function endDrag() {
  isDragging = false;
}

function loadImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function() {
        uploadedImageObj = img;
        imgOffsetX = 0; 
        imgOffsetY = 0;
        document.getElementById('imageZoom').value = 1.0;
        document.getElementById('placeholderText').style.display = 'none';
        document.getElementById('hintText').style.display = 'block';
        updatePreview();
      }
    }
    reader.readAsDataURL(file);
  }
}

function renderToCanvas(targetCanvas, targetSize) {
  if (!uploadedImageObj) return;
  const ctx = targetCanvas.getContext('2d');
  ctx.clearRect(0, 0, targetSize, targetSize);

  const isBorderOn = document.getElementById('enableBorder').checked;
  const isTextOn = document.getElementById('enableText').checked;
  const isPOn = document.getElementById('enablePrimary').checked;
  const isSOn = document.getElementById('enableSecondary').checked;
  const isTOn = document.getElementById('enableThird').checked;

  const style = document.getElementById('frameStyle').value;
  const c1 = document.getElementById('primaryColor').value;
  const c2 = document.getElementById('secondaryColor').value;
  const c3 = document.getElementById('thirdColor').value;
  
  const scaleFactor = targetSize / 250;
  const w1 = parseInt(document.getElementById('size1').value) * scaleFactor;
  const w2 = parseInt(document.getElementById('size2').value) * scaleFactor;
  const w3 = parseInt(document.getElementById('size3').value) * scaleFactor;

  const customText = document.getElementById('circularText').value;
  const txtSize = parseInt(document.getElementById('textSize').value) * scaleFactor;
  const userZoom = parseFloat(document.getElementById('imageZoom').value);

  const centerX = targetSize / 2;
  const centerY = targetSize / 2;
  
  let paddingSpace = 15 * scaleFactor;
  if (isTextOn && customText.trim() !== '') {
    paddingSpace += txtSize + (10 * scaleFactor);
  }
  if (style === 'double') paddingSpace += w2 + 6 * scaleFactor;
  if (style === 'triple') paddingSpace += w2 + w3 + 12 * scaleFactor;

  const radius = (targetSize / 2) - paddingSpace;

  // 1. Draw Image inside circle clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  let hRatio = (radius * 2) / uploadedImageObj.width;
  let vRatio = (radius * 2) / uploadedImageObj.height;
  let ratio = Math.max(hRatio, vRatio) * userZoom;
  let renderW = uploadedImageObj.width * ratio;
  let renderH = uploadedImageObj.height * ratio;

  let drawX = centerX - (renderW / 2) + (imgOffsetX * scaleFactor);
  let drawY = centerY - (renderH / 2) + (imgOffsetY * scaleFactor);

  ctx.drawImage(uploadedImageObj, drawX, drawY, renderW, renderH);
  ctx.restore();

  // 2. Draw Frames / Rings with individual thicknesses
  if (isBorderOn) {
    if (style === 'solid' || style === 'neon') {
      if (isPOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.lineWidth = w1;
        ctx.strokeStyle = c1;
        ctx.stroke();
      }
    } else if (style === 'double') {
      if (isPOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.lineWidth = w1;
        ctx.strokeStyle = c1;
        ctx.stroke();
      }
      if (isSOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + (w1 / 2) + (w2 / 2) + (4 * scaleFactor), 0, Math.PI * 2, true);
        ctx.lineWidth = w2;
        ctx.strokeStyle = c2;
        ctx.stroke();
      }
    } else if (style === 'triple') {
      let gap = 4 * scaleFactor;
      if (isPOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.lineWidth = w1;
        ctx.strokeStyle = c1;
        ctx.stroke();
      }
      if (isSOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + (w1 / 2) + gap + (w2 / 2), 0, Math.PI * 2, true);
        ctx.lineWidth = w2;
        ctx.strokeStyle = c2;
        ctx.stroke();
      }
      if (isTOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + w1 + w2 + (gap * 2) + (w3 / 2), 0, Math.PI * 2, true);
        ctx.lineWidth = w3;
        ctx.strokeStyle = c3;
        ctx.stroke();
      }
    } else if (style === 'dashed') {
      if (isPOn) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.lineWidth = w1;
        ctx.strokeStyle = c1;
        ctx.setLineDash([25 * scaleFactor, 15 * scaleFactor]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (style === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, targetSize, targetSize);
      gradient.addColorStop(0, isPOn ? c1 : 'transparent');
      gradient.addColorStop(0.5, isSOn ? c2 : 'transparent');
      gradient.addColorStop(1, isTOn ? c3 : 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
      ctx.lineWidth = w1;
      ctx.strokeStyle = gradient;
      ctx.stroke();
    }
  }

  // 3. Draw Circular Text properly on the outer perimeter
  if (isTextOn && customText.trim() !== '') {
    ctx.save();
    ctx.font = 'bold ' + txtSize + 'px sans-serif';
    ctx.fillStyle = isTOn ? c3 : '#1565c0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let textOffsetRadius = radius + paddingSpace - (txtSize / 2) - (4 * scaleFactor);

    const characters = customText.split('');
    const angleStep = (Math.PI * 2) / characters.length;

    ctx.translate(centerX, centerY);
    for (let i = 0; i < characters.length; i++) {
      ctx.save();
      const angle = i * angleStep;
      ctx.rotate(angle);
      ctx.translate(0, -textOffsetRadius);
      
      if (angle > Math.PI / 2 && angle < (3 * Math.PI) / 2) {
        ctx.rotate(-Math.PI / 2);
        ctx.scale(-1, -1);
      } else {
        ctx.rotate(Math.PI / 2);
      }

      ctx.fillText(characters[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

function updatePreview() {
  if (!uploadedImageObj) return;
  
  document.getElementById('s1Val').innerText = document.getElementById('size1').value;
  document.getElementById('s2Val').innerText = document.getElementById('size2').value;
  document.getElementById('s3Val').innerText = document.getElementById('size3').value;
  document.getElementById('textVal').innerText = document.getElementById('textSize').value;
  document.getElementById('zoomVal').innerText = document.getElementById('imageZoom').value;

  renderToCanvas(previewCanvas, 250);
}

function downloadImage() {
  if (!uploadedImageObj) {
    alert('Please upload an image first!');
    return;
  }

  const downloadCanvas = document.createElement('canvas');
  downloadCanvas.width = 900;
  downloadCanvas.height = 900;

  renderToCanvas(downloadCanvas, 900);

  const link = document.createElement('a');
  link.download = 'stylish-dp-framed.png';
  link.href = downloadCanvas.toDataURL('image/png');
  link.click();
}
