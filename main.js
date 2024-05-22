class HealthBar {
    constructor(entity, maxWidth, height, distance, healthColor, emptyColor='gray') {
        this.entity = entity;
        this.maxWidth = maxWidth;
        this.height = height;
        this.distance = distance; // between entity and healthbar
        this.healthColor = healthColor;
        this.emptyColor = emptyColor;
    }

    draw(ctx, camera) {
        // Healthbar position
        const xPos = this.entity.x - this.maxWidth / 2 - camera.x;
        const yPos = this.entity.y - this.entity.size / 2 - this.distance - this.height - camera.y;

        // Draw healthbar border
        ctx.strokeStyle = this.emptyColor;
        ctx.strokeRect(xPos, yPos, this.maxWidth, this.height);

        // Current health width
        const currentWidth = (this.entity.health.health / this.entity.health.maxHealth) * this.maxWidth;
        ctx.fillStyle = this.healthColor;
        ctx.fillRect(xPos, yPos, currentWidth, this.height);

        // Empty color width
        ctx.fillStyle = this.emptyColor;
        ctx.fillRect(xPos + currentWidth, yPos, this.maxWidth - currentWidth, this.height);
    }
}


class Health {
    constructor(entity, maxHealth) {
        this.entity = entity
        this.health = maxHealth;
        this.maxHealth = maxHealth;
    }

    change(amount, percent = false, base) {
        if (percent) {
            // Change health by a certain percent of ...
            if (!base) {
                // ... max health, if there is no base
                base = this.maxHealth
            } 
            // ... base, f.e {player.health} or something else
            const changeAmount = (base * amount) / 100;
            this.health += changeAmount;
        } else {
            // Change health by a certain amount
            this.health += amount;
        }

        // Check for exceeding maximum and minimum health
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        } else if (this.health <= 0) {
            this.health = 0;
            this.entity.die()
        }

        // Add healing or damaging effect 
        if (amount < 0) {
            const damageEffect = new DamageNumberEffect(this.entity, 30, amount, 1000, 'black');
            this.entity.visualEffects.addEffect(damageEffect);
        } else if (amount > 0) {
            const healingEffect = new HealingEffect(this.entity, 10, 2000, amount);
            this.entity.visualEffects.addEffect(healingEffect);
        }
    }
}



class GameObject{
     /* Base class for all objects
    Game objects must have X and Y coordinates
    in order to be drawn on the camera
    F.e Player/VisualEffects/Walls etc */
    static count = 0; // Debugging counter
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        GameObject.count++

    }
    get DrawX(){
        // X-coord relative to camera X
        return this.x - camera.x
    }
    get DrawY(){
        // Y-coord relative to camera Y
        return this.y - camera.y
    }

    destroy(){
        GameObject.count--
    }
}


class Collider {
    constructor(owner, x, y, width, height) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get left() {
        return this.x;
    }

    get right() {
        return this.x + this.width;
    }

    get top() {
        return this.y;
    }

    get bottom() {
        return this.y + this.height;
    }

    isCollidingWith(otherCollider) {
        return (
            this.right > otherCollider.left &&
            this.left < otherCollider.right &&
            this.bottom > otherCollider.top &&
            this.top < otherCollider.bottom
        );
    }
}

















class Entity extends GameObject {
    // Base class for any living entity
    // that has HP and can be killed
    constructor(x, y, angle, size, speed, health, weapon) {
        super(x, y, size)
        this.speed = speed;
        this.dx = 0;
        this.dy = 0;
        this.angle = angle * Math.PI / 180;
        this.weapon = weapon;
        this.health = new Health(this, health);
        this.healthBar = new HealthBar(this, 50, 7, 7, 'lightred');

        this.visualEffects = new VisualEffectStorage(); 
    }

    draw(ctx, camera) {
        ctx.fillStyle = 'red';
        const x = this.DrawX - this.size/2
        const y = this.DrawY - this.size/2
        ctx.fillRect(x, y, this.size, this.size);
        this.visualEffects.drawEffects();
        this.healthBar.draw(ctx, camera)
    }

    update() {
        this.move();
        this.visualEffects.updateEffects();
    }

    destroy(){
        super.destroy()
        const index = entities.indexOf(this);
        if (index !== -1) {
            entities.splice(index, 1); 
        }
    }
    move() {
        const newX = this.x + this.dx;
        const newY = this.y + this.dy;

        // Проверяем столкновение
        if (!this.checkWallCollision(newX, newY, levelGrid, tileSize)) {
            this.x = newX;
            this.y = newY;
        }
    }

    attack(){
        this.weapon.attack(this.x, this.y, this.angle, this.size)
    } 

