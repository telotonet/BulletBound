import { resumeGame, modals, updater, BASE_WIDTH, BASE_HEIGHT, switchDebug, gameTimer } from "./main.js"

class Modal{
    constructor(x, y, width, height){
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
    get left() {
        return this.x - this.width / 2;
    }

    get top() {
        return this.y - this.height / 2;
    }
    show(){
        modals.push(this)
    }
    hide(){
        this.destroy()
    }
}

class Menu extends Modal{
    constructor(x, y, width, height, title){
        super(x, y, width, height)
        this.buttons = []
        this.title = title
    }

    addButton(btn){
        this.buttons.push(btn)
    }
    getButtons(){
        this.buttons
    }
    drawButtons(ctx){
        this.buttons.forEach(btn => {
            btn.draw(ctx, this.left, this.top)
        });
    }
    updateButtons(){
        updater.update(this.getButtons())
    }
    draw(ctx, camera) {
        // Рисуем фон модального окна
        ctx.fillStyle = 'rgba(124, 124, 124, 0.7)';
        ctx.fillRect(this.left, this.top, this.width, this.height);

        // Рисуем рамку модального окна
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.left, this.top, this.width, this.height);

        // Рисуем текст "MENU"
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.title, this.x, this.top + 10);
        this.drawButtons(ctx)
    }
    update(){
    }
    destroy(){
        let index = modals.indexOf(this);
        if (index > -1) {
            modals.splice(index, 1);
        }
    }
} 

class Button {
    constructor(x, y, width, height, label, action) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.label = label;
        this.action = action;
        this.hovered = false;
    }

    get left() {
        return this.x - this.width / 2;
    }

    get top() {
        return this.y - this.height / 2;
    }

    isMouseOver(mouseX, mouseY, offsetX, offsetY) {
        const left = offsetX + this.left;
        const top = offsetY + this.top;
        const right = left + this.width;
        const bottom = top + this.height;
        return mouseX >= left && mouseX <= right &&
               mouseY >= top && mouseY <= bottom;
    }

    draw(ctx, offsetX, offsetY) {
        if (this.hovered) {
            ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        } else {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.7)';
        }
        // Рисуем кнопку, используя центр координат
        ctx.fillRect(offsetX + this.left, offsetY + this.top, this.width, this.height);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        // Рисуем контур кнопки, используя центр координат
        ctx.strokeRect(offsetX + this.x - this.width / 2, offsetY + this.y - this.height / 2, this.width, this.height);

        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Рисуем текст кнопки, используя центр координат
        ctx.fillText(this.label, offsetX + this.x, offsetY + this.y);
    }

    onMouseMove(mouseX, mouseY, offsetX, offsetY) {
        this.hovered = this.isMouseOver(mouseX, mouseY, offsetX, offsetY);
    }

    onClick(mouseX, mouseY, offsetX, offsetY) {
        if (this.isMouseOver(mouseX, mouseY, offsetX, offsetY)) {
            this.action();
        }
    }
}

class Icon {
    constructor(x, y, width, height, image, ability) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
        this.ability = ability;
    }

    draw(ctx, offsetX, offsetY) {
        // ctx.drawImage(this.image, offsetX + this.x, offsetY + this.y, this.width, this.height);
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(offsetX + this.x, offsetY + this.y, this.width, this.height);

        // Рисуем кулдаун
        const progress = this.ability.getCooldownProgress();
        
        if (progress < 1) {
            const cooldownHeight = this.height * progress; // Изменено на высоту кулдауна снизу вверх
            const cooldownY = offsetY + this.y + (this.height - cooldownHeight); // Коррекция координаты Y
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(offsetX + this.x, cooldownY, this.width, cooldownHeight); // Изменено на cooldownY и cooldownHeight
        }
    }
    
}


class GridMenu extends Menu {
    constructor(x, y, width, height, title, iconSize = 30, iconSpacing = 5) {
        super(x, y, width, height, title);
        this.icons = [];
        this.iconSize = iconSize;
        this.iconSpacing = iconSpacing;
    }

    get left() {
        return this.x - this.width / 2;
    }

    get top() {
        return this.y - this.height / 2;
    }

    addIcon(ability) {
        const icon = new Icon(0, 0, this.iconSize, this.iconSize, ability.image, ability);
        this.icons.push(icon);
        this.repositionIcons();
    }

    repositionIcons() {
        const maxIconsPerRow = Math.floor((this.width - this.iconSpacing) / (this.iconSize + this.iconSpacing));
        this.icons.forEach((icon, index) => {
            const row = Math.floor(index / maxIconsPerRow);
            const col = index % maxIconsPerRow;
            icon.x = col * (this.iconSize + this.iconSpacing) + this.iconSpacing / 2;
            icon.y = row * (this.iconSize + this.iconSpacing) + this.iconSpacing / 2;
        });
    }

    draw(ctx) {
        this.icons.forEach(icon => {
            icon.draw(ctx, this.left, this.top);
        });
    }
}



export { Menu, Button, GridMenu };