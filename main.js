import CollisionUtils from './CollisionUtils.js';
import CollisionHandler from './CollisionHandler.js'

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
        classCount.collisions = collisionManager.getTotalCollisions();
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
        return this.x - camera.x;
    }

    get DrawY() {
        return this.y - camera.y;
    }
    update(){
        this.x += this.dx
        this.y += this.dy
 
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

export default class Collider {
    constructor(owner, x, y, width, height, angle = 0) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle; // Угол коллайдера
        this.collidingWith = new Set();
        collisionManager.addCollider(this);
    }

    static project(vertices, axis) {
        let min = Infinity;
        let max = -Infinity;
        for (let vertex of vertices) {
            const projection = vertex.x * axis.x + vertex.y * axis.y;
            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }
        return { min, max };
    }

    static overlap(projA, projB) {
        return projA.max >= projB.min && projB.max >= projA.min;
    }

    getVertices() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);
        return [
            { x: this.x + cosA * -hw - sinA * -hh, y: this.y + sinA * -hw + cosA * -hh },
            { x: this.x + cosA * hw - sinA * -hh, y: this.y + sinA * hw + cosA * -hh },
            { x: this.x + cosA * hw - sinA * hh, y: this.y + sinA * hw + cosA * hh },
            { x: this.x + cosA * -hw - sinA * hh, y: this.y + sinA * -hw + cosA * hh }
        ];
    }

    getAxes() {
        const vertices = this.getVertices()
        const axes = [];
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            const normal = { x: -edge.y, y: edge.x };
            // Нормализуем ось
            const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            axes.push({ x: normal.x / length, y: normal.y / length });
        }
        return axes;
    }

    drawDirection(ctx, dx, dy) {
        ctx.beginPath();
        ctx.moveTo(this.owner.DrawX, this.owner.DrawY);
        const length = 15;
        const endX = this.owner.DrawX + dx * length;
        const endY = this.owner.DrawY + dy * length;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "rgb(13, 207, 0)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
    draw(ctx) {
        const vertices = this.getVertices();
        this.drawDirection(ctx, this.owner.dx, this.owner.dy)
    
        ctx.strokeStyle = 'rgb(13, 207, 0)';
        ctx.lineWidth = 2;
    
        ctx.beginPath();
        for (let i = 0; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x - camera.x, vertices[i].y - camera.y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    update() {
        this.x = this.owner.x;
        this.y = this.owner.y;
        this.angle = this.owner.angle;
    }

    isCollidingWith(otherCollider) {
        const verticesA = this.getVertices();
        const verticesB = otherCollider.getVertices();

        const axes = [...this.getAxes(), ...otherCollider.getAxes()];

        for (let axis of axes) {
            const projectionA = Collider.project(verticesA, axis);
            const projectionB = Collider.project(verticesB, axis);

            if (!Collider.overlap(projectionA, projectionB)) {
                return false;
            }
        }
        return true;
    }



    handleCollision(otherCollider) {
        const isColliding = this.isCollidingWith(otherCollider);

        if (isColliding && !this.collidingWith.has(otherCollider)) {
            this.collidingWith.add(otherCollider);
            otherCollider.collidingWith.add(this);
            CollisionHandler.onEnter(this.owner, otherCollider.owner);
        } else if (!isColliding && this.collidingWith.has(otherCollider)) {
            this.collidingWith.delete(otherCollider);
            otherCollider.collidingWith.delete(this);
            CollisionHandler.onLeave(this.owner, otherCollider.owner);
        }

        if (isColliding) {
            CollisionHandler.onCollision(this.owner, otherCollider.owner);
        }
    }


    removeSelfFromColliders() {
        for (const otherCollider of this.collidingWith) {
            otherCollider.collidingWith.delete(this);
        }
    }

    destroy() {
        this.removeSelfFromColliders();
        collisionManager.removeCollider(this);
    }
}

class CollisionManager {
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

    getColliders() {
        return this.colliders;
    }

    getTotalCollisions() {
        let totalCollisions = 0;
        for (const collider of this.colliders) {
            totalCollisions += collider.collidingWith.size;
        }
        return totalCollisions;
    }

    update() {
        this.getColliders().forEach(collider => {
            collider.update()
            
        });
        for (let i = 0; i < this.colliders.length; i++) {
            for (let j = i + 1; j < this.colliders.length; j++) {
                const colliderA = this.colliders[i];
                const colliderB = this.colliders[j];
                colliderA.handleCollision(colliderB);
            }
        }
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
        this.move();
        this.visualEffects.updateEffects();
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
        this.dx = 0
        this.dy = 0
    }

    attack() {
        const entitySize = Math.max(this.width, this.height)
        this.weapon.attack(this.x, this.y, this.angle, entitySize);
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
        CollisionUtils.rigidBody(this, wall, 1)
    }

    onCollisionWithEntity(entity){
        CollisionUtils.rigidBody(entity, this, 2)
    }
}

class Player extends Entity {
    constructor(x, y, angle, width, height, speed, health, weapon) {
        super(x, y, angle, width, height, speed, health, weapon);
        this.mouseX = x;
        this.mouseY = y;
        this.keysPressed = {};
        this.initControls();
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
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.DrawX - this.width / 2, this.DrawY - this.height / 2, this.width, this.height);
        this.visualEffects.drawEffects();
    }

    update() {
        super.update()
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

class SlimeWall extends Wall {
    onCollisionWithEntity(entity) {
        // entity.speed *= 0.99;
    }

    handleCollision(other) {
        // Specific handling for SlimeWall collisions
    }
    onEntityEnter(entity){
        entity.speed *= 0.5
    }
    onEntityLeave(entity){
        entity.speed *= 2   
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
        const currentTime = Date.now();
        return (currentTime - this.lastAttackTime) >= this.cooldown && entities.includes(this.owner);
    }

    attack(x, y, angle, entitySize) {
        if (this.canAttack()) {
            this.lastAttackTime = Date.now();
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
        super(x, y, width, height, 0)
        this.entity = entity;
        this.duration = duration;
        this.elapsedTime = 0;
        this.startTime = performance.now();
    }

    onCreate(){
    }

    draw(ctx) {
        // You should implement this method
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
    constructor(entity, width, height, value, duration, color, x, y, font= 'Cooper Black', fontSize=30) {
        super(entity, width, height, duration, x, y);
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
    createCollider(){}
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


class Camera {
    constructor(ctx, gameMap, player, width, height) {
        this.ctx = ctx;
        this.gameMap = gameMap;
        this.height = height;
        this.width = width;
        this.player = player;
        this.centerX = this.player.x;
        this.centerY = this.player.y;
        this.x = 0; // Изменяем начальные значения координат камеры
        this.y = 0;
        this.offsetX = this.width/2; // Смещение для центрирования игрока на экране
        this.offsetY = this.height/2;
    }

    update() {
        this.centerX = this.player.x;
        this.centerY = this.player.y;
        // Обновляем координаты камеры, чтобы она следовала за игроком, учитывая смещение для центрирования
        this.x = this.centerX - this.offsetX;
        this.y = this.centerY - this.offsetY;

        // Проверяем, чтобы камера не выходила за границы карты
        if (this.x + this.width > this.gameMap.width) {
            this.x = this.gameMap.width - this.width;
        }

        if (this.y + this.height > this.gameMap.height) {
            this.y = this.gameMap.height - this.height;
        }
    }

    getVisibleObjects(objects) {
        const visibleObjects = [];
        
        for (const obj of objects) {
            const vertices = obj.collider.getVertices();
            
            let visible = false;
            for (const vertex of vertices) {
                if (
                    vertex.x >= this.x &&
                    vertex.x <= this.x + this.width &&
                    vertex.y >= this.y &&
                    vertex.y <= this.y + this.height
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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasObj = new Canvas(ctx, canvas.width, canvas.height);
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
const gameMap = new GameMap(Infinity, Infinity)

const playerWeapon = new RangedWeapon('Custom Gun', 10, 15, 100, createPlayerProjectile);

const enemyWeapon = new RangedWeapon('Custom Gun', 15, 10, 100, createEnemyProjectile);

const collisionManager = new CollisionManager();

const player = new Player(canvas.width / 2, canvas.height / 2, 0, 52, 52, 5, 100, playerWeapon);
const camera = new Camera(ctx, gameMap, player, BASE_WIDTH, BASE_HEIGHT)

const enemy = new Entity(500, 400, 0, 30, 20, 5, 100, enemyWeapon)
const enemy2 = new Entity(500, 405, 0, 30, 20, 5, 100, enemyWeapon)

const entities = [player, enemy, enemy2]


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
    [1,0,0,0,0,0,0],
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












let debug = 1
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
    // Отрисовка объектов с учетом масштабирования
    canvasObj.draw(ctx, camera);
    updater.update(BaseDebugger.objects)
    updater.update([camera, gameMap]);
    updater.update([canvasObj]);
    gameMap.draw(ctx, camera);
    renderer.draw(projectiles);
    renderer.draw(walls);
    renderer.draw(entities);
    collisionManager.update();

    if (debug) {
        collisionManager.getColliders().forEach(collider => {
            collider.draw(ctx);
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