    die(){
        const deathEffect = new DeathEffect(gameMap, 10, 400, this.x, this.y);
        gameMap.visualEffects.addEffect(deathEffect);
        this.destroy();
        this.weapon.destroy();
    }

    checkWallCollision(newX, newY, levelGrid, tileSize) {
        const col = Math.floor(newX / tileSize);
        const row = Math.floor(newY / tileSize);
        return levelGrid[row] && levelGrid[row][col] === 1;
    }
    
    checkBoundaries(gameMap) {
        if (this.x < this.size / 2) {
            this.x = this.size / 2;
        } else if (this.x > gameMap.width - this.size / 2) {
            this.x = gameMap.width - this.size / 2;
        }

        if (this.y < this.size / 2) {
            this.y = this.size / 2;
        } else if (this.y > gameMap.height - this.size / 2) {
            this.y = gameMap.height - this.size / 2;
        }
    }

    // handleCollision(gameObj) {
    //     const entityLeft = this.x - this.size / 2;
    //     const entityRight = this.x + this.size / 2;
    //     const entityTop = this.y - this.size / 2;
    //     const entityBottom = this.y + this.size / 2;
    
    //     const objLeft = gameObj.x;
    //     const objRight = gameObj.x + gameObj.width;
    //     const objTop = gameObj.y;
    //     const objBottom = gameObj.y + gameObj.height;
    
    //     const dxLeft = entityLeft - objRight;
    //     const dxRight = objLeft - entityRight;
    //     const dyTop = entityTop - objBottom;
    //     const dyBottom = objTop - entityBottom;
    
    //     const minDx = Math.min(Math.abs(dxLeft), Math.abs(dxRight));
    //     const minDy = Math.min(Math.abs(dyTop), Math.abs(dyBottom));
    
    //     if (minDx < minDy) {
    //         if (Math.abs(dxLeft) < Math.abs(dxRight)) {
    //             this.x -= dxLeft;
    //         } else {
    //             this.x += dxRight;
    //         }
    //         this.dx = 0;
    //     } else {
    //         if (Math.abs(dyTop) < Math.abs(dyBottom)) {
    //             this.y -= dyTop;
    //         } else {
    //             this.y += dyBottom;
    //         }
    //         this.dy = 0;
    //     }
    // }
}

class Player extends Entity {
    constructor(x, y, angle, size, speed, health, weapon) {
        super(x, y, angle, size, speed, health, weapon);
        this.healthBar = new HealthBar(this, 50, 7, 7, 'lightgreen');
        this.mouseX = x;
        this.mouseY = y;
        this.keysPressed = {};
        this.initControls();
    }

    draw(ctx, camera) {
        // Рисуем игрока, учитывая его поворот
        ctx.save(); // Сохраняем текущее состояние контекста

        ctx.translate(this.DrawX, this.DrawY); // Переносим начало координат в центр игрока
        ctx.rotate(this.angle); // Поворачиваем контекст на угол игрока
        ctx.fillStyle = 'red';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size); // Рисуем игрока относительно его центра
        ctx.restore(); // Восстанавливаем исходное состояние контекста
        this.visualEffects.drawEffects();
        this.healthBar.draw(ctx, camera);

    }

    update() {
        this.handleInput();
        this.move();
        this.visualEffects.updateEffects();
        this.checkBoundaries(gameMap);
    }

    initControls() {
        // Keyboard controls on down and up keys
        document.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
        // Mouse controls
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

        // Calculating an angle between player and cursor
        

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
        if(this.keysPressed['q']){ // q key for attack
            this.attack();
        }

        // Если зажаты клавиши движения по диагонали, уменьшаем скорость
        if ((this.keysPressed['w'] || this.keysPressed['s']) && (this.keysPressed['a'] || this.keysPressed['d'])) {
            this.dx /= Math.sqrt(2);
            this.dy /= Math.sqrt(2);
        }
    }
}

























