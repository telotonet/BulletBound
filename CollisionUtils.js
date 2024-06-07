import {deltaTime } from '/main.js';
import { Collider } from './Collider.js';

class CollisionUtils {
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
        let correctionX = 0;
        let correctionY = 0;

        for (let axis of axes) {
            const projectionA = Collider.project(verticesA, axis);
            const projectionB = Collider.project(verticesB, axis);

            const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                smallestAxis = { ...axis };

                const direction = {
                    x: movableObj.x - rigidObj.x,
                    y: movableObj.y - rigidObj.y
                };
                const dotProduct = direction.x * smallestAxis.x + direction.y * smallestAxis.y;
                if (dotProduct < 0) {
                    smallestAxis.x = -smallestAxis.x;
                    smallestAxis.y = -smallestAxis.y;
                }

                correctionX = smallestAxis.x * minOverlap * smoothness;
                correctionY = smallestAxis.y * minOverlap * smoothness;
            }
        }

        if (minOverlap > 0) {
            movableObj.x += correctionX ;
            movableObj.y += correctionY ;

            // Обновляем коллайдер после корректировки позиции
            colliderA.update();
        }
    }
}

export {CollisionUtils}