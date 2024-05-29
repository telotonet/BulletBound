export default class CollisionHandler {
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
