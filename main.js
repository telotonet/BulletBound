class Health {
    constructor(entity, maxHealth) {
        this.entity = entity
        this.health = maxHealth;
        this.maxHealth = maxHealth;
    }

    change(amount, percent = false, base) {
        if (percent) {
            if (!base) {
                base = this.maxHealth
            } 
            const changeAmount = (base * amount) / 100;
            this.health += changeAmount;
        } else {
            this.health += amount;
        }
        if (amount < 0) {
            const damageEffect = new DamageNumberEffect(this.entity, 15, amount, 1000, 'black');
            this.entity.visualEffects.addEffect(damageEffect);
        }
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        } else if (this.health <= 0) {
            this.health = 0;
            this.entity.die()
        }

    }
}


class BaseDebugger {
    constructor() {
        BaseDebugger.objects.push(this);
    }
    static objects = []; // Debugging counter
    static getObjectClassCount() {
        const classCount = {};
        for (const obj of BaseDebugger.objects) {
            const className = obj.constructor.name;
            if (!classCount[className]) {
                classCount[className] = 1;
            } else {
                classCount[className]++;
            }
        }
        return classCount;
    }
    static getObjectsByType(type) {
        return BaseDebugger.objects.filter(obj => obj instanceof type);
    }
}

class GameObject extends BaseDebugger {
    constructor(x, y, size) {
        super();
        this.x = x;
        this.y = y;
        this.size = size;
        this.collider = new Collider(this, x, y, size, size);
    }
    get DrawX() {
        return this.x - camera.x;
    }

    get DrawY() {
        return this.y - camera.y;
    }

    destroy() {
        this.collider.destroy()
        let index = BaseDebugger.objects.indexOf(this);
        if (index > -1) {
            BaseDebugger.objects.splice(index, 1);
        }
    }
    handleCollision(otherCollider){
        /* this method calls when this and any other collider touch each other
        According to the Double Dispatch pattern, you must call the collision method of otherCollider with this.collider
        */
    }
}

class Collider {
    constructor(owner, x, y, width, height) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        collisionManager.addCollider(this)
    }

    get left()   { return this.owner.x - this.width / 2 }
    get right()  { return this.owner.x + this.width / 2 }
    get top()    { return this.owner.y - this.height/ 2 }
    get bottom() { return this.owner.y + this.height/ 2 }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.owner.x - camera.x, this.owner.y - camera.y);
        // ctx.rotate(this.owner.angle);
        ctx.strokeStyle = 'rgb(13, 207, 0)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.moveTo(this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.stroke();
        ctx.restore();
    }

    update() {
        this.x = this.owner.x
        this.y = this.owner.y
    }

    isCollidingWith(otherCollider) {
        return (
            this.right > otherCollider.left &&
            this.left < otherCollider.right &&
            this.bottom > otherCollider.top &&
            this.top < otherCollider.bottom
        );
    }

    handleCollision(otherCollider) {
        this.owner.handleCollision(otherCollider.owner);
    }

    destroy(){
        collisionManager.removeCollider(this)
    }
}

class CollisionManager {
    /* 
    Double Dispatch is used in game colliders to handle interactions between game objects of different types more flexibly and conveniently. 
    Instead of a single object determining the interaction logic, double dispatch involves both objects in the decision-making process. 
    This allows for more dynamic handling of collisions. 
    For example, a Player object colliding with an Enemy object can trigger different behavior than a Player object colliding with a Wall object. 
    Each object involved in the collision can dictate its specific response, making the collision system more adaptable and easier to extend.
    */
    constructor() {
        this.colliders = [];
    }

    addCollider(collider) {
        this.colliders.push(collider);
    }

    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index > -1) {
            this.colliders.splice(index, 1);
        }
    }
    getColliders(){
        return this.colliders
    }

    update() {
        // Try-catch blocks for handling non-existent methods on game objects
        for (let i = 0; i < this.colliders.length; i++) {
            for (let j = i + 1; j < this.colliders.length; j++) {
                const colliderA = this.colliders[i];
                const colliderB = this.colliders[j];
                if (colliderA.isCollidingWith(colliderB)) {
                    try {
                        colliderA.handleCollision(colliderB);
                    } catch (error) {}
                    try {
                        colliderB.handleCollision(colliderA);
                    } catch (error) {}

                }
            }
        }
    }
}















