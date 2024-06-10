import { projectiles, entities } from "./main.js";
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

class LightningProjectile extends Projectile {
    constructor(x, y, speed, angle, width, height, damage, color = 'cyan', owner = null, chainCount = 4, hitEntities = []) {
        super(x, y, speed, angle, width, height, damage, color, owner);
        this.chainCount = chainCount;
        this.hitEntities = hitEntities;
    }

    onEntityEnter(entity) {
        if (this.owner == entity || this.hitEntities.includes(entity)) return;
        entity.health.change(-this.damage);
        this.hitEntities.push(entity);

        if (this.chainCount > 0) {
            this.chainToNextTarget(entity.x, entity.y);
        }
        this.destroy();
    }

    findNearestEntity(x, y, excludeEntity) {
        let nearestEntity = null;
        let minDistance = Infinity;
        for (const entity of entities) {
            if (entity !== excludeEntity && entity !== this.owner && !this.hitEntities.includes(entity)) {
                const distance = Math.hypot(entity.x - x, entity.y - y);
                if (distance < minDistance && distance <= 100) {
                    minDistance = distance;
                    nearestEntity = entity;
                }
            }
        }
        return nearestEntity;
    }

    chainToNextTarget(currentX, currentY) {
        const nextTarget = this.findNearestEntity(currentX, currentY, null);
        if (!nextTarget) return;
        const angle = Math.atan2(nextTarget.y - currentY, nextTarget.x - currentX);
        const lightningProjectile = new LightningProjectile(
            currentX, currentY, this.speed, angle, this.width, this.height, this.damage/1.5, this.color, this.owner, this.chainCount - 1, this.hitEntities
        );
        lightningProjectile.x = nextTarget.x;
        lightningProjectile.y = nextTarget.y;
        lightningProjectile.onEntityEnter(nextTarget);
    }
}

export {Projectile, PoisonProjectile, LightningProjectile}