import { rpsArena } from './games/rpsArena.js';

class GameManager {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.overlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.restartBtn = document.getElementById('btn-restart');

        this.activeGame = null;

        // Navigation
        this.btnRps = document.getElementById('btn-rps');

        this.init();
    }

    init() {
        // Event Listeners
        this.btnRps.addEventListener('click', () => this.loadGame(rpsArena));
        this.restartBtn.addEventListener('click', () => this.restartCurrentGame());

        // Default Load - Wait for layout to settle
        window.addEventListener('load', () => {
            // adjust canvas size to container
            this.handleResize();
            this.loadGame(rpsArena);
        });

        window.addEventListener('resize', () => {
            this.handleResize();
            // Optional: restart game on massive resize to reset boundaries
        });
    }

    handleResize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    loadGame(gameModule) {
        // Stop existing game
        if (this.activeGame) {
            this.activeGame.stop();
        }

        // Reset UI
        this.overlay.classList.add('hidden');

        // Start New Game
        this.activeGame = gameModule;
        this.activeGame.start(this.canvas, (winner) => this.onGameOver(winner));

        // Update Sidebar UI (Manual for now since we only have one game)
        document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
        this.btnRps.classList.add('active');
    }

    restartCurrentGame() {
        if (this.activeGame) {
            this.loadGame(this.activeGame);
        }
    }

    onGameOver(winner) {
        this.overlayTitle.innerText = `Winner: ${winner}`;
        this.overlay.classList.remove('hidden');
    }
}

// Start the app
const app = new GameManager();
