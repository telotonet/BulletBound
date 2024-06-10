import { GameObject, BaseDebugger } from './GameObject.js'
import { gameTimer, ctx, camera, deltaTime } from './main.js';

class VisualEffectManager {
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

class VisualEffect extends GameObject{
    constructor(owner, width, height, duration, x , y) {
        super(x, y, width, height, 0, 0, 0)
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
        super.update()
        this.elapsedTime = gameTimer.getTime() - this.startTime;
        if (this.elapsedTime >= this.duration) {
            this.destroy()
        }
    }

    destroy() {
        super.destroy()
        this.owner.visualEffects.removeEffect(this);
    }
}

class DamageNumberEffect extends VisualEffect {
    constructor(owner, width, height, value, duration, color, x, y, font= 'Cooper Black', fontSize=30) {
        super(owner, width, height, duration, x, y);
        this.value = value;
        this.y = this.owner.y;
        this.x = this.owner.x
        this.color = color;
        this.speed = 1; // Numbers Y movespeed
        this.font = font
        this.fontSize = fontSize
        this.onCreate()
    }

    onCreate(){
        const existingEffectIndex = this.owner.visualEffects.effects.findIndex(e => e instanceof DamageNumberEffect);
        if (existingEffectIndex !== -1) {
            const existingEffect = this.owner.visualEffects.effects[existingEffectIndex];
            existingEffect.destroy()
            this.value += existingEffect.value;
        }
    }
    draw(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize}px ${this.font}`;
        ctx.fillText(this.value.toFixed(1), this.DrawX, this.DrawY);
        ctx.restore();
    }
    update(){
        super.update()
        this.y -= (this.elapsedTime / this.duration) * this.speed * deltaTime
        this.x = this.owner.x
    }
}

class DeathEffect extends VisualEffect {
    constructor(owner, width, height, duration, x, y, colors=['blue', 'lightblue', 'yellow']) {
        super(owner, width, height, duration, x, y);
        this.maxRadius = width; 
        this.minRadius = width/4; 
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
            this.radius += this.growthSpeed*deltaTime;
            if (this.radius >= this.maxRadius) {
                this.expanding = false;
            }
        } else {
            this.radius -= this.growthSpeed*deltaTime;
            if (this.radius <= this.minRadius) {
                this.expanding = true
            }
        }

        // Переключаемся между цветами в массиве цветов
        this.colorIndex = Math.floor((this.elapsedTime / this.duration) * (this.colors.length - 1));
    }
}





export {VisualEffect, VisualEffectManager, DeathEffect, DamageNumberEffect}