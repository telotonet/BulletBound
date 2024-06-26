import { GameObject } from "./GameObject.js";
import { Health } from "./Health.js"
import { VisualEffectManager, DeathEffect } from "./VisualEffect.js";
import { entities, canvas, camera, gameMap, player } from './main.js'
import { CollisionUtils } from './CollisionUtils.js'
import { StatusEffectManager } from './StatusEffect.js'
import { Fireball, Heal, Lightning } from './Ability.js'
import { createSpellMenu } from "./gameMenu.js";

class Entity extends GameObject {
    constructor(x, y, angle, width, height, speed, health) {
        super(x, y, width, height, angle, 0, 0);
        this.speed = speed;
        this.angle = angle * Math.PI / 180;
        this.health = new Health(this, health);
        this.visualEffects = new VisualEffectManager();
        this.statusEffects = new StatusEffectManager();
        this.spawn()
        this.abilities = {
            fireball: new Fireball(this, 1000, 'Fireball'),
        };
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
        super.update();
        this.dx = 0;
        this.dy = 0;
        this.abilities.fireball.use(this.x, this.y, this.angle)
        // Поворачиваем entity лицом к игроку
        this.moveToPlayer()
        this.visualEffects.updateEffects();
        this.statusEffects.updateEffects();
    }
    moveToPlayer(){
        try {
            const path = gameMap.findPath(this.x, this.y, player.x, player.y);
            if (path.length > 0) {
                const nextNode = path[0];
                const targetX = nextNode.x * gameMap.cellSize + gameMap.cellSize / 2;
                const targetY = nextNode.y * gameMap.cellSize + gameMap.cellSize / 2;
                const deltaX = targetX - this.x;
                const deltaY = targetY - this.y;
                this.angle = Math.atan2(deltaY, deltaX);
                this.dx = Math.cos(this.angle) * this.speed;
                this.dy = Math.sin(this.angle) * this.speed;
            }
        } catch {}
    }

    destroy() {
        super.destroy();
        const index = entities.indexOf(this);
        if (index !== -1) {
            entities.splice(index, 1);
        }
    }

    spawn(){
        entities.push(this)
    }

    die() {
        this.visualEffects.clearEffects();
        const deathEffect = new DeathEffect(gameMap, 32, 32, 300, this.x, this.y)
        gameMap.visualEffects.addEffect(deathEffect)
        this.destroy();
    }

    // Handle Collision with {other} objects

    onCollisionWithWall(wall) {
        CollisionUtils.rigidBody(this, wall)
    }
    onCollisionWithEntity(entity) {
        CollisionUtils.rigidBody(entity, this)
    }
}

class Player extends Entity {
    constructor(x, y, angle, width, height, speed, health) {
        super(x, y, angle, width, height, speed, health);
        this.mouseX = x;
        this.mouseY = y;
        this.keysPressed = {};
        this.initControls();

        this.abilities = {
            fireball: new Fireball(this, 500, 'Fireball'),
            lightning: new Lightning(this, 5000, 'Lightning'),
            heal: new Heal(this, 2000, 'Heal'),
        };

        this.abilityBindings = {
            q: this.abilities.fireball,
            e: this.abilities.lightning,
            r: this.abilities.heal,
            f: this.abilities.heal,
        };
        this.iconMenu = createSpellMenu(this.abilityBindings);
        // this.aggro = new Aggro(this, 350)
        camera.target = this;
    }
    draw(ctx){
        super.draw(ctx)
        this.iconMenu.draw(ctx);
    }
    update() {
        super.update();
        this.handleInput();
    }
    moveToPlayer(){}
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
        // if (this.keysPressed['q']) {
        //     this.attack();
        // }
        // Handle abilities
        for (let key in this.abilityBindings) {
            if (this.keysPressed[key]) {
                this.abilityBindings[key].use(this.x, this.y, this.angle);
            }
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

export {Entity, Player}