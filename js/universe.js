// js/universe.js

const bodies = [];
const asteroids = [];
let planetCounter = 1;

// Класс для Звезд и Планет
class CelestialBody {
    constructor(type, orbitRadius, radius, color, mass) {
        this.type = type; 
        this.orbitRadius = orbitRadius; 
        this.radius = radius; 
        this.color = color; 
        this.mass = mass;
        
        // Чем дальше орбита, тем медленнее летит планета (закон Кеплера)
        // Скорость орбиты стала очень медленной, чтобы корабль мог их догнать
        this.orbitSpeed = orbitRadius === 0 ? 0 : (Math.random() * 0.1 + 0.05) / orbitRadius; 
        if (Math.random() > 0.5) this.orbitSpeed *= -1; // Вращение в разные стороны
        
        this.angle = Math.random() * Math.PI * 2; 
        this.x = 0; 
        this.y = 0;
        
        // Только у планет есть спасательные капсулы (цели)
        this.hasCapsule = type === 'planet';
        
        // Угол (координата) на самой планете, где лежит капсула
        this.capsuleLocalAngle = Math.random() * Math.PI * 2; 
        
        // Имя для меню целей
        this.name = this.hasCapsule ? `PLANET-${planetCounter++}` : 'STAR';
    }

    update() {
        // Движение по орбите
        this.angle += this.orbitSpeed;
        this.x = Math.cos(this.angle) * this.orbitRadius; 
        this.y = Math.sin(this.angle) * this.orbitRadius;
    }

    draw(ctx, cameraZoom) {
        // 1. Отрисовка красной линии орбиты (только для планет)
        if (this.type === 'planet') {
            ctx.beginPath(); 
            ctx.arc(0, 0, this.orbitRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.1)'; // Тускло-красный
            ctx.lineWidth = 2 / cameraZoom; // Линия не утолщается при зуме
            ctx.stroke();
        }
        
        // 2. Отрисовка самого твердого тела (Планеты/Звезды)
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fillStyle = this.color; 
        ctx.fill();
        ctx.strokeStyle = '#000000'; // Тонкий черный контур для объема
        ctx.lineWidth = 1; 
        ctx.stroke();

        // 3. Отрисовка мигающей капсулы на поверхности планеты
        if (this.hasCapsule) {
            // Вычисляем абсолютные координаты капсулы в космосе (Она вращается вместе с планетой)
            const capX = this.x + Math.cos(this.angle + this.capsuleLocalAngle) * this.radius;
            const capY = this.y + Math.sin(this.angle + this.capsuleLocalAngle) * this.radius;
            
            // Эффект пульсации (мигания) зеленого маячка
            const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5; 
            
            ctx.beginPath(); 
            ctx.arc(capX, capY, 8 / cameraZoom, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 100, ${pulse})`; // Неоновый зеленый
            ctx.fill();
        }
    }
}

// Класс для процедурной генерации Астероидов (камней разной формы)
class Asteroid {
    constructor(orbitRadius) {
        this.orbitRadius = orbitRadius;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.2 + 0.1) / orbitRadius;
        this.x = 0; 
        this.y = 0;
        
        // Генерируем случайную форму камня (многоугольник)
        this.points = [];
        const sides = Math.floor(Math.random() * 4) + 5; // От 5 до 8 углов
        for(let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2; // Угол вершины
            const r = Math.random() * 15 + 10;   // Расстояние от центра до вершины
            this.points.push({a, r});
        }
    }

    update() {
        this.angle += this.speed;
        this.x = Math.cos(this.angle) * this.orbitRadius; 
        this.y = Math.sin(this.angle) * this.orbitRadius;
    }

    draw(ctx, cameraZoom) {
        ctx.save(); 
        // Астероид движется по орбите и вращается вокруг своей оси (angle * 10)
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle * 10);
        
        ctx.beginPath();
        // Рисуем линии между сгенерированными вершинами
        ctx.moveTo(Math.cos(this.points[0].a) * this.points[0].r, Math.sin(this.points[0].a) * this.points[0].r);
        for(let i = 1; i < this.points.length; i++) {
            ctx.lineTo(Math.cos(this.points[i].a) * this.points[i].r, Math.sin(this.points[i].a) * this.points[i].r);
        }
        ctx.closePath();
        ctx.strokeStyle = '#445566'; // Цвет космического камня
        ctx.lineWidth = 2 / cameraZoom; 
        ctx.stroke();
        
        ctx.restore();
    }
}

// Функция сборки всей Солнечной системы
function generateSystem() {
    bodies.length = 0; 
    asteroids.length = 0; 
    planetCounter = 1;
    
    // 1. Огромная звезда в центре (Масса 3000)
    bodies.push(new CelestialBody('star', 0, 250, '#ffeeaa', 3000));
    
    // 2. Внутренние твердые планеты (Масса 150-250)
    bodies.push(new CelestialBody('planet', 1200, 60, '#5588aa', 150));
    bodies.push(new CelestialBody('planet', 2500, 80, '#aa5555', 250));
    
    // 3. Газовый гигант (Масса 600)
    bodies.push(new CelestialBody('planet', 4000, 150, '#aa8855', 600)); 
    
    // 4. Дальняя ледяная планета
    bodies.push(new CelestialBody('planet', 6000, 50, '#55aaaa', 100));
    
    // 5. Пояс астероидов (150 штук) между второй планетой и газовым гигантом
    const beltRadius = 3200;
    for(let i = 0; i < 150; i++) {
        // Разброс астероидов по кольцу шириной 400 пикселей
        asteroids.push(new Asteroid(beltRadius + (Math.random() - 0.5) * 400));
    }
}

// Запускаем генерацию сразу при загрузке файла
generateSystem();
