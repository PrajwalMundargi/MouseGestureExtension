let isDrawing = false;
let gesturePoints = [];

const trailCanvas = document.createElement('canvas');
trailCanvas.style.position = 'fixed';
trailCanvas.style.top = 0;
trailCanvas.style.left = 0;
trailCanvas.style.width = '100%';
trailCanvas.style.height = '100%';
trailCanvas.style.pointerEvents = 'none';
trailCanvas.width = window.innerWidth;
trailCanvas.height = window.innerHeight;
document.body.appendChild(trailCanvas);
const ctx = trailCanvas.getContext('2d');

function drawTrail(points) {
    ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    if (points.length < 2) return;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
}

document.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right-click
        isDrawing = true;
        gesturePoints = [{ x: e.clientX, y: e.clientY }];
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        gesturePoints.push({ x: e.clientX, y: e.clientY });
        drawTrail(gesturePoints);

        // Scroll with mouse trail
        const deltaY = gesturePoints[gesturePoints.length - 1].y - gesturePoints[gesturePoints.length - 2].y;
        window.scrollBy(0, deltaY);
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 2 && isDrawing) {
        isDrawing = false;
        const gesture = detectDirection(gesturePoints);
        const bucket = detectBucketShape(gesturePoints);
        const uReload = detectUReloadGesture(gesturePoints);
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

        if (uReload) {
            location.reload();
        } else if (bucket) {
            sendGesture(bucket);
        } else if (gesture) {
            sendGesture(gesture);
        }
    }
});

function sendGesture(gesture) {
    chrome.runtime.sendMessage({ type: 'gesture', path: [gesture] }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
        } else {
            console.log('Gesture:', gesture, response);
        }
    });
}

function detectDirection(points) {
    if (points.length < 2) return null;
    const dx = points[points.length - 1].x - points[0].x;
    const dy = points[points.length - 1].y - points[0].y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > absDy) return dx < 0 ? 'L' : 'R';
    else return dy < 0 ? 'U' : 'D';
}

function detectBucketShape(points) {
    if (points.length < 10) return null;
    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dx) < 100 || Math.abs(dy) > 100) return null;

    let minY = points[0].y;
    let minIndex = 0;
    for (let i = 1; i < points.length; i++) {
        if (points[i].y < minY) {
            minY = points[i].y;
            minIndex = i;
        }
    }

    const peakIsAbove = minY < start.y - 50 && minY < end.y - 50;
    const isMiddlePeak = minIndex > points.length * 0.2 && minIndex < points.length * 0.8;

    if (peakIsAbove && isMiddlePeak) {
        return 'BUCKET';
    }
    return null;
}

// NEW: Detect "U" shaped gesture for reload
function detectUReloadGesture(points) {
    if (points.length < 10) return false;

    const start = points[0];
    const end = points[points.length - 1];
    const midIndex = Math.floor(points.length / 2);
    const mid = points[midIndex];

    const wentDown = mid.y > start.y + 40 && mid.y > end.y + 40;
    const wentUp = end.y < mid.y - 40 && start.y < mid.y - 40;
    const xSpan = Math.abs(end.x - start.x) > 50;

    return wentDown && wentUp && xSpan;
}

document.addEventListener('contextmenu', (e) => {
    if (isDrawing) e.preventDefault(); // Prevent right-click menu while drawing
});
