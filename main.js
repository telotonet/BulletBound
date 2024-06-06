import CollisionUtils from './CollisionUtils.js';
import {Collider, CollisionHandler, CollisionManager} from './Collider.js'
import {Menu, Button, initializePauseMenu} from './Modal.js'

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
            const damageEffect = new DamageNumberEffect(this.entity, 0, 0, amount, 1000, 'black');
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
        classCount.colliders = collisionManager.getColliders().length+1;
        // classCount.collisions = collisionManager.getTotalCollisions();
        return classCount;
    }
    static getObjectsByType(type) {
        return BaseDebugger.objects.filter(obj => obj instanceof type);
    }
}

class GameObject extends BaseDebugger {
    constructor(x, y, width, height, angle = 0, dx, dy) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle; // Угол объекта
        this.createCollider();
        this.dx = dx;
        this.dy = dy;
    }

    get DrawX() {
        return this.x - camera.left;
    }

    get DrawY() {
        return this.y - camera.top;
    }
    update(){
        this.x += this.dx * deltaTime
        this.y += this.dy * deltaTime
 
    }
    createCollider() {
        this.collider = new Collider(this, this.x, this.y, this.width, this.height, this.angle);
    }

    destroy() {
        if (this.collider) {
            this.collider.destroy();
        }
        let index = BaseDebugger.objects.indexOf(this);
        if (index > -1) {
            BaseDebugger.objects.splice(index, 1);
        }
    }

    handleCollision(other) {
        // Handle ongoing collisions
    }

    onColliderEnter(other) {
        // Handle entering a collider
    }

    onColliderLeave(other) {
        // Handle leaving a collider
    }
}



















class Entity extends GameObject {
    constructor(x, y, angle, width, height, speed, health, weapon) {
        super(x, y, width, height, angle, 0, 0);
        this.speed = speed;
        this.angle = angle * Math.PI / 180;
        this.weapon = weapon;
        this.weapon.owner = this
        this.health = new Health(this, health);
        this.visualEffects = new VisualEffectStorage();
        this.spawn()
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.DrawX, this.DrawY);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'red';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
        this.visualEffects.drawEffects();
    }

    update() {
        super.update()
        this.dx = 0
        this.dy = 0
        this.visualEffects.updateEffects();
    }

    destroy() {
        super.destroy();
        const index = entities.indexOf(this);
        if (index !== -1) {
            entities.splice(index, 1);
        }
    }

    attack() {
        const entitySize = Math.max(this.width, this.height)
        this.weapon.attack(this.x, this.y, this.angle, entitySize);
    }

    spawn(){
        entities.push(this)
    }

    die() {
        this.visualEffects.clearEffects();
        this.weapon.destroy()
        const deathEffect = new DeathEffect(gameMap, 32, 32, 300, this.x, this.y)
        gameMap.visualEffects.addEffect(deathEffect)
        this.destroy();
    }

    // Handle Collision with {other} objects
    onProjectileEnter(projectile){
        if (projectile.owner == this){return} 
        this.health.change(-projectile.damage)
    }

    onCollisionWithWall(wall) {
        CollisionUtils.rigidBody(this, wall)
    }
    onCollisionWithEntity(entity) {
        CollisionUtils.rigidBody(entity, this)
    }
}

