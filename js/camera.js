// js/camera.js
const camera = {
    x: 0, 
    y: 0, 
    zoom: 0.5,       // Стартовый зум (немного отдален)
    targetZoom: 0.5, // Зум, к которому плавно стремимся
    
    update: function() {
        // Плавное приближение/отдаление (Lerp)
        this.zoom += (this.targetZoom - this.zoom) * 0.1;
        
        // В будущем камера будет следовать за кораблем
        // Сейчас мы просто проверим, есть ли переменная ship
        if (typeof ship !== 'undefined') {
            this.x = ship.x;
            this.y = ship.y;
        }
    }
};
