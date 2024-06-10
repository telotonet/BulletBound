import { projectiles } from "./main.js";
import { GameObject } from "./GameObject.js";
import { VisualEffectManager } from "./VisualEffect.js";
import { FireEffect } from "./StatusEffect.js";

class Projectile extends GameObject {
    constructor(x, y, speed, angle, width, height, damage, color = 'violet', owner = null) {
        super(x, y, width, height, angle,
                Math.cos(angle)*speed,
                Math.sin(angle)*speed
            );
        this.visualEffects = new VisualEffectManager();
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

class PoisonProjectile extends Projectile{
    constructor(x, y, speed, angle, width, height, damage, color = 'violet', owner = null){
        super(x, y, speed, angle, width, height, damage, color = 'violet', owner)
    }
    onEntityEnter(entity){
        super.onEntityEnter(entity)
        entity.health.change(-this.damage)
        const poisonEffect = new FireEffect(entity, 5200, 3)
        entity.statusEffects.addEffect(poisonEffect)
    }
}


export {Projectile, PoisonProjectile}