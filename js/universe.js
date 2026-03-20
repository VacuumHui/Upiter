// js/universe.js

const bodies = [];
const asteroids = [];
let planetCounter = 1;

class CelestialBody {
    constructor(type, orbitRadius, radius, color, mass) {
        this.type = type; this.orbitRadius = orbitRadius; this.radius = radius; this.color = color; this.mass = mass;
        this.orbitSpeed = orbitRadius === 0 ? 0 : (Math.random() * 0.2 + 0.1) / orbitRadius;
        if (Math.random() > 0.5) this.orbitSpeed *= -1;
        this.angle = Math.random() * Math.PI * 2; this.x = 0; this.y = 0;
        this.hasCapsule = type === 'planet';
        this.capsuleLocalAngle = Math.random() * Math.PI * 2; 
        this.name = this.hasCapsule ? `PLANET-${planetCounter++}` : 'STAR';
    }

    update() {
        this.angle += this.orbitSpeed;
        this.x = Math.cos(this.angle) * this.orbitRadius; this.y = Math.sin(this.angle) * this.orbitRadius;
    }

    draw(ctx, cameraZoom) {
        // Тонкие красные орбиты как в оригинале
        if (this.type === 'planet') {
            ctx.beginPath(); ctx.arc(0, 0, this.orbitRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200, 40, 40, 0.4)'; 
            ctx.lineWidth = 1 / cameraZoom; 
            ctx.stroke();
        }
        
        // Строгие планеты (без мультяшной обводки)
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fillStyle = this.color; ctx.fill();

        // Капсула (Маленькое желтое кольцо, как в оригинале)
        if (this.hasCapsule) {
            const capX = this.x + Math.cos(this.angle + this.capsuleLocalAngle) * this.radius;
            const capY = this.y + Math.sin(this.angle + this.capsuleLocalAngle) * this.radius;
            const pulse = Math.sin(Date.now() / 200) * 1.5 + 4; 
            ctx.beginPath(); ctx.arc(capX, capY, pulse, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5 / cameraZoom; ctx.stroke();
        }
    }
}

class Asteroid {
    constructor(orbitRadius) {
        this.orbitRadius = orbitRadius; this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.2 + 0.1) / orbitRadius;
        this.x = 0; this.y = 0;
        this.points = []; const sides = Math.floor(Math.random() * 3) + 5;
        for(let i=0; i<sides; i++) { this.points.push({a: (i/sides)*Math.PI*2, r: Math.random()*8+6}); }
    }
    update() { this.angle += this.speed; this.x = Math.cos(this.angle) * this.orbitRadius; this.y = Math.sin(this.angle) * this.orbitRadius; }
    draw(ctx, cameraZoom) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle * 5);
        ctx.beginPath(); ctx.moveTo(Math.cos(this.points[0].a)*this.points[0].r, Math.sin(this.points[0].a)*this.points[0].r);
        for(let i=1; i<this.points.length; i++) ctx.lineTo(Math.cos(this.points[i].a)*this.points[i].r, Math.sin(this.points[i].a)*this.points[i].r);
        ctx.closePath(); ctx.strokeStyle = '#556677'; ctx.lineWidth = 1/cameraZoom; ctx.stroke(); ctx.restore();
    }
}

function generateSystem() {
    bodies.length = 0; asteroids.length = 0; planetCounter = 1;
    // Возвращаем более компактные размеры
    bodies.push(new CelestialBody('star', 0, 100, '#ffffff', 2000)); 
    bodies.push(new CelestialBody('planet', 600, 25, '#5588aa', 100));
    bodies.push(new CelestialBody('planet', 1200, 35, '#aa5555', 200));
    bodies.push(new CelestialBody('planet', 2000, 60, '#aa8855', 400)); 
    bodies.push(new CelestialBody('planet', 3000, 20, '#55aaaa', 80));
    const beltRadius = 1600;
    for(let i=0; i<150; i++) asteroids.push(new Asteroid(beltRadius + (Math.random() - 0.5) * 200));
}
generateSystem();