class Entity extends GameObject {
    constructor(x, y, angle, size, speed, health, weapon) {
        super(x, y, size);
        this.speed = speed;
        this.dx = 0;
        this.dy = 0;
        this.angle = angle * Math.PI / 180;
        this.weapon = weapon;
        this.health = new Health(this, health);
        this.visualEffects = new VisualEffectStorage();
    }

    draw(ctx, camera) {
        ctx.fillStyle = 'red';
        const x = this.DrawX;
        const y = this.DrawY;
        ctx.fillRect(x - this.size / 2, y - this.size / 2, this.size, this.size);
        this.visualEffects.drawEffects();
    }

    update() {
        this.move();
        this.visualEffects.updateEffects();
    }

    handleCollision(other){
        other.onCollisionWithEntity(this)
    }

    onCollisionWithProjectile(projectile){
        this.health.change(-projectile.damage)
    }
    onCollisionWithWall(wall) {
        const overlapX = this.getOverlap(this.collider.left, this.collider.right, wall.collider.left, wall.collider.right);
        const overlapY = this.getOverlap(this.collider.top, this.collider.bottom, wall.collider.top, wall.collider.bottom);

        // Pushing out of the wall
        if (Math.abs(overlapX) < Math.abs(overlapY)) {
            this.x -= overlapX;
            this.dx = 0;
        } else {
            this.y -= overlapY;
            this.dy = 0;
        }
    }

    getOverlap(minA, maxA, minB, maxB) {
        return (minA < minB) ? maxA - minB : minA - maxB;
    }

    onCollisionWithEntity(entity){
        this.onCollisionWithWall(entity)
    }

    destroy() {
        super.destroy();
        const index = entities.indexOf(this);
        if (index !== -1) {
            entities.splice(index, 1);
        }
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
    }

    attack() {
        this.weapon.attack(this.x, this.y, this.angle, this.size);
    }

    die() {
        this.visualEffects.clearEffects();
        const deathEffect = new DeathEffect(gameMap, 32, 300, this.x, this.y)
        gameMap.visualEffects.addEffect(deathEffect)
        this.destroy();
        this.weapon.destroy();
    }
}

class Player extends Entity {
    constructor(x, y, angle, size, speed, health, weapon) {
        super(x, y, angle, size, speed, health, weapon);
        this.mouseX = x;
        this.mouseY = y;
        this.keysPressed = {};
        this.initControls();
    }
    draw(ctx) {
        // Рисуем игрока, учитывая его поворот
        ctx.save(); // Сохраняем текущее состояние контекста

        ctx.translate(this.DrawX, this.DrawY); // Переносим начало координат в центр игрока
        ctx.rotate(this.angle); // Поворачиваем контекст на угол игрока
        ctx.fillStyle = 'red';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size); // Рисуем игрока относительно его центра
        ctx.restore(); // Восстанавливаем исходное состояние контекста
        this.visualEffects.drawEffects();

    }
    update() {
        this.handleInput();
        super.update();
    }

    initControls() {
        document.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
        canvas.addEventListener('mousemove', (event) => {
            this.mouseX = event.clientX + camera.x - canvas.getBoundingClientRect().left;
            this.mouseY = event.clientY + camera.y - canvas.getBoundingClientRect().top;
            this.angle = Math.atan2(this.mouseY - this.y, this.mouseX - this.x);
        });
    }

    handleInput() {
        const speed = this.speed * Math.sqrt(2) / 2;
        this.dx = 0;
        this.dy = 0;

        if (this.keysPressed['w'] && !this.keysPressed['s']) {
            this.dy -= speed;
        }
        if (this.keysPressed['s'] && !this.keysPressed['w']) {
            this.dy += speed;
        }
        if (this.keysPressed['a'] && !this.keysPressed['d']) {
            this.dx -= speed;
        }
        if (this.keysPressed['d'] && !this.keysPressed['a']) {
            this.dx += speed;
        }
        if (this.keysPressed['q']) {
            this.attack();
        }

        if ((this.keysPressed['w'] || this.keysPressed['s']) && (this.keysPressed['a'] || this.keysPressed['d'])) {
            this.dx /= Math.sqrt(2);
            this.dy /= Math.sqrt(2);
        }
    }
}
