class Wall extends GameObject{
    constructor(x, y, width, height) {
        super(x, y, width)
        this.width = width;
        this.height = height;
        this.left = this.x;
        this.right = this.x + this.width;
        this.top = this.y;
        this.bottom = this.y + this.height;
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.DrawX, this.DrawY, this.width, this.height);
    }

    update() {
        // if (this.isCollidingWithWall(gameObj)) {
            // gameObj.handleCollision(this);
        // }
    }
    isCollidingWithWall(gameObj) {
        return (
            gameObj.x - gameObj.size / 2 < this.x + this.width &&
            gameObj.x + gameObj.size / 2 > this.x &&
            gameObj.y - gameObj.size / 2 < this.y + this.height &&
            gameObj.y + gameObj.size / 2 > this.y
        );
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
            this.lastAttackTime = Date.now(); // Update last attack time
            // Implement attack logic here
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
        // Создаем снаряд с учетом вычисленных компонентов скорости и новых начальных координат
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

class MeleeWeapon extends Weapon {
    constructor(name, damage, range) {
        super(name, damage);
        this.range = range;
    }

    attack(entity) {
        // Implement melee attack logic here
    }
}


















class Projectile extends GameObject {
    constructor(x, y, speed, angle, size, damage, color='blue', slowdownFactor=1, minSpeed=0.1) {
        super(x, y, size);
        this.visualEffects = new VisualEffectStorage(); 
        this.speed = speed;
        this.angle = angle;
        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;
        this.damage = damage;
        this.color = color;
        this.slowdownFactor = slowdownFactor;
        this.minSpeed = minSpeed;
        projectiles.push(this);
    }

    draw(ctx, camera) {
        this.visualEffects.drawEffects();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.DrawX, this.DrawY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.dx *= this.slowdownFactor;
        this.dy *= this.slowdownFactor;

        // Проверяем суммарную скорость вместо отдельных компонент
        const speedSquared = this.dx * this.dx + this.dy * this.dy;
        if (speedSquared/100 < this.minSpeed * this.minSpeed) {
            this.destroy();
        }

        this.x += this.dx;
        this.y += this.dy;
        this.checkCollisions();
        this.visualEffects.updateEffects();
    }

    destroy() {
        super.destroy();
        const index = projectiles.indexOf(this);
        if (index !== -1) {
            projectiles.splice(index, 1);
        }
    }

    checkCollisions() {
        this.checkGameMapCollision();
        this.checkWallCollision(walls);
        this.checkEntityCollisions();
    }

    isCollidingWithGameMap() {
        return (
            this.y > 0 &&
            this.y < gameMap.height &&
            this.x > 0 &&
            this.x < gameMap.width
        );
    }

    checkGameMapCollision() {
        if (!this.isCollidingWithGameMap()) {
            this.destroy();
        }
    }

    checkWallCollision(walls) {
        walls.forEach((wall) => {
            if (this.isCollidingWithWall(wall)) {
                this.destroy();
            }
        });
    }

    isCollidingWithWall(wall) {
        const projectileLeft = this.x - this.size;
        const projectileRight = this.x + this.size;
        const projectileTop = this.y - this.size;
        const projectileBottom = this.y + this.size;

        return (
            projectileRight > wall.left &&
            projectileLeft < wall.right &&
            projectileBottom > wall.top &&
            projectileTop < wall.bottom
        );
    }

    checkEntityCollisions() {
        entities.forEach((entity) => {
            if (this.isCollidingWithEntity(entity)) {
                entity.health.change(-this.damage);
                this.destroy();
            }
        });
    }

    isCollidingWithEntity(entity) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < entity.size / 2 + this.size;
    }
}

class BouncingProjectile extends Projectile {
    constructor(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed) {
        super(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed);
        this.startX = x;
        this.startY = y;
    }

    handleCollision(normal) {
        // Вектор скорости
        let velocity = { x: this.dx, y: this.dy };
        // Проекция скорости на нормаль
        let dotProduct = velocity.x * normal.x + velocity.y * normal.y;
        // Новая скорость с учетом отскока
        this.dx = velocity.x - 2 * dotProduct * normal.x;
        this.dy = velocity.y - 2 * dotProduct * normal.y;
    }

    checkWallCollision(walls) {
        walls.forEach((wall) => {
            let collisionDetected = false;
            let collisionNormal = {x: 0, y: 0};

            // Предсказанные координаты снаряда
            const projectileNextX = this.x + this.dx;
            const projectileNextY = this.y + this.dy;

            // Края снаряда
            const projectileLeft = projectileNextX;
            const projectileRight = projectileNextX + this.size;
            const projectileTop = projectileNextY;
            const projectileBottom = projectileNextY + this.size;

            // Горизонтальные коллизии
            if (projectileRight > wall.left && projectileLeft < wall.right) {
                if (projectileTop < wall.bottom && projectileBottom > wall.top) {
                    if (this.dy > 0 && projectileBottom > wall.top && this.y - this.size <= wall.top) {
                        collisionNormal = {x: 0, y: -1}; // Нормаль для верхней стенки
                        collisionDetected = true;
                    } else if (this.dy < 0 && projectileTop < wall.bottom && this.y + this.size >= wall.bottom) {
                        collisionNormal = {x: 0, y: 1}; // Нормаль для нижней стенки
                        collisionDetected = true;
                    }
                }
            }

            // Вертикальные коллизии
            if (projectileBottom > wall.top && projectileTop < wall.bottom) {
                if (projectileLeft < wall.right && projectileRight > wall.left) {
                    if (this.dx > 0 && projectileRight > wall.left && this.x - this.size <= wall.left) {
                        collisionNormal = {x: -1, y: 0}; // Нормаль для левой стенки
                        collisionDetected = true;
                    } else if (this.dx < 0 && projectileLeft < wall.right && this.x + this.size >= wall.right) {
                        collisionNormal = {x: 1, y: 0}; // Нормаль для правой стенки
                        collisionDetected = true;
                    }
                }
            }

            if (collisionDetected) {
                this.handleCollision(collisionNormal);
            }
        });
    }
}

