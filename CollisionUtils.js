export default class CollisionUtils {
    static rigidBody(movableObj, rigidObj, smoothness=1) {
        const colliderA = movableObj.collider;
        const colliderB = rigidObj.collider;

        const directionX = movableObj.x - rigidObj.x;
        const directionY = movableObj.y - rigidObj.y;

        const distance = Math.sqrt(directionX ** 2 + directionY ** 2);

        const normalDirX = directionX / distance;
        const normalDirY = directionY / distance;

        const overlapX = (colliderA.width + colliderB.width) / 2 - Math.abs(directionX);
        const overlapY = (colliderA.height + colliderB.height) / 2 - Math.abs(directionY);

        const smallestOverlap = Math.min(overlapX, overlapY);

        if (smallestOverlap > 0) {
            movableObj.dx += normalDirX * smallestOverlap * smoothness;
            movableObj.dy += normalDirY * smallestOverlap * smoothness;
        }
    }
}

