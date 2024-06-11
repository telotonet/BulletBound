import { Menu, Button, GridMenu } from './Modal.js'
import { BASE_HEIGHT, BASE_WIDTH, startGame, modals, canvas } from './main.js';

const createStartMenu = () => {
    const startMenu = new Menu(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, 'Bulletbound');
    let startButton = new Button(BASE_WIDTH / 2, BASE_HEIGHT / 2, 200, 50, 'START', () => createChooseHeroMenu().show() & startMenu.hide());
    startMenu.addButton(startButton);
    return startMenu;
};
const createChooseHeroMenu = () => {
    const startMenu = new Menu(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, 'Choose your hero');
    let warrior = new Button(BASE_WIDTH * 0.2, BASE_HEIGHT / 2, 123, 123, 'warrior', () => startGame() & startMenu.hide());
    let ranger = new Button(BASE_WIDTH * 0.4, BASE_HEIGHT / 2, 123, 123, 'ranger', () => startGame() & startMenu.hide());
    let mage = new Button(BASE_WIDTH * 0.6, BASE_HEIGHT / 2, 123, 123, 'mage', () => startGame() & startMenu.hide());
    let rogue = new Button(BASE_WIDTH * 0.8, BASE_HEIGHT / 2, 123, 123, 'rogue', () => startGame() & startMenu.hide());

    startMenu.addButton(warrior);
    startMenu.addButton(ranger);
    startMenu.addButton(mage);
    startMenu.addButton(rogue);

    return startMenu;
};
const createTimerModal = () => {
    const timerModal = new Menu(BASE_WIDTH * 0.9, BASE_HEIGHT * 0.05, BASE_WIDTH*0.15, BASE_HEIGHT*0.025, '');
    timerModal.show()
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
};
const createSpellMenu = (abilities, size=30, spacing=5) => {
    const spellMenu = new GridMenu(BASE_WIDTH*0.05, BASE_HEIGHT*0.9, BASE_WIDTH*0.07, BASE_HEIGHT*0.3, '', size, spacing)
    for (let key in abilities) {
        const ability = abilities[key];
        spellMenu.addIcon(ability);
    }
    spellMenu.show()
    return spellMenu
}

export {createChooseHeroMenu, createStartMenu, createTimerModal, createSpellMenu, initializePauseMenu}