class CircularProjectile extends Projectile {
    constructor(x, y, speed, angle, size, damage, radius=55) {
        super(x, y, speed, angle, size, damage);
        this.radius = radius;
        this.centerX = x; // Начальное положение по X
        this.centerY = y; // Начальное положение по Y
        this.time = angle; // Время для определения угла
    }

    update() {
        // Увеличиваем угол для движения по окружности
        this.angle += this.speed;
        // Пересчитываем координаты по новому углу
        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;
        // Проверяем столкновения
        this.checkCollisions();
        this.visualEffects.updateEffects();
    }
}

class ExplosionProjectile extends BouncingProjectile {
    constructor(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed) {
        super(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed)
        this.color = 'green'
        this.slowdownFactor = 0.93
        this.minSpeed = 0.25
    }
    
    destroy(){
        super.destroy()
        const explosionEffect = new ExplosionEffect(gameMap, 15, 2000, 51, this.x, this.y);
        gameMap.visualEffects.addEffect(explosionEffect)
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
        this.effects = [];
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

class ExplosionParticle extends BouncingProjectile {
    constructor(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed){
        super(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed)
    }
    draw(ctx, camera) {
        this.visualEffects.drawEffects();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.DrawX, this.DrawY, this.size, this.size);
    }
}

class VisualEffect extends GameObject{
    constructor(entity, size, duration, x , y) {
        super(x, y, size)
        this.entity = entity;
        this.duration = duration;
        this.elapsedTime = 0;
        this.startTime = performance.now();
        this.active = true;
    }

    onCreate(){
    }

    draw(ctx) {
        // You must implement this method
    }

    update() {
        // Use super.update() before your implementation

        // Update elapsedTime to check the duration
        this.elapsedTime = performance.now() - this.startTime;
        // Kill this effect after the effect ends
        if (this.elapsedTime >= this.duration) {
            this.destroy()
        }
    }

    destroy() {
        this.entity.visualEffects.removeEffect(this);
        super.destroy()
    }
}

class DamageNumberEffect extends VisualEffect {
    constructor(entity, size, value, duration, color, x, y) {
        super(entity, size, duration, x, y);
        this.value = value;
        this.y = this.entity.y;
        this.color = color;
        this.speed = 3; // Numbers Y movespeed
        this.onCreate()
    }

