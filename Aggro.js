import { GameObject  } from "./GameObject.js";
import { GridCollider } from "./Collider.js";
import { AStar } from "./PathFinder.js";
import { walls } from "./main.js";

class Aggro extends GameObject{
    constructor(entity, range, cellSize=50){
        super(entity.x ,entity.y, 0,0,0,0,0)
        this.entity = entity
        this.range = range
        this.cellSize = cellSize
        this.grid = new Grid(this, range, range, cellSize);
        this.colliders = this.createColliderGrid()
        console.log(this.colliders)
    }

    draw(){}
    createColliderGrid() {
        const colliders = [];
        const halfRangeCells = Math.ceil(this.range / this.cellSize);
        for (let y = -halfRangeCells; y <= halfRangeCells; y++) {
            for (let x = -halfRangeCells; x <= halfRangeCells; x++) {
                const cellX = Math.floor((this.entity.x / this.cellSize) + x);
                const cellY = Math.floor((this.entity.y / this.cellSize) + y);
                const cellCenterX = cellX * this.cellSize + this.cellSize / 2;
                const cellCenterY = cellY * this.cellSize + this.cellSize / 2;

                const cellCollider = new GridCollider(this, cellCenterX, cellCenterY, this.cellSize, this.cellSize, x*this.cellSize, y*this.cellSize);
                colliders.push(cellCollider);
            }
        }
        return colliders
    }
    update(){
        super.update()
        this.x = this.entity.x
        this.y = this.entity.y
        this.grid.updatePosition(this.x, this.y)
    }
    findPath(startX, startY, endX, endY) {
        const aStar = new AStar(this.grid);
        return aStar.findPath(
            Math.floor(startX / this.cellSize),
            Math.floor(startY / this.cellSize),
            Math.floor(endX / this.cellSize),
            Math.floor(endY / this.cellSize)
        );
    }
}

class Grid {
    constructor(aggro, width, height, cellSize) {
        this.aggro = aggro
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.columns = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = this.createGrid();
        this.centerX = 0;
        this.centerY = 0;
    }

    createGrid() {
        const grid = [];
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.columns; x++) {
                row.push({ walkable: true });
            }
            grid.push(row);
        }
        console.log(grid)
        return grid;
    }

    // Обновление позиции сетки относительно центра (позиции игрока)
    updatePosition(centerX, centerY) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.updateWalkability(walls)
    }

    // Проверка проходимости клетки
    isWalkable(x, y) {
        if (x < 0 || x >= this.columns || y < 0 || y >= this.rows) {
            return false;
        }
        return this.grid[y][x].walkable;
    }

    // Обновление информации о проходимости клеток
    updateWalkability(walls) {
        const colliders = this.aggro.colliders;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.columns; x++) {
                const colliderIndex = y * this.columns + x; // Правильное сопоставление индексов
                const cellCollider = colliders[colliderIndex];
                this.grid[y][x].walkable = !this.isCellCollidingWithWalls(cellCollider, walls);
            }
        }
    }
    

    // Проверка коллизий клетки со стенами
    isCellCollidingWithWalls(cellCollider, walls) {
        for (let wall of walls) {
            if (cellCollider.isCollidingWith(wall.collider)) {
                console.log('wall yeaaa')
                return true;
            }
        }
        return false;
    }
}

export { Aggro }