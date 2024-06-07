import {Collider, CollisionManager} from './Collider.js'
import { deltaTime, camera, collisionManager } from './main.js';

class BaseDebugger {
    constructor() {
        BaseDebugger.objects.push(this);
    }
    static objects = []; // Debugging counter
    static getObjectClassCount() {
        const classCount = {};
        for (const obj of BaseDebugger.objects) {
            const className = obj.constructor.name;
            if (!classCount[className]) {
                classCount[className] = 1;
            } else {
                classCount[className]++;
            }
        }
        classCount.colliders = collisionManager.getColliders().length+1;
        // classCount.collisions = collisionManager.getTotalCollisions();
        return classCount;
    }
    static getObjectsByType(type) {
        return BaseDebugger.objects.filter(obj => obj instanceof type);
    }
}



class GameObject extends BaseDebugger {
    constructor(x, y, width, height, angle = 0, dx, dy) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle; // Угол объекта
        this.createCollider();
        this.dx = dx;
        this.dy = dy;
    }

    get DrawX() {
        return this.x - camera.left;
    }

    get DrawY() {
        return this.y - camera.top;
    }
    update(){
        this.x += this.dx * deltaTime
        this.y += this.dy * deltaTime
 
    }
    createCollider() {
        this.collider = new Collider(this, this.x, this.y, this.width, this.height, this.angle);
    }

    destroy() {
        if (this.collider) {
            this.collider.destroy();
        }
        let index = BaseDebugger.objects.indexOf(this);
        if (index > -1) {
            BaseDebugger.objects.splice(index, 1);
        }
    }

    handleCollision(other) {
        // Handle ongoing collisions
    }

    onColliderEnter(other) {
        // Handle entering a collider
    }

    onColliderLeave(other) {
        // Handle leaving a collider
    }
}

export {GameObject, BaseDebugger}