import { VisualEffect, VisualEffectManager, DeathEffect, DamageNumberEffect } from "./VisualEffect.js";
import { AStar } from "./trash/Pathfinder.js";

class GameMap {
    constructor(width, height, cellSize=50) {
        this.visualEffects = new VisualEffectManager();
        this.height = height;
        this.width = width;
    }

    update() {
        this.visualEffects.updateEffects();
    }

    draw() {
        this.visualEffects.drawEffects();
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