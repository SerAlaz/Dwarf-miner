const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Oyun ayarları
const width = canvas.width;
const height = canvas.height;
const gridSize = 20;

// Cüce aracı
class DwarfVehicle {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.speed = 5;
        this.capacity = 10;
        this.resources = 0;
        this.width = 40;
        this.height = 40;
        this.direction = { x: 0, y: 0 };
    }

    move() {
        const newX = this.x + this.direction.x * this.speed;
        const newY = this.y + this.direction.y * this.speed;
        if (newX >= 0 && newX <= width - this.width) this.x = newX;
        if (newY >= 0 && newY <= height - this.height) this.y = newY;
    }

    collect(mineral) {
        const vehicleRect = { x: this.x, y: this.y, width: this.width, height: this.height };
        const mineralRect = { x: mineral.x, y: mineral.y, width: mineral.width, height: mineral.height };
        if (vehicleRect.x < mineralRect.x + mineralRect.width &&
            vehicleRect.x + vehicleRect.width > mineralRect.x &&
            vehicleRect.y < mineralRect.y + mineralRect.height &&
            vehicleRect.y + vehicleRect.height > mineralRect.y) {
            this.resources += mineral.value;
            return true;
        }
        return false;
    }

    upgrade() {
        if (this.resources >= 50) {
            this.resources -= 50;
            this.speed += 1;
            this.capacity += 5;
            return "Vehicle Upgraded!";
        }
        return "Not Enough Resources!";
    }

    draw() {
        ctx.fillStyle = '#00FF00'; // Cüce aracı (yeşil)
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#8B4513'; // Sakal detayı
        ctx.fillRect(this.x + 10, this.y + 10, 20, 10);
    }
}

// Maden sınıfı
class Mineral {
    constructor() {
        this.x = Math.floor(Math.random() * (width - gridSize));
        this.y = Math.floor(Math.random() * (height - gridSize));
        this.value = Math.floor(Math.random() * 11) + 5;
        this.width = gridSize;
        this.height = gridSize;
    }

    draw() {
        ctx.fillStyle = '#FFD700'; // Altın maden
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Joystick sınıfı
class Joystick {
    constructor() {
        this.x = 100;
        this.y = height - 100;
        this.radius = 50;
        this.handleRadius = 20;
        this.handleX = this.x;
        this.handleY = this.y;
        this.active = false;
    }

    update(touchX, touchY) {
        if (!this.active) return;
        const dx = touchX - this.x;
        const dy = touchY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = this.radius - this.handleRadius;
        if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            this.handleX = this.x + Math.cos(angle) * maxDistance;
            this.handleY = this.y + Math.sin(angle) * maxDistance;
        } else {
            this.handleX = touchX;
            this.handleY = touchY;
        }
        dwarf.direction.x = (this.handleX - this.x) / maxDistance;
        dwarf.direction.y = (this.handleY - this.y) / maxDistance;
    }

    reset() {
        this.handleX = this.x;
        this.handleY = this.y;
        this.active = false;
        dwarf.direction = { x: 0, y: 0 };
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.handleX, this.handleY, this.handleRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Yükseltme butonu
const upgradeButton = {
    x: width - 120,
    y: height - 60,
    width: 100,
    height: 40,
    draw() {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.fillText('Upgrade', this.x + 10, this.y + 28);
    },
    checkClick(touchX, touchY) {
        return touchX >= this.x && touchX <= this.x + this.width &&
               touchY >= this.y && touchY <= this.y + this.height;
    }
};

// Oyun döngüsü
const dwarf = new DwarfVehicle();
const minerals = Array(5).fill().map(() => new Mineral());
const joystick = new Joystick();
let keys = {};
let upgradeMessage = '';
let touchId = null;

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'u') upgradeMessage = dwarf.upgrade();
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!touchId) {
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const touchX = touch.clientX - canvas.getBoundingClientRect().left;
        const touchY = touch.clientY - canvas.getBoundingClientRect().top;
        if (upgradeButton.checkClick(touchX, touchY)) {
            upgradeMessage = dwarf.upgrade();
        } else if (Math.hypot(touchX - joystick.x, touchY - joystick.y) < joystick.radius) {
            joystick.active = true;
            joystick.update(touchX, touchY);
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let touch of e.changedTouches) {
        if (touch.identifier === touchId) {
            const touchX = touch.clientX - canvas.getBoundingClientRect().left;
            const touchY = touch.clientY - canvas.getBoundingClientRect().top;
            joystick.update(touchX, touchY);
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (let touch of e.changedTouches) {
        if (touch.identifier === touchId) {
            joystick.reset();
            touchId = null;
        }
    }
});

function gameLoop() {
    dwarf.direction = { x: 0, y: 0 };
    if (keys['ArrowLeft']) dwarf.direction.x = -1;
    if (keys['ArrowRight']) dwarf.direction.x = 1;
    if (keys['ArrowUp']) dwarf.direction.y = -1;
    if (keys['ArrowDown']) dwarf.direction.y = 1;

    dwarf.move();

    for (let i = minerals.length - 1; i >= 0; i--) {
        if (dwarf.collect(minerals[i])) {
            minerals.splice(i, 1);
            minerals.push(new Mineral());
        }
    }

    ctx.fillStyle = '#1C2526';
    ctx.fillRect(0, 0, width, height);
    
    dwarf.draw();
    minerals.forEach(mineral => mineral.draw());
    joystick.draw();
    upgradeButton.draw();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Resources: ${dwarf.resources}`, 10, 20);
    ctx.fillText(`Speed: ${dwarf.speed}`, 10, 50);
    ctx.fillText(`Capacity: ${dwarf.capacity}`, 10, 80);
    ctx.fillText(upgradeMessage, 10, 110);

    requestAnimationFrame(gameLoop);
}

gameLoop();
