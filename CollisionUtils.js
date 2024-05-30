import {Collider, deltaTime} from '/main.js'
export default class CollisionUtils {
    static rigidBody(movableObj, rigidObj, smoothness = 1) {
        const colliderA = movableObj.collider;
        const colliderB = rigidObj.collider;

        const verticesA = colliderA.getVertices();
        const verticesB = colliderB.getVertices();

        const axes = [
            ...colliderA.getAxes(),
            ...colliderB.getAxes()
        ];

        let minOverlap = Infinity;
        let smallestAxis = null;

        // Проверяем перекрытие на каждой оси
        for (let axis of axes) {
            const projectionA = Collider.project(verticesA, axis);
            const projectionB = Collider.project(verticesB, axis);

            if (!Collider.overlap(projectionA, projectionB)) {
                return; // No collision
            } else {
                // Find min overlap
                const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    smallestAxis = axis;

                    // Find overlap direction
                    const direction = {
                        x: movableObj.x - rigidObj.x,
                        y: movableObj.y - rigidObj.y
                    };
                    const dotProduct = direction.x * smallestAxis.x + direction.y * smallestAxis.y;
                    if (dotProduct < 0) {
                        smallestAxis.x = -smallestAxis.x;
                        smallestAxis.y = -smallestAxis.y;
                    }
                }
            }
        }

        // Move object in direction of min overlap
        if (minOverlap > 0) {
            const correctionX = smallestAxis.x * minOverlap * smoothness;
            const correctionY = smallestAxis.y * minOverlap * smoothness;

            movableObj.dx += correctionX * deltaTime;
            movableObj.dy += correctionY * deltaTime;
        }
    }
}