// js/ship.js

// Глобальные переменные для подсчета прогресса
window.collectedCapsules = 0;
window.totalCapsules = 4; // У нас 4 планеты с капсулами по генерации

const ship = {
    x: 0, 
    y: -800,          // Стартуем высоко над звездой
    vx: 3,            // Начальная орбитальная скорость
    vy: 0, 
    angle: -Math.PI/2, // Нос смотрит вверх
    
    maxThrust: 0.05,  // Максимальная тяга двигателя (очень слабая для реализма)
    turnSpeed: 0.08,  // Скорость поворота
    currentThrust: 0, 
    
    pathHistory: [],  // Массив для хранения точек траектории
    
    targetBody: null,       // Текущая цель (планета)
    autoPilotEngaged: false,// Состояние автопилота

    update: function() {
        // Если открыто меню, игра ставится на паузу (физика не просчитывается)
        if (typeof isMenuOpen !== 'undefined' && isMenuOpen) return;

        let isLanded = false;
        let landedPlanet = null;

        // 1. ГРАВИТАЦИЯ И СТОЛКНОВЕНИЯ (ПОСАДКА)
        // Проверяем каждое тело во вселенной
        bodies.forEach(body => {
            const dx = body.x - this.x; 
            const dy = body.y - this.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);
            
            if (dist > body.radius) {
                // Если мы в космосе - притягиваемся (F = M / R^2)
                const force = body.mass / distSq;
                this.vx += (dx / dist) * force; 
                this.vy += (dy / dist) * force;
            } else {
                // ЕСЛИ МЫ КОСНУЛИСЬ ПЛАНЕТЫ (ПОСАДКА)
                isLanded = true; 
                landedPlanet = body;
                
                // Выталкиваем корабль ровно на поверхность, чтобы не провалился в текстуры
                const nx = -dx / dist; 
                const ny = -dy / dist;
                this.x = body.x + nx * body.radius; 
                this.y = body.y + ny * body.radius;
                
                // Уравниваем скорость корабля со скоростью поверхности планеты (чтобы лететь вместе с ней)
                const planetVelX = -Math.sin(body.angle) * body.orbitSpeed * body.orbitRadius;
                const planetVelY = Math.cos(body.angle) * body.orbitSpeed * body.orbitRadius;
                this.vx = planetVelX; 
                this.vy = planetVelY;

                // ПРОВЕРКА СБОРА КАПСУЛЫ
                if (body.hasCapsule) {
                    // Координаты капсулы на поверхности
                    const capX = body.x + Math.cos(body.angle + body.capsuleLocalAngle) * body.radius;
                    const capY = body.y + Math.sin(body.angle + body.capsuleLocalAngle) * body.radius;
                    
                    // Если сели близко к капсуле (< 30 пикселей)
                    if (Math.hypot(this.x - capX, this.y - capY) < 30) { 
                        body.hasCapsule = false; // Капсула собрана
                        window.collectedCapsules++;
                        
                        // Сбрасываем цель, если мы собирали именно её
                        if (this.targetBody === body) this.targetBody = null;
                        this.autoPilotEngaged = false;
                        
                        // Запускаем событие обновления UI (сделаем в ui.js)
                        if (typeof updateUI === 'function') updateUI();
                    }
                }
            }
        });

        // 2. АВТОПИЛОТ
        if (this.autoPilotEngaged && this.targetBody) {
            // Вычисляем абсолютные координаты капсулы (с учетом вращения планеты)
            const targetX = this.targetBody.x + Math.cos(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            const targetY = this.targetBody.y + Math.sin(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            
            const dx = targetX - this.x; 
            const dy = targetY - this.y;
            const dist = Math.hypot(dx, dy);
            
            // Умное торможение: чем ближе, тем меньше желаемая скорость
            const desiredSpeed = Math.min(dist * 0.01, 5); 
            const desiredVx = (dx / dist) * desiredSpeed;
            const desiredVy = (dy / dist) * desiredSpeed;
            
            // Вычисляем вектор "руления" (разница между тем как летим и как надо)
            const steerX = desiredVx - this.vx;
            const steerY = desiredVy - this.vy;
            const targetAngle = Math.atan2(steerY, steerX);
            
            // Плавный поворот к нужной цели
            let angleDiff = targetAngle - this.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.angle += angleDiff * this.turnSpeed;

            // Включаем маршевый двигатель, только если нос смотрит примерно в нужную сторону
            if (Math.abs(angleDiff) < 0.5) {
                this.currentThrust = this.maxThrust;
            } else {
                this.currentThrust = 0;
            }
        } 
        // 3. РУЧНОЕ УПРАВЛЕНИЕ ДЖОЙСТИКОМ
        else if (joystick.active) {
            const dx = joystick.currX - joystick.startX; 
            const dy = joystick.currY - joystick.startY;
            const dist = Math.hypot(dx, dy);
            const percent = Math.min(dist / joystick.maxRadius, 1.0); // От 0 до 100% тяги
            
            if (dist > 5) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.angle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                this.angle += angleDiff * this.turnSpeed;
            }
            this.currentThrust = this.maxThrust * percent;
            this.autoPilotEngaged = false; // Перехват управления отключает автопилот
        } else {
            this.currentThrust = 0;
        }

        // 4. ПРИМЕНЕНИЕ ТЯГИ
        if (this.currentThrust > 0) {
            this.vx += Math.cos(this.angle) * this.currentThrust;
            this.vy += Math.sin(this.angle) * this.currentThrust;
            
            // Если мы лежим на планете и дали газ - даем легкий импульс для отрыва (прыжок)
            if (isLanded) {
                this.x += Math.cos(this.angle) * 2;
                this.y += Math.sin(this.angle) * 2;
            }
        }

        // 5. КОСМИЧЕСКОЕ МИКРО-ТРЕНИЕ (Чтобы скорость не стала бесконечной)
        this.vx *= 0.999; 
        this.vy *= 0.999;

        // Обновляем позицию
        this.x += this.vx; 
        this.y += this.vy;

        // 6. ЗАПИСЬ ТРАЕКТОРИИ (Оптимизированная)
        const lastPos = this.pathHistory[this.pathHistory.length - 1];
        // Записываем точку только если пролетели больше 50 пикселей
        if (!lastPos || Math.hypot(this.x - lastPos.x, this.y - lastPos.y) > 50) {
            this.pathHistory.push({ x: this.x, y: this.y });
            // Храним только последние 300 точек, чтобы не перегружать память
            if (this.pathHistory.length > 300) this.pathHistory.shift(); 
        }
    },

    draw: function(ctx, cameraZoom) {
        // 1. Отрисовка траектории (Пунктирная зеленая линия)
        if (this.pathHistory.length > 0) {
            ctx.beginPath(); 
            ctx.moveTo(this.pathHistory[0].x, this.pathHistory[0].y);
            for (let i = 1; i < this.pathHistory.length; i++) {
                ctx.lineTo(this.pathHistory[i].x, this.pathHistory[i].y);
            }
            ctx.lineTo(this.x, this.y); // Соединяем с текущей позицией
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.3)'; 
            ctx.lineWidth = 2 / cameraZoom; 
            ctx.stroke(); 
        }

        // 2. Отрисовка линии радара (направление к цели)
        if (this.targetBody) {
            const tx = this.targetBody.x + Math.cos(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            const ty = this.targetBody.y + Math.sin(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            ctx.beginPath(); 
            ctx.moveTo(this.x, this.y); 
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; // Полупрозрачный голубой
            ctx.lineWidth = 1 / cameraZoom;
            ctx.setLineDash([10 / cameraZoom, 20 / cameraZoom]); // Пунктир
            ctx.stroke(); 
            ctx.setLineDash([]); // Возвращаем нормальную линию
        }

        // --- ОТРИСОВКА САМОГО КОРАБЛЯ ---
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle);
        
        // Пламя двигателя
        if (this.currentThrust > 0) {
            ctx.beginPath(); 
            const flameLength = -8 - (this.currentThrust/this.maxThrust * 20) - Math.random() * 5;
            ctx.moveTo(-5, 0); 
            ctx.lineTo(flameLength, 0); 
            ctx.strokeStyle = '#ffaa00'; 
            ctx.lineWidth = 3 / cameraZoom; 
            ctx.stroke();
        }
        
        // Масштабируем корабль обратно зуму, чтобы он всегда был одного размера на экране
        ctx.scale(1 / cameraZoom, 1 / cameraZoom); 
        
        // Посадочные ножки
        ctx.beginPath(); 
        ctx.moveTo(-2, -6); ctx.lineTo(-8, -12); // Левая нога
        ctx.moveTo(-2, 6); ctx.lineTo(-8, 12);   // Правая нога
        ctx.strokeStyle = '#a0aab5'; 
        ctx.lineWidth = 1.5; 
        ctx.stroke();
        
        // Корпус (Таблетка)
        ctx.beginPath();
        ctx.arc(2, 0, 6, -Math.PI/2, Math.PI/2);  // Передняя полусфера
        ctx.arc(-2, 0, 6, Math.PI/2, -Math.PI/2); // Задняя полусфера
        ctx.closePath();
        ctx.fillStyle = '#12151c'; ctx.fill(); 
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

        // Голубой иллюминатор спереди
        ctx.beginPath(); 
        ctx.arc(4, 0, 2, 0, Math.PI*2); 
        ctx.fillStyle = '#00ffff'; 
        ctx.fill();
        
        ctx.restore();
    }
};
