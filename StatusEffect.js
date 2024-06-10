import { gameTimer } from "./main.js";



class StatusEffectManager {
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
    updateEffects(){
        this.effects.forEach(effect => effect.update());
    }

    drawEffects(){
        this.effects.forEach(effect => effect.draw(ctx, camera));
    }

    clearEffects() {
        this.effects.forEach(effect => effect.destroy());
    }
}

class StatusEffect {
    constructor(owner, duration) {
        this.owner = owner;
        this.duration = duration;
        this.elapsedTime = 0;
        this.startTime =  gameTimer.getTime();
    }
    onCreate(){}

    draw(ctx) {
        // You should implement this method
    }

    update() {
        if (this.duration > 0){
            this.elapsedTime = gameTimer.getTime() - this.startTime;
            if (this.elapsedTime >= this.duration) {
                this.destroy()
            }
        }
    }

    destroy() {
        this.owner.statusEffects.removeEffect(this);
    }
}

class FireEffect extends StatusEffect {
    constructor(owner, duration, damage) {
        super(owner, duration);
        this.lastDamageTime = gameTimer.getTime();
        this.damage = damage;
        this.onCreate()
    }
    onCreate(){
        const existingEffectIndex = this.owner.statusEffects.effects.findIndex(e => e instanceof FireEffect);
        if (existingEffectIndex !== -1) {
            const thiisEffect = this.owner.statusEffects.effects[existingEffectIndex];
            thiisEffect.destroy()
        }
    }
    update() {
        super.update();
        const currentTime = gameTimer.getTime();
        if (currentTime - this.lastDamageTime >= 1000) {
            this.owner.health.change(-this.damage); 
            this.lastDamageTime = currentTime; 
        }
    }
}

export {StatusEffectManager, FireEffect}