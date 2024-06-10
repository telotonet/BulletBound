import { gameTimer } from "./main.js"
import { Projectile, PoisonProjectile, LightningProjectile } from "./Projectile.js"

class Ability {
    constructor(owner, cooldown, name) {
        this.owner = owner
        this.cooldown = cooldown
        this.name = name
        this.lastUsedTime = -10000
    }

    canUse() {
        const currentTime = gameTimer.getTime();
        return (currentTime - this.lastUsedTime) >= this.cooldown;
    }

    use(x, y, angle, modifiers = null) {
        if (this.canUse()) {
            this.lastUsedTime = gameTimer.getTime();
            this.activate(this.owner, x, y, angle, modifiers);
        }
    }

    activate(owner, x, y, angle, modifiers) {
        // Реализовать в подклассах для конкретных способностей
    }
}

class Fireball extends Ability {
    activate(owner, x, y, angle) {
        const fireball = new PoisonProjectile(x, y, 10, angle, 10, 10, 20, 'orange', owner);
    }
}

class Heal extends Ability {
    activate(owner, x, y, angle) {
        owner.health.change(20);
    }
}

class Lightning extends Ability{
    activate(owner, x, y, angle, modifiers) {
        new LightningProjectile(x, y, 10, angle, 10, 10, 10, 'blue', owner, 4)
    }
}

export { Ability, Heal, Fireball, Lightning }