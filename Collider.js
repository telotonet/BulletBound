import {collisionManager, BASE_HEIGHT, BASE_WIDTH, camera} from './main.js'


class CollisionManager {
    constructor() {
        this.colliders = [];
    }

    addCollider(collider) {
        this.colliders.push(collider);
    }

    removeCollider(collider) {
        const index = this.colliders.indexOf(collider);
        if (index > -1) {
            this.colliders.splice(index, 1);
        }
    }

    getColliders() {
        return this.colliders;
    }

    clearColliders(){
        this.colliders = []
    }

    update() {
        this.getColliders().forEach(collider => {
            collider.update();
        });

        let boundary = new Rectangle(5000, 5000, 10000, 10000);
        let qtree = new QuadTree(boundary, 16);

        for (let collider of this.colliders) {
            let point = new Point(collider.x, collider.y, collider);
            qtree.insert(point);
        }

        for (let collider of this.colliders) {
            let range = new Rectangle(collider.x, collider.y, collider.width, collider.height);
            let potentialCollisions = qtree.query(range);

            for (let point of potentialCollisions) {
                let otherCollider = point.userData;
                if (collider !== otherCollider) {
                    collider.handleCollision(otherCollider);
                }
            }
        }
    }
}

class Collider {
    constructor(owner, x, y, width, height, angle = 0) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = angle; // Угол коллайдера
        this.collidingWith = new Set();
        collisionManager.addCollider(this);
    }

    static project(vertices, axis) {
        let min = Infinity;
        let max = -Infinity;
        for (let vertex of vertices) {
            const projection = vertex.x * axis.x + vertex.y * axis.y;
            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }
        return { min, max };
    }

    static overlap(projA, projB) {
        return projA.max >= projB.min && projB.max >= projA.min;
    }

    getVertices() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);
        return [
            { x: this.x + cosA * -hw - sinA * -hh, y: this.y + sinA * -hw + cosA * -hh },
            { x: this.x + cosA * hw - sinA * -hh, y: this.y + sinA * hw + cosA * -hh },
            { x: this.x + cosA * hw - sinA * hh, y: this.y + sinA * hw + cosA * hh },
            { x: this.x + cosA * -hw - sinA * hh, y: this.y + sinA * -hw + cosA * hh }
        ];
    }

    getAxes() {
        const vertices = this.getVertices()
        const axes = [];
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            const normal = { x: -edge.y, y: edge.x };
            // Нормализуем ось
            const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            axes.push({ x: normal.x / length, y: normal.y / length });
        }
        return axes;
    }

    drawDirection(ctx, dx, dy) {
        const length = 5;
        
        // Рисуем общую скорость (зеленая стрелка)
        ctx.beginPath();
        ctx.moveTo(this.owner.DrawX, this.owner.DrawY);
        ctx.lineTo(this.owner.DrawX + dx * 4, this.owner.DrawY + dy * 4);
        ctx.strokeStyle = "rgb(13, 207, 0)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Рисуем скорость по оси X (синяя стрелка)
        ctx.beginPath();
        ctx.moveTo(this.owner.DrawX, this.owner.DrawY);
        ctx.lineTo(this.owner.DrawX + dx * length, this.owner.DrawY);
        ctx.strokeStyle = "rgb(61, 65, 255)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Рисуем скорость по оси Y (красная стрелка)
        ctx.beginPath();
        ctx.moveTo(this.owner.DrawX, this.owner.DrawY);
        ctx.lineTo(this.owner.DrawX, this.owner.DrawY + dy * length);
        ctx.strokeStyle = "rgb(252, 43, 214)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
    draw(ctx) {
        const vertices = this.getVertices();
        this.drawDirection(ctx, this.owner.dx, this.owner.dy)
    
        ctx.strokeStyle = 'rgb(13, 207, 0)';
        ctx.lineWidth = 2;
    
        ctx.beginPath();
        for (let i = 0; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x - camera.left, vertices[i].y - camera.top);
        }
        ctx.closePath();
        ctx.stroke();
    }
    update() {
        this.x = this.owner.x;
        this.y = this.owner.y;
        this.angle = this.owner.angle;
    }

    isCollidingWith(otherCollider) {
        const verticesA = this.getVertices();
        const verticesB = otherCollider.getVertices();

        const axes = [...this.getAxes(), ...otherCollider.getAxes()];

        for (let axis of axes) {
            const projectionA = Collider.project(verticesA, axis);
            const projectionB = Collider.project(verticesB, axis);

            if (!Collider.overlap(projectionA, projectionB)) {
                return false;
            }
        }
        return true;
    }



    handleCollision(otherCollider) {
        const isColliding = this.isCollidingWith(otherCollider);

        if (isColliding && !this.collidingWith.has(otherCollider)) {
            this.collidingWith.add(otherCollider);
            otherCollider.collidingWith.add(this);
            CollisionHandler.onEnter(this.owner, otherCollider.owner);
        } else if (!isColliding && this.collidingWith.has(otherCollider)) {
            this.collidingWith.delete(otherCollider);
            otherCollider.collidingWith.delete(this);
            CollisionHandler.onLeave(this.owner, otherCollider.owner);
        }

        if (isColliding) {
            CollisionHandler.onCollision(this.owner, otherCollider.owner);
        }
    }


    removeSelfFromColliders() {
        for (const otherCollider of this.collidingWith) {
            otherCollider.collidingWith.delete(this);
        }
    }

    destroy() {
        this.removeSelfFromColliders();
        collisionManager.removeCollider(this);
    }
}

