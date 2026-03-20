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
    const gridSize = 100;
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


// ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
// ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ (Обновленный)
function loop() {
    // Отрисовка UI (джойстик поверх всего)
    drawJoystick(ctx);

    // ОБНОВЛЕНИЕ ТЕКСТА И КНОПОК (Добавлено)
    if (typeof updateUI === 'function') updateUI();
    
    // Обновляем камеру
    camera.update();

    // Заливаем фон космоса
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // ОБНОВЛЕНИЕ ФИЗИКИ
    bodies.forEach(b => b.update());
    asteroids.forEach(a => a.update());
    
    // ДОБАВЛЕНО: Обновление физики корабля
    if (typeof ship !== 'undefined') ship.update(); 

    // ОТРИСОВКА
    ctx.save();
    ctx.translate(width / 2, height / 2); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);

    drawGrid();
    asteroids.forEach(a => a.draw(ctx, camera.zoom));
    bodies.forEach(b => b.draw(ctx, camera.zoom));
    
    // ДОБАВЛЕНО: Отрисовка корабля
    if (typeof ship !== 'undefined') ship.draw(ctx, camera.zoom); 

    ctx.restore();

    drawJoystick(ctx);

    requestAnimationFrame(loop);
}

loop();
