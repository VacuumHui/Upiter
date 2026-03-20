// js/ship.js

// Глобальные переменные для прогресса
window.collectedCapsules = 0;
window.totalCapsules = 4;

const ship = {
    x: 0, 
    y: -400, 
    vx: 5, 
    vy: 0, 
    angle: -Math.PI/2, 
    
    maxThrust: 0.1,    // Тяга двигателя
    turnSpeed: 0.25,   // Резкий, отзывчивый поворот
    currentThrust: 0, 
    
    pathHistory: [], 
    targetBody: null, 
    autoPilotEngaged: false,
    
    isLanded: false,      // Флаг: стоим ли мы на планете
    isTurboActive: false, // Флаг: нажата ли кнопка TURBO

    update: function() {
        // Пауза, если открыто меню
        if (typeof isMenuOpen !== 'undefined' && isMenuOpen) return;

        this.isLanded = false; 
        let landedPlanet = null;

        // 1. ГРАВИТАЦИЯ И СТОЛКНОВЕНИЯ
        bodies.forEach(body => {
            const dx = body.x - this.x; 
            const dy = body.y - this.y;
            const distSq = dx * dx + dy * dy; 
            const dist = Math.sqrt(distSq);
            
            if (dist > body.radius) {
                // Притяжение в космосе
                const force = body.mass / distSq;
                this.vx += (dx / dist) * force; 
                this.vy += (dy / dist) * force;
            } else {
                // ПОСАДКА НА ПЛАНЕТУ
                this.isLanded = true; 
                landedPlanet = body;
                
                // Выталкиваем на поверхность
                const nx = -dx / dist; 
                const ny = -dy / dist;
                this.x = body.x + nx * body.radius; 
                this.y = body.y + ny * body.radius;
                
                // Уравниваем скорость со скоростью орбиты планеты
                const planetVelX = -Math.sin(body.angle) * body.orbitSpeed * body.orbitRadius;
                const planetVelY = Math.cos(body.angle) * body.orbitSpeed * body.orbitRadius;
                this.vx = planetVelX; 
                this.vy = planetVelY;

                // Сбор капсулы
                if (body.hasCapsule) {
                    const capX = body.x + Math.cos(body.angle + body.capsuleLocalAngle) * body.radius;
                    const capY = body.y + Math.sin(body.angle + body.capsuleLocalAngle) * body.radius;
                    if (Math.hypot(this.x - capX, this.y - capY) < 20) { 
                        body.hasCapsule = false; 
                        window.collectedCapsules++;
                        if (this.targetBody === body) this.targetBody = null;
                        this.autoPilotEngaged = false;
                    }
                }
            }
        });

        // 2. ВЗЛЕТНЫЙ ТУРБО-УСКОРИТЕЛЬ (НОВАЯ МЕХАНИКА)
        if (this.isTurboActive && this.isLanded) {
            // Мощный рывок вперед (по направлению носа)
            const turboForce = 12;
            this.vx += Math.cos(this.angle) * turboForce;
            this.vy += Math.sin(this.angle) * turboForce;
            
            // Чуть сдвигаем корабль с текстуры планеты, чтобы он сразу полетел
            this.x += Math.cos(this.angle) * 5;
            this.y += Math.sin(this.angle) * 5;
            
            this.isTurboActive = false; // Отключаем турбо после выстрела
        }

        // 3. АВТОПИЛОТ
        if (this.autoPilotEngaged && this.targetBody) {
            const tx = this.targetBody.x + Math.cos(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            const ty = this.targetBody.y + Math.sin(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            const dx = tx - this.x; const dy = ty - this.y; const dist = Math.hypot(dx, dy);
            
            // Торможение перед посадкой
            const desiredSpeed = Math.min(dist * 0.02, 6); 
            const desiredVx = (dx / dist) * desiredSpeed; 
            const desiredVy = (dy / dist) * desiredSpeed;
            const steerX = desiredVx - this.vx; 
            const steerY = desiredVy - this.vy;
            const targetAngle = Math.atan2(steerY, steerX);
            
            let angleDiff = targetAngle - this.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.angle += angleDiff * this.turnSpeed;

            if (Math.abs(angleDiff) < 0.5) this.currentThrust = this.maxThrust; else this.currentThrust = 0;
        } 
        // 4. ДЖОЙСТИК (РУЧНОЕ УПРАВЛЕНИЕ)
        else if (typeof joystick !== 'undefined' && joystick.active) {
            const dx = joystick.currX - joystick.startX; 
            const dy = joystick.currY - joystick.startY;
            const dist = Math.hypot(dx, dy); 
            const percent = Math.min(dist / joystick.maxRadius, 1.0); 
            
            if (dist > 5) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.angle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                this.angle += angleDiff * this.turnSpeed;
            }
            this.currentThrust = this.maxThrust * percent;
            this.autoPilotEngaged = false; // Отключаем автопилот при касании
        } else {
            this.currentThrust = 0;
        }

        // 5. ОБЫЧНАЯ ТЯГА ДВИГАТЕЛЯ
        if (this.currentThrust > 0 && !this.isTurboActive) {
            this.vx += Math.cos(this.angle) * this.currentThrust;
            this.vy += Math.sin(this.angle) * this.currentThrust;
            
            // Если лежим на планете и даем обычный газ - слабо ползем
            if (this.isLanded) { 
                this.x += Math.cos(this.angle) * 2; 
                this.y += Math.sin(this.angle) * 2; 
            }
        }

        // Космическое микро-трение
        this.vx *= 0.995; 
        this.vy *= 0.995; 
        
        this.x += this.vx; 
        this.y += this.vy;

        // 6. ИСТОРИЯ (ТРАЕКТОРИЯ)
        const lastPos = this.pathHistory[this.pathHistory.length - 1];
        if (!lastPos || Math.hypot(this.x - lastPos.x, this.y - lastPos.y) > 20) {
            this.pathHistory.push({ x: this.x, y: this.y });
            if (this.pathHistory.length > 300) this.pathHistory.shift(); 
        }
    },

    draw: function(ctx, cameraZoom) {
        // Пунктир (Тонкий, зеленый)
        if (this.pathHistory.length > 0) {
            ctx.beginPath(); 
            ctx.moveTo(this.pathHistory[0].x, this.pathHistory[0].y);
            for (let i = 1; i < this.pathHistory.length; i++) ctx.lineTo(this.pathHistory[i].x, this.pathHistory[i].y);
            ctx.lineTo(this.x, this.y); 
            ctx.strokeStyle = 'rgba(50, 200, 100, 0.4)'; 
            ctx.lineWidth = 1 / cameraZoom; 
            ctx.setLineDash([5 / cameraZoom, 10 / cameraZoom]); 
            ctx.stroke(); 
            ctx.setLineDash([]);
        }

        // Указатель радара к цели
        if (this.targetBody) {
            const tx = this.targetBody.x + Math.cos(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            const ty = this.targetBody.y + Math.sin(this.targetBody.angle + this.targetBody.capsuleLocalAngle) * this.targetBody.radius;
            ctx.beginPath(); 
            ctx.moveTo(this.x, this.y); 
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; 
            ctx.lineWidth = 1 / cameraZoom; 
            ctx.stroke(); 
        }

        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle);
        
        // Огонь (Меняет длину от тяги)
        if (this.currentThrust > 0) {
            ctx.beginPath(); 
            const flameLength = -6 - (this.currentThrust/this.maxThrust * 15) - Math.random() * 3;
            ctx.moveTo(-3, 0); 
            ctx.lineTo(flameLength, 0); 
            ctx.strokeStyle = '#ffaa00'; 
            ctx.lineWidth = 2 / cameraZoom; 
            ctx.stroke();
        }
        
        // ОРИГИНАЛЬНЫЙ КОРАБЛЬ: Строгий треугольник
        ctx.beginPath(); 
        ctx.moveTo(8, 0);   // Нос
        ctx.lineTo(-4, -5); // Левое крыло
        ctx.lineTo(-2, 0);  // Корма
        ctx.lineTo(-4, 5);  // Правое крыло
        ctx.closePath();
        
        ctx.fillStyle = '#0b0f19'; 
        ctx.fill(); 
        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = 1.5 / cameraZoom; 
        ctx.stroke();

        ctx.restore();
    }
};