class Player extends Entity {
    constructor(x, y, angle, width, height, speed, health, weapon) {
        super(x, y, angle, width, height, speed, health, weapon);
        this.mouseX = x;
        this.mouseY = y;
        this.keysPressed = {};
        this.initControls();
        camera.target = this
    }
    update() {
        super.update();
        this.handleInput();
    }
    initControls() {
        document.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
        canvas.addEventListener('mousemove', (event) => {
            this.mouseX = event.clientX + camera.left - canvas.getBoundingClientRect().left;
            this.mouseY = event.clientY + camera.top - canvas.getBoundingClientRect().top;
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
        if (this.keysPressed['shift']) {
            this.dx *= 2
            this.dy *= 2
        }

        if ((this.keysPressed['w'] || this.keysPressed['s']) && (this.keysPressed['a'] || this.keysPressed['d'])) {
            this.dx /= Math.sqrt(2);
            this.dy /= Math.sqrt(2);
        }
    }
}
























class Wall extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height, 0, 0, 0);
        this.width = width;
        this.height = height;
        this.visualEffects = new VisualEffectStorage();
        walls.push(this);
    }

    draw(ctx) {
        ctx.save();
        // Переместим контекст к центру объекта
        ctx.translate(this.DrawX, this.DrawY);
        // Выполним вращение
        ctx.rotate(this.angle);
        // Нарисуем прямоугольник с центром в точке (0,0)
        ctx.fillStyle = 'black';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
        this.visualEffects.drawEffects();
    }

    update() {
        super.update();
        this.visualEffects.updateEffects();
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
    constructor(name, damage, speed, cooldown) {
        this.owner;
        this.name = name;
        this.damage = damage;
        this.speed = speed;
        this.cooldown = cooldown;
        this.lastAttackTime = 0;

        this.dps = this.damage / (this.cooldown / 1000);
        weapons.push(this);
    }

    destroy() {
        const index = weapons.indexOf(this);
        if (index !== -1) {
            weapons.splice(index, 1);
        }
    }

    canAttack() {
        const currentTime = gameTimer.getTime();
        return (currentTime - this.lastAttackTime) >= this.cooldown && entities.includes(this.owner);
    }

    attack(x, y, angle, entitySize) {
        if (this.canAttack()) {
            this.lastAttackTime = gameTimer.getTime();
            this.shoot(x, y, angle, entitySize);
            return true;
        }
        return false;
    }

    shoot(x, y, angle, entitySize) {
        // you should implement this method
    }
}

class RangedWeapon extends Weapon {
    constructor(name, damage, speed, cooldown, createProjectile) {
        super(name, damage, speed, cooldown);
        this.createProjectile = createProjectile;
    }

    shoot(x, y, angle, entitySize) {
        const barrelEndX = x + Math.cos(angle) * (entitySize / 2);
        const barrelEndY = y + Math.sin(angle) * (entitySize / 2);
        this.createProjectile(barrelEndX, barrelEndY, this.speed, angle, this.damage, this.owner);
    }
}














class Projectile extends GameObject {
    constructor(x, y, speed, angle, width, height, damage, color = 'violet', owner = null) {
        super(x, y, width, height, angle,
                Math.cos(angle)*speed,
                Math.sin(angle)*speed
            );
        this.visualEffects = new VisualEffectStorage();
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.owner = owner;
        projectiles.push(this);
    }

    draw(ctx) {
        this.visualEffects.drawEffects();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.DrawX, this.DrawY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        super.update()
        this.visualEffects.updateEffects();
    }

    onEntityEnter(entity) {
        if (this.owner == entity){return}
        this.destroy()
    }
    onCollisionWithWall(wall){
        this.destroy()
    }
    onWallEnter(wall){
        this.onCollisionWithWall(wall)
    }

    destroy() {
        super.destroy();
        const index = projectiles.indexOf(this);
        if (index !== -1) {
            projectiles.splice(index, 1);
        }
    }
}

