import { camera, canvas, resumeGame, modals, updater, BASE_WIDTH, BASE_HEIGHT, switchDebug} from "./main.js"

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
}

class Menu extends Modal{
    constructor(x, y, width, height){
        super(x, y, width, height)
        this.buttons = []
    }
    show(){
        modals.push(this)
    }
    hide(){
        this.destroy()
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
        ctx.fillText('MENU', this.x, this.top + 10);
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



const createPauseMenu = () => {
    const pauseMenu = new Menu(BASE_WIDTH / 2, BASE_HEIGHT / 2, 300, 400);
    let continueButton = new Button(150, 80, 200, 50, 'CONTINUE', () => resumeGame() & pauseMenu.hide());
    let backButton = new Button(150, 350, 200, 50, 'BACK', () => resumeGame() & pauseMenu.hide());
    let debugButton = new Button(150, 150, 200, 50, 'DEBUG', () => switchDebug() & resumeGame() & pauseMenu.hide());
    let resetButton = new Button(150, 220, 200, 50, 'RESET', () => console.log('you gay'))
    pauseMenu.addButton(continueButton);
    pauseMenu.addButton(backButton);
    pauseMenu.addButton(debugButton);
    pauseMenu.addButton(resetButton);
    
    return pauseMenu;
};

const initializePauseMenu = () => {
    initMenuControls()
    const pauseMenu = createPauseMenu();
    return pauseMenu
};

const initMenuControls = () => {
    document.addEventListener('mousemove', (event) => {
        const mouseX = event.clientX - canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - canvas.getBoundingClientRect().top;
        modals.forEach(modal => {
            modal.buttons.forEach(btn => {
                btn.onMouseMove(mouseX, mouseY, modal.left, modal.top);
            });
        });
    });
    
    document.addEventListener('click', (event) => {
        const mouseX = event.clientX - canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - canvas.getBoundingClientRect().top;
        modals.forEach(modal => {
            modal.buttons.forEach(btn => {
                btn.onClick(mouseX, mouseY, modal.left, modal.top);
            });
        });
    });
}

export { Menu, Button, initializePauseMenu };