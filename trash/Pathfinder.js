import { GridCollider } from "../Collider.js";

class Node {
    constructor(x, y, walkable = true) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

class AStar {
    constructor(grid) {
        this.grid = grid;
    }

    findPath(startX, startY, endX, endY) {
        const openList = [];
        const closedList = [];
        const startNode = new Node(startX, startY);
        const endNode = new Node(endX, endY);

        openList.push(startNode);

        while (openList.length > 0) {
            let currentNode = openList.reduce((prev, curr) => (prev.f < curr.f ? prev : curr));

            if (currentNode.x === endX && currentNode.y === endY) {
                return this.retracePath(startNode, currentNode);
            }

            openList.splice(openList.indexOf(currentNode), 1);
            closedList.push(currentNode);

            const neighbors = this.getNeighbors(currentNode);

            for (let neighbor of neighbors) {
                if (!neighbor.walkable || closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    continue;
                }

                const tentativeG = currentNode.g + this.getDistance(currentNode, neighbor);

                if (tentativeG < neighbor.g || !openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    neighbor.g = tentativeG;
                    neighbor.h = this.getDistance(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;

                    if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                        openList.push(neighbor);
                    }
                }
            }
        }

        return []; // Путь не найден
    }

    retracePath(startNode, endNode) {
        const path = [];
        let currentNode = endNode;

        while (currentNode !== startNode) {
            path.push(currentNode);
            currentNode = currentNode.parent;
        }

        return path.reverse();
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: 1 },
        ];

        for (let dir of directions) {
            const x = node.x + dir.x;
            const y = node.y + dir.y;

            if (this.grid.isWalkable(x, y)) {
                neighbors.push(new Node(x, y));
            }
        }

        return neighbors;
    }

    getDistance(nodeA, nodeB) {
        const distX = Math.abs(nodeA.x - nodeB.x);
        const distY = Math.abs(nodeA.y - nodeB.y);

        if (distX > distY) {
            return 14 * distY + 10 * (distX - distY);
        }

        return 14 * distX + 10 * (distY - distX);
    }
}

export { AStar }