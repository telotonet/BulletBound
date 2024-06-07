import { Menu, Button, initializePauseMenu } from './Modal.js'
import { BASE_HEIGHT, BASE_WIDTH } from './main.js';

const createStartMenu = () => {
    const startMenu = new Menu(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, 'Bulletbound');
    let startButton = new Button(BASE_WIDTH / 2, BASE_HEIGHT / 2, 200, 50, 'START', () => createChooseHeroMenu().show() & startMenu.hide());
    startMenu.addButton(startButton);
    return startMenu;
};
const createChooseHeroMenu = () => {
    const startMenu = new Menu(BASE_WIDTH / 2, BASE_HEIGHT / 2, BASE_WIDTH, BASE_HEIGHT, 'Choose your hero');
    let warrior = new Button(BASE_WIDTH * 0.2, BASE_HEIGHT / 2, 150, 150, 'warrior', () => console.log('yep'));
    let ranger = new Button(BASE_WIDTH * 0.4, BASE_HEIGHT / 2, 150, 150, 'ranger', () => console.log('yep'));
    let mage = new Button(BASE_WIDTH * 0.6, BASE_HEIGHT / 2, 150, 150, 'mage', () => console.log('yep'));
    let rogue = new Button(BASE_WIDTH * 0.8, BASE_HEIGHT / 2, 150, 150, 'rogue', () => console.log('yep'));

    startMenu.addButton(warrior);
    startMenu.addButton(ranger);
    startMenu.addButton(mage);
    startMenu.addButton(rogue);
    
    return startMenu;
};

export {createChooseHeroMenu, createStartMenu}