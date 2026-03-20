// js/ui.js

const topHud = document.getElementById('top-hud');
const hud = document.getElementById('hud');
const tgtBtn = document.getElementById('tgt-btn');
const autoBtn = document.getElementById('auto-btn');
const turboBtn = document.getElementById('turbo-btn'); // Наша новая кнопка
const targetMenu = document.getElementById('target-menu');
const targetList = document.getElementById('target-list');
const closeBtn = document.getElementById('close-btn');
const winMsg = document.getElementById('win-msg');

// Глобальная функция обновления UI (вызывается из главного цикла loop)
window.updateUI = function() {
    // 1. Верхний HUD (Статичная инфа + счетчик)
    topHud.innerHTML = `STAR: REDVELVETCAKE MINOR^Q
CLASS: A
RADIUS: 7193
MASS: 5.85e+11
CAPSULES: ${window.collectedCapsules} / ${window.totalCapsules}`;

    // Если всё собрано - показываем победу
    if (window.collectedCapsules === window.totalCapsules && window.totalCapsules > 0) {
        winMsg.style.display = 'block';
    }

    // 2. Нижний HUD (Телеметрия корабля)
    if (typeof ship !== 'undefined') {
        const speed = Math.round(Math.hypot(ship.vx, ship.vy) * 10); 
        // Если лежим на планете, высота 0
        const altitude = ship.isLanded ? 0 : Math.round(Math.hypot(ship.x, ship.y));
        const posX = ship.x > 0 ? `+${Math.round(ship.x)}` : Math.round(ship.x);
        const posY = ship.y > 0 ? `+${Math.round(ship.y)}` : Math.round(ship.y);
        const thrStr = Math.round((ship.currentThrust / ship.maxThrust) * 100);
        
        let tgtStr = "NONE";
        let exeStr = "WAITING FOR TARGET";

        if (ship.targetBody) {
            tgtStr = ship.targetBody.name;
            const tx = ship.targetBody.x + Math.cos(ship.targetBody.angle + ship.targetBody.capsuleLocalAngle) * ship.targetBody.radius;
            const ty = ship.targetBody.y + Math.sin(ship.targetBody.angle + ship.targetBody.capsuleLocalAngle) * ship.targetBody.radius;
            const dist = Math.round(Math.hypot(tx - ship.x, ty - ship.y));
            
            if (ship.autoPilotEngaged) {
                exeStr = `APPROACHING (DV=${Math.round(speed/2)} D=${dist})`;
            } else {
                exeStr = `LOCKED (D=${dist})`;
            }
        }

        hud.innerHTML = `TGT: ${tgtStr}
EXE: ${exeStr}

ALT: ${altitude}
THR: ${thrStr}%
POS: < ${posX}, ${posY} >
VEL: ${speed}`;

        // 3. Управление кнопкой AUTO
        if (ship.autoPilotEngaged) {
            autoBtn.classList.add('active');
        } else {
            autoBtn.classList.remove('active');
        }

        // 4. Управление кнопкой TURBO (вкл/выкл)
        if (ship.isLanded) {
            turboBtn.classList.remove('disabled');
        } else {
            turboBtn.classList.add('disabled');
        }
    }
};

// --- ОБРАБОТЧИКИ КНОПОК ---

// Кнопка TGT (Выбор цели)
tgtBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); 
    isMenuOpen = true; 
    
    // Если есть джойстик, отключаем его
    if (typeof joystick !== 'undefined') joystick.active = false; 
    
    targetList.innerHTML = ''; 
    
    // Ищем только те планеты, на которых еще лежат капсулы
    const targets = bodies.filter(b => b.hasCapsule);
    
    if (targets.length === 0) {
        targetList.innerHTML = '<div style="color:#5588aa; text-align:center;">NO TARGETS FOUND</div>';
    } else {
        targets.forEach(target => {
            const div = document.createElement('div'); 
            div.className = 'target-item';
            div.innerHTML = `<span>${target.name}</span>`;
            
            div.addEventListener('pointerdown', (ev) => { 
                ev.stopPropagation(); 
                ship.targetBody = target; // Устанавливаем цель
                targetMenu.style.display = 'none'; 
                isMenuOpen = false; 
            });
            targetList.appendChild(div);
        });
    }
    targetMenu.style.display = 'block'; 
});

// Кнопка закрытия меню
closeBtn.addEventListener('pointerdown', (e) => { 
    e.stopPropagation(); 
    targetMenu.style.display = 'none'; 
    isMenuOpen = false; 
});

// Кнопка AUTO (Автопилот)
autoBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (typeof ship !== 'undefined' && ship.targetBody) {
        ship.autoPilotEngaged = !ship.autoPilotEngaged; // Переключатель
    }
});

// Кнопка TURBO (Взлет)
turboBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    // Активируем рывок, только если лежим на планете
    if (typeof ship !== 'undefined' && ship.isLanded) {
        ship.isTurboActive = true; 
    }
});
