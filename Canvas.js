import {VisualEffectStorage} from './VisualEffect.js'

class Camera {
    constructor(ctx, gameMap, target, width, height, smoothness = 0.15) {
        this.ctx = ctx;
        this.gameMap = gameMap;
        this.height = height;
        this.width = width;
        this.target = target;
        this._x = 0;
        this._y = 0;
        this.smoothness = smoothness;

        this.shakeIntensity = 0;
        this.lastShakeTime
    }
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    get x(){return this._x}
    get y(){return this._y}
    set x(value){this._x = this.target.x}
    set y(value){this._y = this.target.y}
    get top(){return this.y - this.height/2}
    get bottom(){return this.y + this.height/2}
    get left(){return this.x - this.width/2}
    get right(){return this.x + this.width/2}


    update() {
        this._x = this.lerp(this.x, this.target.x, this.smoothness)
        this._y = this.lerp(this.y, this.target.y, this.smoothness)
        this.shake()
    }
    shake(){
        if (this.shakeIntensity > 0) {
            this._x += (Math.random() - 0.5) * this.shakeIntensity
            this._y += (Math.random() - 0.5) * this.shakeIntensity
        }
    }

    startShake(intensity){
        this.shakeIntensity = intensity
    }
    stopShake(){
        this.shakeIntensity = 0
    }


    getVisibleObjects(objects) {
        const visibleObjects = [];
        
        for (const obj of objects) {
            const vertices = obj.collider.getVertices();
            
            let visible = false;
            for (const vertex of vertices) {
                if (
                    vertex.x >= this.left &&
                    vertex.x <= this.right &&
                    vertex.y >= this.top &&
                    vertex.y <= this.bottom
                ) {
                    visible = true;
                    break;
                }
            }

            if (visible) {
                visibleObjects.push(obj);
            }
        }

        return visibleObjects;
    }
}

class Canvas {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.visualEffects = new VisualEffectStorage()
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        this.visualEffects.drawEffects()
    }

    update() {
        this.visualEffects.updateEffects()
    }
}

export {Canvas, Camera}