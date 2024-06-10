class CustomCollider extends Collider {
    constructor(owner, vertices, angle = 0) {
        // Вызываем конструктор родительского класса с заданными вершинами
        super(owner, 0, 0, 0, 0, angle);
        this.vertices = vertices;
    }

    getVertices() {
        // Возвращаем переданный массив вершин
        return this.vertices;
    }

    // Метод getAxes() останется тем же, так как оси могут быть вычислены для любого многоугольника

    // Отрисовка многоугольного коллайдера
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.owner.DrawX + this.vertices[0].x, this.owner.DrawY + this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.owner.DrawX + this.vertices[i].x, this.owner.DrawY + this.vertices[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgb(13, 207, 0)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}



class FractureWall extends Wall {
    constructor(x, y, width, height){
        super(x, y, width, height)
    }

    splitWall() {
        // Проверяем размер стенки для завершения рекурсии
        if (this.width < 15 || this.height < 15) {
            return;
        }

        const dx = Math.random()
        const dy = Math.random()
        this.getSubWalls().forEach(subWall => {
            const fractWall = new FractureWall(subWall[0].x, subWall[0].y, this.width / 2, this.height / 2);
            fractWall.dx = dx * 0.1
            fractWall.dy = dy * 0.1
            fractWall.splitWall()
            this.destroy()
        });

    }

    getSubWalls() {
        const x = this.x;
        const y = this.y;
        const width = this.width / 2;
        const height = this.height / 2;

        return [
            [{ x: x - width / 2, y: y - height / 2 }], // Top-left quadrant
            [{ x: x + width / 2, y: y - height / 2 }], // Top-right quadrant
            [{ x: x - width / 2, y: y + height / 2 }], // Bottom-left quadrant
            [{ x: x + width / 2, y: y + height / 2 }]  // Bottom-right quadrant
        ];
    }

    onProjectileEnter(projectile) {
        this.destroy();
        projectile.destroy();
        this.splitWall();
    }
    onFractureWallEnter(wall){
    }
    onCollisionWithFractureWall(wall){
        CollisionUtils.rigidBody(wall, this, 0.1)
    }
    onCollisionWithPlayer(entity){
        CollisionUtils.rigidBody(this, entity)
    }
}