class Point {
    constructor(x, y, userData) {
        this.x = x;
        this.y = y;
        this.userData = userData;
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(point) {
        return (point.x >= this.x - this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h);
    }

    intersects(range) {
        return !(range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h);
    }
}

class QuadTree {
    constructor(boundary, capacity) {
        if (!boundary) {
            throw TypeError('boundary is null or undefined');
        }
        if (!(boundary instanceof Rectangle)) {
            throw TypeError('boundary should be a Rectangle');
        }
        if (typeof capacity !== 'number') {
            throw TypeError(`capacity should be a number but is a ${typeof capacity}`);
        }
        if (capacity < 1) {
            throw RangeError('capacity must be greater than 0');
        }
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;

        let ne = new Rectangle(x + w, y - h, w, h);
        this.northeast = new QuadTree(ne, this.capacity);
        let nw = new Rectangle(x - w, y - h, w, h);
        this.northwest = new QuadTree(nw, this.capacity);
        let se = new Rectangle(x + w, y + h, w, h);
        this.southeast = new QuadTree(se, this.capacity);
        let sw = new Rectangle(x - w, y + h, w, h);
        this.southwest = new QuadTree(sw, this.capacity);

        this.divided = true;
    }

    insert(point) {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northeast.insert(point) || this.northwest.insert(point) ||
            this.southeast.insert(point) || this.southwest.insert(point)) {
            return true;
        }
    }

    query(range, found) {
        if (!found) {
            found = [];
        }

        if (!range.intersects(this.boundary)) {
            return found;
        }

        for (let p of this.points) {
            let collider = p.userData;
            let vertices = collider.getVertices();
            let colliderRect = new Rectangle(
                Math.min(vertices[0].x, vertices[1].x, vertices[2].x, vertices[3].x),
                Math.min(vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y),
                Math.max(vertices[0].x, vertices[1].x, vertices[2].x, vertices[3].x) - Math.min(vertices[0].x, vertices[1].x, vertices[2].x, vertices[3].x),
                Math.max(vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y) - Math.min(vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y)
            );
            if (range.intersects(colliderRect)) {
                found.push(p);
            }
        }
        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }
}

class CollisionHandler {
    static onCollision(objectA, objectB) {
        const methodA = `onCollisionWith${objectB.constructor.name}`;
        const methodB = `onCollisionWith${objectA.constructor.name}`;

        if (typeof objectA[methodA] === 'function') {
            objectA[methodA](objectB);
        }
        if (typeof objectB[methodB] === 'function') {
            objectB[methodB](objectA);
        }
    }

    static onEnter(objectA, objectB) {
        const methodA = `on${objectB.constructor.name}Enter`;
        const methodB = `on${objectA.constructor.name}Enter`;

        if (typeof objectA[methodA] === 'function') {
            objectA[methodA](objectB);
        }
        if (typeof objectB[methodB] === 'function') {
            objectB[methodB](objectA);
        }
    }

    static onLeave(objectA, objectB) {
        const methodA = `on${objectB.constructor.name}Leave`;
        const methodB = `on${objectA.constructor.name}Leave`;

        if (typeof objectA[methodA] === 'function') {
            objectA[methodA](objectB);
        }
        if (typeof objectB[methodB] === 'function') {
            objectB[methodB](objectA);
        }
    }
}

export {Collider, Point, Rectangle, QuadTree, CollisionManager, CollisionHandler};