class ImpulseProjectile extends Projectile{
    constructor(x, y, speed, angle, width, height, damage, color = 'blue', owner){
        super(x, y, speed, angle, width, height, damage, color, owner)
    }
    onCollisionWithProjectile(other){
        CollisionUtils.rigidBody(this, other)
    }
    onCollisionWithImpulseProjectile(other){
        CollisionUtils.rigidBody(this, other)
    }
    onCollisionWithWall(other){
        CollisionUtils.rigidBody(this, other, 1)
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
    constructor(entity, width, height, duration, x , y) {
        super(x, y, width, height, 0, 0, 0)
        this.entity = entity;
        this.duration = duration;
        this.elapsedTime = 0;
        this.startTime =  gameTimer.getTime();
    }
    onCreate(){}

    draw(ctx) {
        // You should implement this method
    }

    update() {
        super.update()
        this.elapsedTime = gameTimer.getTime() - this.startTime;
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
    constructor(entity, width, height, value, duration, color, x, y, font= 'Cooper Black', fontSize=30) {
        super(entity, width, height, duration, x, y);
        this.value = value;
        this.y = this.entity.y;
        this.color = color;
        this.speed = 1; // Numbers Y movespeed
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
        ctx.fillText(this.value.toFixed(1), this.DrawX, this.DrawY);
        ctx.restore();
    }
    update(){
        super.update()
        this.y -= (this.elapsedTime / this.duration) * this.speed * deltaTime
        this.x = this.entity.x
    }
}

class DeathEffect extends VisualEffect {
    constructor(entity, width, height, duration, x, y, colors=['blue', 'lightblue', 'yellow']) {
        super(entity, width, height, duration, x, y);
        this.maxRadius = width; 
        this.minRadius = width/4; 
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
            this.radius += this.growthSpeed*deltaTime;
            if (this.radius >= this.maxRadius) {
                this.expanding = false;
            }
        } else {
            this.radius -= this.growthSpeed*deltaTime;
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
    constructor(width, height){
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

class GameTimer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastUpdate = 0;
        this.paused = true;
    }

    start() {
        if (this.paused) {
            this.paused = false;
            this.lastUpdate = performance.now();
        }
    }

    pause() {
        if (!this.paused) {
            this.paused = true;
            this.elapsedTime += performance.now() - this.lastUpdate;
        }
    }

    reset() {
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.paused = true;
    }

    getTime() {
        if (this.paused) {
            return this.elapsedTime;
        } else {
            return this.elapsedTime + (performance.now() - this.lastUpdate);
        }
    }
}


class Camera {
    constructor(ctx, gameMap, target, width, height, smoothness = 0.15) {
        this.ctx = ctx;
        this.gameMap = gameMap;
        this.height = height;
        this.width = width;
        this.target = target;
        this._x = 0;
        this._y = 0;
        this.smoothness = smoothness;

        this.shakeIntensity = 0;
        this.lastShakeTime
    }
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    get x(){return this._x}
    get y(){return this._y}
    set x(value){this._x = this.target.x}
    set y(value){this._y = this.target.y}
    get top(){return this.y - this.height/2}
    get bottom(){return this.y + this.height/2}
    get left(){return this.x - this.width/2}
    get right(){return this.x + this.width/2}


    update() {
        this._x = this.lerp(this.x, this.target.x, this.smoothness)
        this._y = this.lerp(this.y, this.target.y, this.smoothness)
        this.shake()
    }
    shake(){
        if (this.shakeIntensity > 0) {
            this._x += (Math.random() - 0.5) * this.shakeIntensity
            this._y += (Math.random() - 0.5) * this.shakeIntensity
        }
    }

    startShake(intensity){
        this.shakeIntensity = intensity
    }
    stopShake(){
        this.shakeIntensity = 0
    }


    getVisibleObjects(objects) {
        const visibleObjects = [];
        
        for (const obj of objects) {
            const vertices = obj.collider.getVertices();
            
            let visible = false;
            for (const vertex of vertices) {
                if (
                    vertex.x >= this.left &&
                    vertex.x <= this.right &&
                    vertex.y >= this.top &&
                    vertex.y <= this.bottom
                ) {
                    visible = true;
                    break;
                }
            }

            if (visible) {
                visibleObjects.push(obj);
            }
        }

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



const createPlayerProjectile = (x, y, speed, angle, damage, owner) => {
    return new Projectile(x, y, speed, angle, 15, 15, damage, 'green', owner); // Произвольные параметры
};
const createEnemyProjectile = (x, y, speed, angle, damage, owner) => {
    return new ImpulseProjectile(x, y, speed, angle, 15, 15, damage, 'blue', owner); // Произвольные параметры
};


let projectiles = []
let weapons = []
let modals = []
let entities = []

const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasObj = new Canvas(ctx, canvas.width, canvas.height);
const gameMap = new GameMap(Infinity, Infinity)
const gameTimer = new GameTimer();
const updater = new Updater()
const collisionManager = new CollisionManager();
const camera = new Camera(ctx, gameMap, {x:0, y:0}, BASE_WIDTH, BASE_HEIGHT, 0.1)
const renderer = new Renderer(ctx, camera)


const playerWeapon = new RangedWeapon('Custom Gun', 10, 15, 3, createPlayerProjectile);

const enemyWeapon = new RangedWeapon('Custom Gun', 15, 10, 100, createEnemyProjectile);



const player = new Player(canvas.width / 2, canvas.height / 2, 0, 45, 45, 8, 100, playerWeapon);
const enemy = new Entity(500, 400, 0, 52, 52, 5, 100, enemyWeapon)







const levelGrid = [
    [1, 1, 1, 1, 1, 0 ,0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1,0,0,0,0,0,0],
    [1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
];



function loadLevel(levelData) {
    const tileSize = 50;

    levelData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 1) {
                new Wall(colIndex * tileSize, rowIndex * tileSize, tileSize, tileSize);
                            }
        });
    });

}
let walls = [];
loadLevel(levelGrid)


window.addEventListener('resize', () => {
    resize()
});
function resize(){
    const aspectRatio = 4 / 3;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Adjust the canvas size to maintain a 4:3 aspect ratio
    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    const scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    if(scale < 1){
        ctx.imageSmoothingEnabled = true; // turn it on for low res screens
    }else{
        ctx.imageSmoothingEnabled = false; // turn it off for high res screens.
    }
    ctx.scale(scale, scale);
}

// DEBUG
let debug = 1

// FPS COUNTER
let fps = 0;
let lastFpsUpdate = performance.now();
let framesThisSecond = 0;

// PAUSE
let requestId;
let paused = false;

// GAME TIMER
let lastTimestamp = performance.now();
let deltaTime = 0;
let wall = new Wall(500, 300, 200, 30)
function gameLoop() {
    wall.angle += 0.05
    if (!paused) {
        const timestamp = performance.now();
        deltaTime = (timestamp - lastTimestamp) / 33; // Relative to my developing pc 30 fps
        lastTimestamp = timestamp;
        updateAndDrawGame();

        const now = performance.now();
        framesThisSecond++;
        fps = Math.round((framesThisSecond * 1000) / (now - lastFpsUpdate));
        if (now - lastFpsUpdate >= 1000) {
            lastFpsUpdate = now;
            framesThisSecond = 0;
            document.getElementById('fps-info').textContent = 'FPS: ' + fps;
        }

        document.getElementById('object-count').textContent = `Objects: ` + JSON.stringify(BaseDebugger.getObjectClassCount(), null, 2);
        document.getElementById('timer').textContent = `Timer: ` + JSON.stringify(gameTimer.getTime(), null, 2);
    }
    modals.forEach(modal => {
        modal.draw(ctx);
        modal.update();
    });
    requestId = requestAnimationFrame(gameLoop);
}



function updateAndDrawGame() {



    gameTimer.start();
    // enemy.attack()
    canvasObj.draw(ctx, camera);
    updater.update(BaseDebugger.objects)
    updater.update([camera, gameMap, canvasObj]);
    collisionManager.update();

    gameMap.draw(ctx, camera);
    renderer.draw(BaseDebugger.objects);

    if (debug) {
        collisionManager.getColliders().forEach(collider => {
            collider.draw(ctx);
        });
    }
}

function pauseGame() {
    let framesThisSecond = 0

    paused = true;
    gameTimer.pause();
}

function resumeGame() {
    if (paused) {
        paused = false;
        lastTimestamp = performance.now()
        gameTimer.start();
    }
}

function switchPause(){
    const currentTime = performance.now();
    if (currentTime - lastPauseToggleTime > PAUSE_TOGGLE_COOLDOWN) {
        switch (paused){
            case false:
                pauseMenu.show()
                pauseGame(); break
            case true:
                pauseMenu.hide()
                resumeGame(); break
        }
        lastPauseToggleTime = currentTime;
    }
}
function switchDebug(){
    switch(debug){
        case 0:
            debug = 1; break
        case 1:
            debug = 0; break
    }
}

let pauseMenu = initializePauseMenu();
let lastPauseToggleTime = 0;


const PAUSE_TOGGLE_COOLDOWN = 1000;
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        switchPause()
    }
});

gameLoop();

export {Collider, deltaTime, pauseGame, resumeGame, modals, camera, updater, BASE_WIDTH, BASE_HEIGHT, switchDebug, canvas, collisionManager}