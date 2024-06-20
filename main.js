import { Collider,  CollisionManager } from './Collider.js'
import { Canvas, Camera } from './Canvas.js'
import { GameMap, GameTimer } from './GameMap.js';
import { Renderer, Updater } from './Renderer.js'
import { Player, Entity } from './Entity.js'
import { Wall } from './Wall.js'
import { BaseDebugger } from './GameObject.js';
import {createStartMenu, createTimerModal, initializePauseMenu} from './gameMenu.js'


let projectiles = []
let modals = []
let entities = []
let walls = [];

const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;


createStartMenu().show()

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasObj = new Canvas(ctx, canvas.width, canvas.height);
const gameMap = new GameMap(1234, 1234)
const gameTimer = new GameTimer();
const updater = new Updater()
const collisionManager = new CollisionManager();
const camera = new Camera(ctx, gameMap, {x:0, y:0}, BASE_WIDTH, BASE_HEIGHT, 0.1)
const renderer = new Renderer(ctx, camera)
// DEBUG
let debug = 1

// FPS COUNTER
let fps = 0;
let lastFpsUpdate = gameTimer.getTime();
let framesThisSecond = 0;

// PAUSE
const PAUSE_TOGGLE_COOLDOWN = 1000;
let requestId;
let paused = true;

// GAME TIMER
let lastTimestamp = gameTimer.getTime();
let deltaTime = 0;

// SCALING
let scale = 1;
let player;

function startGame(){
    resumeGame()
    createTimerModal()
    // createStatusEffectfMenu()

    player = new Player(canvas.width / 2, canvas.height / 2, 0, 45, 45, 5, 100);
    new Entity(500, 400, 0, 52, 52, 5, 100)
    // new Entity(600, 400, 0, 52, 52, 5, 100)
    // new Entity(600, 300, 0, 52, 52, 5, 100)
    // new Entity(500, 300, 0, 52, 52, 5, 100)
    // new Entity(550, 350, 0, 52, 52, 5, 100)
    const levelGrid = [
        [1, 1, 1, 1, 1,,, 1],
        [1, , , , 1],
        [1, , 1, , 1],
        [1, , , , 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1,,,,,,],
        [1, 1, 1, 1, 1,,,,1,,,1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
    ];
    function loadLevel(levelData) {
        const tileSize = 50;

        levelData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell === 1) {
                    new Wall(colIndex * tileSize, rowIndex * tileSize, tileSize, tileSize);
                                }
                if (cell === 0) {
                    new Wall(colIndex*tileSize, rowIndex*tileSize, tileSize, tileSize, 'green')
                }
            });
        });

    }
    loadLevel(levelGrid)
}

window.addEventListener('resize', () => {
    resize()
});
function resize(){
    const aspectRatio = 4 / 3;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Adjust the canvas size to maintain a 4:3 aspect ratio
    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    if(scale < 1){
        ctx.imageSmoothingEnabled = true; // turn it on for low res screens
    }else{
        ctx.imageSmoothingEnabled = false; // turn it off for high res screens.
    }
    ctx.scale(scale, scale);
}

function gameLoop() {
    if (!paused) {
        const timestamp = performance.now();
        deltaTime = (timestamp - lastTimestamp) / 33; // Relative to my developing pc 30 fps
        lastTimestamp = timestamp;
        updateAndDrawGame();

        const now = gameTimer.getTime();
        framesThisSecond++;
        fps = Math.round((framesThisSecond * 1000) / (now - lastFpsUpdate));
        if (now - lastFpsUpdate >= 1000) {
            lastFpsUpdate = now;
            framesThisSecond = 0;
            document.getElementById('fps-info').textContent = 'FPS: ' + fps;
        }

        document.getElementById('object-count').textContent = `Objects: ` + JSON.stringify(BaseDebugger.getObjectClassCount(), null, 2);
        document.getElementById('timer').textContent = `Timer: ` + JSON.stringify(gameTimer.getTime(), null, 2);
    }
    modals.forEach(modal => {
        modal.draw(ctx);
        modal.update();
    });
    requestId = requestAnimationFrame(gameLoop);
}

function updateAndDrawGame() {

    gameTimer.start();
    // enemy.attack()
    canvasObj.draw(ctx, camera);
    updater.update(BaseDebugger.objects)
    updater.update([camera, gameMap, canvasObj]);
    updater.update(modals);
    collisionManager.update();

    gameMap.draw(ctx, camera);
    renderer.draw(BaseDebugger.objects);

    if (debug) {
        collisionManager.getColliders().forEach(collider => {
            collider.draw(ctx);
        });
    }
}

function pauseGame() {
    let framesThisSecond = 0

    paused = true;
    gameTimer.pause();
}

function resumeGame() {
    if (paused) {
        paused = false;
        lastTimestamp = performance.now()
        gameTimer.start();
    }
}

function switchPause(){
    const currentTime = performance.now();
    if (currentTime - lastPauseToggleTime > PAUSE_TOGGLE_COOLDOWN) {
        switch (paused){
            case false:
                pauseMenu.show()
                pauseGame(); break
            case true:
                pauseMenu.hide()
                resumeGame(); break
        }
        lastPauseToggleTime = currentTime;
    }
}

function switchDebug(){
    switch(debug){
        case 0:
            debug = 1; break
        case 1:
            debug = 0; break
    }
}

let pauseMenu = initializePauseMenu();
let lastPauseToggleTime = 0;


document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        switchPause()
    }
});

gameLoop();

export {Collider, deltaTime, pauseGame, resumeGame, modals, camera, updater, BASE_WIDTH, BASE_HEIGHT, switchDebug, canvas, collisionManager, entities, walls, ctx, gameTimer, projectiles, gameMap, startGame, player}