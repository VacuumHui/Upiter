// js/input.js
const joystick = {
    active: false,
    startX: 0, startY: 0, currX: 0, currY: 0,
    maxRadius: 100,
    visualOpacity: 0, visualRadius: 0, targetRadius: 0
};

let initialPinchDistance = null;
let isMenuOpen = false; // Глобальный флаг для UI (позже будем им управлять)

// Обработка касаний экрана
window.addEventListener('touchstart', (e) => {
    if (isMenuOpen) return; // Если открыто меню, блокируем джойстик

    if (e.touches.length === 2) { 
        // Зум двумя пальцами
        joystick.active = false;
        initialPinchDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
    } else if (e.touches.length === 1 && e.target === document.getElementById('gameCanvas')) { 
        // Касание ИМЕННО холста включает джойстик
        joystick.active = true;
        joystick.startX = e.touches[0].clientX; joystick.startY = e.touches[0].clientY;
        joystick.currX = joystick.startX; joystick.currY = joystick.startY;
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (isMenuOpen) return;

    if (e.touches.length === 2 && initialPinchDistance) { 
        // Логика зума
        const currentDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        camera.zoom *= currentDistance / initialPinchDistance;
        
        // Ограничения зума
        if (camera.zoom < 0.05) camera.zoom = 0.05; 
        if (camera.zoom > 3) camera.zoom = 3;
        
        camera.targetZoom = camera.zoom; 
        initialPinchDistance = currentDistance; 
    } else if (e.touches.length === 1 && joystick.active) { 
        // Обновляем позицию пальца для джойстика
        joystick.currX = e.touches[0].clientX; joystick.currY = e.touches[0].clientY;
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) initialPinchDistance = null;
    if (e.touches.length === 0) joystick.active = false; 
});

// ФУНКЦИЯ ОТРИСОВКИ ДЖОЙСТИКА (Будем вызывать из main.js)
function drawJoystick(ctx) {
    if (joystick.active) {
        joystick.visualOpacity += (1 - joystick.visualOpacity) * 0.15;
        const dist = Math.hypot(joystick.currX - joystick.startX, joystick.currY - joystick.startY);
        joystick.targetRadius = Math.min(dist, joystick.maxRadius);
    } else {
        joystick.visualOpacity += (0 - joystick.visualOpacity) * 0.15;
        joystick.targetRadius = 0;
    }
    
    joystick.visualRadius += (joystick.targetRadius - joystick.visualRadius) * 0.2;

    if (joystick.visualOpacity < 0.01) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Рисуем в координатах экрана, а не мира
    ctx.globalAlpha = joystick.visualOpacity;

    // Зеленый круг
    ctx.beginPath();
    ctx.arc(joystick.startX, joystick.startY, Math.max(joystick.visualRadius, 2), 0, Math.PI * 2);
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Линия
    if (joystick.visualRadius > 5) {
        const dx = joystick.currX - joystick.startX;
        const dy = joystick.currY - joystick.startY;
        const dist = Math.hypot(dx, dy);
        let endX = joystick.currX;
        let endY = joystick.currY;

        if (dist > joystick.maxRadius) {
            endX = joystick.startX + (dx / dist) * joystick.maxRadius;
            endY = joystick.startY + (dy / dist) * joystick.maxRadius;
        }

        ctx.beginPath();
        ctx.moveTo(joystick.startX, joystick.startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#33ff33';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    ctx.restore();
}
