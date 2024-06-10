import { Menu, Button, initializePauseMenu } from './Modal.js'
import { BASE_HEIGHT, BASE_WIDTH, startGame, gameTimer } from './main.js';

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

export {createChooseHeroMenu, createStartMenu, createTimerModal}