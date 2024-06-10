import { DamageNumberEffect } from "./VisualEffect.js";

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
            const damageEffect = new DamageNumberEffect(this.entity, 0, 0, amount, 1000, 'black', null, 8);
            this.entity.visualEffects.addEffect(damageEffect);
        }
        if (amount > 0) {
            const damageEffect = new DamageNumberEffect(this.entity, 0, 0, amount, 1000, 'lightgreen', null, 8);
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

export { Health }