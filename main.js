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

        // Controls
        this.ctrlPause = document.getElementById('ctrl-pause');
        this.ctrlRestart = document.getElementById('ctrl-restart');
        this.ctrlAudio = document.getElementById('ctrl-audio');

        this.init();
    }

    init() {
        // Event Listeners
        this.btnRps.addEventListener('click', () => this.loadGame(rpsArena));
        this.restartBtn.addEventListener('click', () => this.restartCurrentGame());

        // Control Bar Listeners
        this.ctrlPause.addEventListener('click', () => this.handleTogglePause());
        this.ctrlRestart.addEventListener('click', () => this.restartCurrentGame());
        this.ctrlAudio.addEventListener('click', () => this.handleToggleAudio());

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
            // Reset icons on restart
            this.ctrlPause.querySelector('.icon').innerText = '⏸️';
        }
    }

    handleTogglePause() {
        if (!this.activeGame) return;
        const isPaused = this.activeGame.togglePause();
        this.ctrlPause.querySelector('.icon').innerText = isPaused ? '▶️' : '⏸️';
    }

    handleToggleAudio() {
        if (!this.activeGame || !this.activeGame.audio) return;
        const isMuted = this.activeGame.audio.toggleMute();
        this.ctrlAudio.querySelector('.icon').innerText = isMuted ? '🔇' : '🔊';
    }

    onGameOver(winner) {
        this.overlayTitle.innerText = `Winner: ${winner}`;
        this.overlay.classList.remove('hidden');
    }
}

// Start the app
const app = new GameManager();
