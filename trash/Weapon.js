import { weapons, gameTimer, entities } from "../main.js";

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

export {Weapon, RangedWeapon}