import {walls} from './main.js'
import { GameObject } from './GameObject.js';
import { VisualEffectStorage } from './VisualEffect.js';

class Wall extends GameObject {
    constructor(x, y, width, height, color = 'black') {
        super(x, y, width, height, 0, 0, 0);
        this.width = width;
        this.height = height;
        this.visualEffects = new VisualEffectStorage();
        this.color = color
        walls.push(this);
    }

    draw(ctx) {
        ctx.save();
        // Переместим контекст к центру объекта
        ctx.translate(this.DrawX, this.DrawY);
        // Выполним вращение
        ctx.rotate(this.angle);
        // Нарисуем прямоугольник с центром в точке (0,0)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
        this.visualEffects.drawEffects();
    }

    update() {
        super.update();
        this.visualEffects.updateEffects();
    }

    destroy() {
        super.destroy();
        const index = walls.indexOf(this);
        if (index !== -1) {
            walls.splice(index, 1);
        }
    }
}

export {Wall}