    onCreate(){
        const existingEffectIndex = this.entity.visualEffects.getEffects().findIndex(e => e instanceof DamageNumberEffect);
        if (existingEffectIndex !== -1) {
            // Save value and delete previous effect
            // related to this entity
            // Create new effect with current damage + prev. damage
            const existingEffect = this.entity.visualEffects.getEffects()[existingEffectIndex];
            this.value += existingEffect.value;
            this.entity.visualEffects.removeEffect(existingEffect);
        }
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Cooper Black`;
        this.y -= this.speed * (this.elapsedTime / this.duration);
        this.x = this.entity.x
        ctx.fillText(this.value.toFixed(1), this.DrawX, this.DrawY);
        ctx.restore();
    }
}

class HealingEffect extends VisualEffect {
    constructor(entity, size, duration, amount) {
        super(entity, size, duration);
        this.speed = 1;
        this.color = 'green';
        this._numParticles = amount;
        this.particles = [];
        this.timers = [];
        this.x = this.entity.x;
        this.y = this.entity.y;
        this.minInterval = this.duration/3
        this.generateParticles()
    }

    generateParticles() {
        // Create particles (Game Object instance) around the entity
        // An effect consist of many squares (this.numParticles)
        // Each square disappears at random this.deletionTime
        for (let i = 0; i < this.numParticles; i++) {

            const x = this.x + (Math.random() * this.size * 2.5 - Math.random() * this.size * 2.5);
            const y = this.y + (Math.random() * this.size * 2.5 - Math.random() * this.size * 2.5);
            const size = Math.random() * 5;
            const dx = 0;
            const dy = Math.max(-0.3, Math.random() * -2);
            const color = 'green'

            const particle = new Particle(x, y, size, dx, dy, color);
            this.particles.push(particle);

            const deletionTime = Math.random() * (this.duration - this.minInterval) + this.minInterval;
            const timer = setTimeout(() => {
                this.removeParticle(particle);
            }, deletionTime);
            this.timers.push(timer);
        }
    }

    set numParticles(amount) {
        // Устанавливаем значение numParticles с учетом ограничений
        if (amount > 15) {
            this._numParticles = 15;
        } else if (amount < 1) {
            this._numParticles = 1;
        } else {
            this._numParticles = amount;
        }
    }

    get numParticles() {
        return this._numParticles;
    }

    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index !== -1) {
            this.particles.splice(index, 1);
        }
        particle.destroy()
    }

    draw(ctx, camera) {
        renderer.draw(this.particles)
    }

    update() {
        super.update();
        updater.update(this.particles)
    }

    destroy() {
        super.destroy();
        this.timers.forEach(timer => clearTimeout(timer));
    }
}

class ExplosionEffect extends VisualEffect {
    constructor(entity, size, duration, amount, x, y) {
        super(entity, size, duration, x, y);
        this.numParticles = amount;
        this.colors = ['yellow', 'orange', 'red', 'brown'];
        this.chunkSize = this.numParticles/7;
        this.generateParticles();
        this.onCreate()
    }
    onCreate(){
        gameMap.visualEffects.addEffect(new DeathEffect(gameMap, this.size, 120, this.x, this.y, ['white', 'yellow', 'orange', 'red', 'white']))
    }

    generateParticles() {
        let particles = this.numParticles
        const generateChunk = () => {
            for (let i = 0; i < this.chunkSize && particles > 0; i++) {
                const x = this.x + (Math.random() * this.size - this.size / 2);
                const y = this.y + (Math.random() * this.size - this.size / 2);
                const size = Math.max(5, Math.random() * 15);
                const angle = Math.atan2(y - this.y, x - this.x);
                const speed = Math.random() * 4;
                const damage = (size / speed)*Math.random();
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                const slowdownFactor = 0.92;
                const minSpeed = 0.1;
                new ExplosionParticle(x, y, speed, angle, size, damage, color, slowdownFactor, minSpeed);
                particles--;
            }
            if (particles > 0) {
                requestAnimationFrame(generateChunk)
            }
        };
        requestAnimationFrame(generateChunk)
    }

    set numParticles(amount) {
        if (amount > 55) {
            this._numParticles = 55;
        } else if (amount < 0) {
            this._numParticles = 0;
        } else {
            this._numParticles = amount;
        }
    }

    get numParticles() {
        return this._numParticles;
    }
}

class DeathEffect extends VisualEffect {
    constructor(entity, size, duration, x, y, colors=['blue', 'lightblue', 'yellow']) {
        super(entity, size, duration, x, y);
        this.maxRadius = size * 4; 
        this.minRadius = size; 
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

const weapon = new RangedWeapon('Bow', 10, 13, 100, ExplosionProjectile, 5)
const enemyWeapon = new RangedWeapon('Bow', -10, 10, 300, Projectile, 5)
const enemyWeapon2 = new RangedWeapon('Bow', 10, 0.1, 10, CircularProjectile, 5)

const player = new Player(canvas.width / 2, canvas.height / 2, 0, 30, 5, 100, weapon);
const camera = new Camera(ctx, gameMap, canvasObj, player, canvas.height, canvas.width)
const enemy = new Entity(700, 400, 135, 30, 5, 100, enemyWeapon)
const enemy3 = new Entity(730, 400, 135, 30, 5, 100, enemyWeapon)
const enemy4 = new Entity(770, 400, 135, 30, 5, 100, enemyWeapon)
const enemy5 = new Entity(750, 370, 135, 30, 5, 100, enemyWeapon)

const enemy2 = new Entity(400, 400, 45, 30, 5, 100, enemyWeapon2)

const entities = [player, enemy, enemy2, enemy3, enemy4, enemy5]


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
        document.getElementById('object-count').textContent = 'Objects: ' + GameObject.count;
    }

    requestId = requestAnimationFrame(gameLoop);
}

function updateAndDrawGame() {
    canvasObj.draw(ctx, camera);
    updater.update(entities);
    updater.update(projectiles);
    updater.update(walls);
    updater.update([camera, gameMap]);
    updater.update([canvasObj]);
    gameMap.draw(ctx, camera);
    renderer.draw(projectiles);
    renderer.draw(walls);
    renderer.draw(entities);
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
