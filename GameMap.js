import { VisualEffect, VisualEffectStorage, DeathEffect, DamageNumberEffect } from "./VisualEffect.js";

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

export {GameMap, GameTimer}