class Wall extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, Math.max(width, height));
        this.width = width;
        this.height = height;
        this.visualEffects = new VisualEffectStorage()
    }
    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.DrawX - this.width / 2, this.DrawY - this.height / 2, this.width, this.height);
        this.visualEffects.drawEffects()
    }
    update(){
        this.visualEffects.updateEffects()
    }
    handleCollision(other) {
        other.onCollisionWithWall(this);
    }
    onCollisionWithProjectile(projectile){
    }
    die(){
        this.destroy()
    }

    destroy() {
        super.destroy();
        const index = walls.indexOf(this);
        if (index !== -1) {
            walls.splice(index, 1);
        }
    }
}












class Weapon {
    constructor(name, damage, speed, cooldown, projectileClass) {
        this.name = name;
        this.damage = damage;
        this.speed = speed;
        this.cooldown = cooldown;
        this.projectileClass = projectileClass;
        this.lastAttackTime = 0; 

        this.dps =  this.damage / (this.cooldown/1000)
        weapons.push(this)
    }

    destroy(){
        const index = weapons.indexOf(this);
        if (index !== -1) {
            weapons.splice(index, 1); // Delete this weapon
        }
    }

    canAttack() {
        if (weapons.includes(this)){
            const currentTime = Date.now();
            return (currentTime - this.lastAttackTime) >= this.cooldown;
        } return false
    }

    attack() {
        if (this.canAttack()) {
            this.lastAttackTime = Date.now();
            return true
        }
        return false
    }
}

class RangedWeapon extends Weapon {
    constructor(name, damage, speed, cooldown, projectileClass, projectileSize = 3) {   
        super(name, damage, speed, cooldown, projectileClass);
        this.projectileSize = projectileSize;
    }

    attack(x, y, angle, entitySize) {
        if (super.attack()) {
            this.shoot(x, y, angle, entitySize)
        } 
    }
    shoot(x, y, angle, entitySize) {
        const barrelEndX = x + Math.cos(angle) * (entitySize/2+10);
        const barrelEndY = y + Math.sin(angle) * (entitySize/2+10);
        const projectile = new this.projectileClass(
            barrelEndX,
            barrelEndY,
            this.speed,
            angle,
            this.projectileSize,
            this.damage
        );
    
        return projectile;
    }
}
















class Projectile extends GameObject {
    constructor(x, y, speed, angle, size, damage, color = 'violet') {
        super(x, y, size);
        this.visualEffects = new VisualEffectStorage();
        this.speed = speed;
        this.angle = angle;
        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;
        this.damage = damage;
        this.color = color;
        projectiles.push(this);
    }

    draw(ctx) {
        this.visualEffects.drawEffects();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.DrawX, this.DrawY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.visualEffects.updateEffects();
    }


    handleCollision(other) {
        other.onCollisionWithProjectile(this);
    }


    onCollisionWithProjectile(other){
        console.log('proj')
    }
    onCollisionWithWall(wall) {
        this.destroy();
    }

    onCollisionWithEntity(entity) {
        this.destroy();
    }

    destroy() {
        super.destroy();
        const index = projectiles.indexOf(this);
        if (index !== -1) {
            projectiles.splice(index, 1);
        }
    }

}
















class Particle extends GameObject{
    // Base class for any particles in visual effects
    constructor(x, y, size, dx, dy, color){
        super(x,y,size)
        this.dx = dx
        this.dy = dy
        this.color = color
    }
    draw(){
        ctx.fillStyle = this.color
        ctx.fillRect(this.DrawX, this.DrawY, this.size, this.size);
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
    }
}

class VisualEffectStorage {
    constructor() {
        this.effects = []; 
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    removeEffect(effect) {
        const index = this.effects.indexOf(effect);
        if (index !== -1) {
            this.effects.splice(index, 1);
        }
    }

    getEffects() {
        return this.effects;
    }

    updateEffects(){
        this.getEffects().forEach(effect => effect.update());
    }

    drawEffects(){
        this.getEffects().forEach(effect => effect.draw(ctx, camera));
    }

    clearEffects() {
        this.getEffects().forEach(effect => effect.destroy());
    }
}

class VisualEffect extends GameObject{
    constructor(entity, size, duration, x , y) {
        super(x, y, size)
        this.entity = entity;
        this.duration = duration;
        this.elapsedTime = 0;
        this.startTime = performance.now();
    }

