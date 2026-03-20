// js/main.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;

// Подгоняем холст под размер экрана телефона
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Техническая сетка космоса
function drawGrid() {
    ctx.strokeStyle = 'rgba(40, 60, 50, 0.2)';
    ctx.lineWidth = 1 / camera.zoom;
    const gridSize = 500;
    const left = camera.x - (width/2)/camera.zoom;
    const right = camera.x + (width/2)/camera.zoom;
    const top = camera.y - (height/2)/camera.zoom;
    const bottom = camera.y + (height/2)/camera.zoom;
    
    const startX = Math.floor(left / gridSize) * gridSize;
    const startY = Math.floor(top / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = startX; x <= right; x += gridSize) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    for (let y = startY; y <= bottom; y += gridSize) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
    ctx.stroke();
}

// Заглушка для корабля (чтобы камера не ломалась, пока мы не создали ship.js)
const ship = { x: 0, y: 0 };

// ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
function loop() {
    camera.update();

    // Заливаем фон
    ctx.fillStyle = '#12151c';
    ctx.fillRect(0, 0, width, height);

    // Включаем трансформацию мира
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    drawGrid();

    // Временный красный кружок - центр вселенной (0,0)
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI*2);
    ctx.fillStyle = 'red';
    ctx.fill();

    ctx.restore();

    // Рисуем интерфейс поверх всего
    drawJoystick(ctx);

    requestAnimationFrame(loop);
}

// Запуск!
loop();