    onCreate(){
    }

    draw(ctx) {
        // You must implement this method
    }

    update() {
        this.elapsedTime = performance.now() - this.startTime;
        if (this.elapsedTime >= this.duration) {
            this.destroy()
        }
    }

    destroy() {
        super.destroy()
        this.entity.visualEffects.removeEffect(this);
    }
}

class DamageNumberEffect extends VisualEffect {
    constructor(entity, size, value, duration, color, x, y, font= 'Cooper Black', fontSize=30) {
        super(entity, size, duration, x, y);
        this.value = value;
        this.y = this.entity.y;
        this.color = color;
        this.speed = 3; // Numbers Y movespeed
        this.font = font
        this.fontSize = fontSize
        this.onCreate()
    }

    onCreate(){
        const existingEffectIndex = this.entity.visualEffects.getEffects().findIndex(e => e instanceof DamageNumberEffect);
        if (existingEffectIndex !== -1) {
            const existingEffect = this.entity.visualEffects.getEffects()[existingEffectIndex];
            existingEffect.destroy()
            this.value += existingEffect.value;
        }
    }
    draw(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize}px ${this.font}`;
        this.y -= this.speed * (this.elapsedTime / this.duration);
        this.x = this.entity.x
        ctx.fillText(this.value.toFixed(1), this.DrawX, this.DrawY);
        ctx.restore();
    }
}

class DeathEffect extends VisualEffect {
    constructor(entity, size, duration, x, y, colors=['blue', 'lightblue', 'yellow']) {
        super(entity, size, duration, x, y);
        this.maxRadius = size; 
        this.minRadius = size/4; 
        this.growthSpeed = 5;
        this.radius = 6;
        this.colors = colors; 
        this.colorIndex = 0;
        this.expanding = true;
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.beginPath();
        const x = this.DrawX;
        const y = this.DrawY;

        const currentRadius = this.radius;
    
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);
        for (let i = 0; i < this.colors.length; i++) {
            gradient.addColorStop(i / (this.colors.length - 1), this.colors[i]);
        }
        ctx.fillStyle = gradient;
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        super.update();
        // increase or decrease depending on the phase (this.expanding)
        if (this.expanding) {
            this.radius += this.growthSpeed;
            if (this.radius >= this.maxRadius) {
                this.expanding = false;
            }
        } else {
            this.radius -= this.growthSpeed;
            if (this.radius <= this.minRadius) {
                this.expanding = true
            }
        }

        // Переключаемся между цветами в массиве цветов
        this.colorIndex = Math.floor((this.elapsedTime / this.duration) * (this.colors.length - 1));
    }
}




















class Renderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
    }

    draw(objects) {
        const visibleObjects = this.camera.getVisibleObjects(objects);
        visibleObjects.forEach(object => {
            object.draw(ctx, camera);
        });
    }
}
class Updater {
    constructor() {}
    update(objects) {
        objects.forEach(object => {
            object.update();
        });
    }
}





class GameMap{
    constructor(height, width){
        this.visualEffects = new VisualEffectStorage()
        this.height = height;
        this.width = width;
    }
    update(){
        this.visualEffects.updateEffects()
    }
    draw(){
        this.visualEffects.drawEffects()
    }
}


class Camera {
    constructor(ctx, gameMap, canvas, player, height, width) {
        this.ctx = ctx;
        this.gameMap = gameMap;
        this.canvas = canvas;
        this.height = height;
        this.width = width;
        this.player = player;
        this.centerX = this.player.x;
        this.centerY = this.player.y;
        this.x = 0; // Изменяем начальные значения координат камеры
        this.y = 0;
        this.offsetX = this.width / 2; // Смещение для центрирования игрока на экране
        this.offsetY = this.height / 2;
    }

    update() {
        this.centerX = this.player.x;
        this.centerY = this.player.y;
        // Обновляем координаты камеры, чтобы она следовала за игроком, учитывая смещение для центрирования
        this.x = this.centerX - this.offsetX;
        this.y = this.centerY - this.offsetY;

        // Проверяем, чтобы камера не выходила за границы карты
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > this.gameMap.width) {
            this.x = this.gameMap.width - this.width;
        }

        if (this.y < 0) {
            this.y = 0;
        } else if (this.y + this.height > this.gameMap.height) {
            this.y = this.gameMap.height - this.height;
        }
    }

    getVisibleObjects(objects) {
        const visibleObjects = [];
        const cameraLeft = this.x;
        const cameraRight = this.x + this.width;
        const cameraTop = this.y;
        const cameraBottom = this.y + this.height;
        objects.forEach(object => {
            // Проверяем, находится ли объект в зоне видимости камеры
            if (object.x + object.size > cameraLeft && object.x < cameraRight &&
                object.y + object.size > cameraTop && object.y < cameraBottom) {
                visibleObjects.push(object);
            }
        });
        return visibleObjects;
    }
}

class Canvas {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.visualEffects = new VisualEffectStorage()
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        this.visualEffects.drawEffects()
    }

    update() {
        this.visualEffects.updateEffects()
    }
}







let projectiles = []; // Array to store projectiles
let weapons = []

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasObj = new Canvas(ctx, canvas.width, canvas.height);

const gameMap = new GameMap(1300, 1300)

const weapon = new RangedWeapon('Bow', 10, 13, 150, Projectile, 5)
const enemyWeapon = new RangedWeapon('Bow', -10, 10, 300, Projectile, 5)

const collisionManager = new CollisionManager();

const player = new Player(canvas.width / 2, canvas.height / 2, 0, 30, 5, 100, weapon);
const camera = new Camera(ctx, gameMap, canvasObj, player, canvas.height, canvas.width)
const enemy = new Entity(700, 400, 135, 30, 5, 100, enemyWeapon)

const entities = [player, enemy]


const updater = new Updater()
const renderer = new Renderer(ctx, camera)


const levelGrid = [
    [1, 1, 1, 1, 1, 0 ,0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0,0,0,0,0,0,0],
    [1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
];



function loadLevel(levelData) {
    const walls = [];
    const tileSize = 50;

    levelData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                const wall = new Wall(colIndex * tileSize, rowIndex * tileSize, tileSize, tileSize);
                walls.push(wall);
            }
        });
    });

    return walls;
}



const tileSize = 50;
const walls = loadLevel(levelGrid);












let debug = true
let fps = 0;
let lastFpsUpdate = performance.now();
let framesThisSecond = 0;
let requestId;
let paused = false; // Флаг состояния паузы

function gameLoop() {
    if (!paused) {
        updateAndDrawGame();

        const now = performance.now();
        framesThisSecond++;
        fps = Math.round((framesThisSecond * 1000) / (now - lastFpsUpdate));
        if (now - lastFpsUpdate >= 1000) {
            lastFpsUpdate = now;
            framesThisSecond = 0;
        }
        document.getElementById('fps-info').textContent = 'FPS: ' + fps;
        document.getElementById('object-count').textContent = `Objects: ` + JSON.stringify(BaseDebugger.getObjectClassCount(), null, 2);;
    }

    requestId = requestAnimationFrame(gameLoop);
}

function updateAndDrawGame() {
    canvasObj.draw(ctx, camera);
    updater.update(entities);
    updater.update(projectiles);
    updater.update([camera, gameMap]);
    updater.update([canvasObj]);
    updater.update(walls);
    collisionManager.update();
    gameMap.draw(ctx, camera);
    renderer.draw(projectiles);
    renderer.draw(walls);
    renderer.draw(entities);
    if (debug){
        collisionManager.getColliders().forEach(collider => {
            collider.draw(ctx)
        });
    }
}

function pauseGame() {
    paused = true;
    cancelAnimationFrame(requestId);
}

function resumeGame() {
    if (paused) {
        paused = false;
        lastFpsUpdate = performance.now(); // Сброс времени для точного расчета FPS
        gameLoop();
    }
}

// Пример использования
document.addEventListener('keydown', (event) => {
    if (event.key === 'p') {
        if (!paused){
            pauseGame();
        } else {
            resumeGame();
        }
    }
});

gameLoop();
