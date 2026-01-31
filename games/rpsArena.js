/**
 * Rock-Paper-Scissors Physics Arena
 */
import { PhysicsEngine } from '../engine/physics.js';
import { AudioEngine } from '../engine/audio.js';

export const rpsArena = {
    engine: null,
    audio: null,
    canvas: null,
    ctx: null,
    animationId: null,
    width: 0,
    height: 0,

    // Walls state
    walls: {},

    // Bounds properties
    bounds: { x: 0, y: 0, size: 0 },

    onGameOver: null,

    // Game State
    counts: { rock: 0, paper: 0, scissors: 0 },
    isOver: false,
    startTime: 0,
    speedBoosted: false,
    lastDominantType: null,

    // DOM Elements for score
    scoreEls: {
        rock: document.getElementById('score-rock'),
        paper: document.getElementById('score-paper'),
        scissors: document.getElementById('score-scissors')
    },

    start(canvas, onGameOverCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOverCallback;
        this.width = canvas.parentElement.clientWidth;
        this.height = canvas.parentElement.clientHeight;
        this.isOver = false;
        this.walls = {}; // Reset walls
        this.startTime = Date.now();
        this.speedBoosted = false;

        // Resize canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Calculate Box Dimensions (Centered Square)
        const margin = 50;
        const size = Math.min(this.width, this.height) - (margin * 2);
        const startX = (this.width - size) / 2;
        const startY = (this.height - size) / 2;

        this.bounds = { x: startX, y: startY, size: size };

        // Init Audio
        if (!this.audio) {
            this.audio = new AudioEngine();
        }
        this.audio.init();
        this.lastDominantType = null;

        // Resume audio on user interaction (browser requirement)
        this.canvas.addEventListener('click', () => this.audio.resume(), { once: true });

        // Init Physics
        this.engine = new PhysicsEngine();
        this.engine.init();

        // Zero Gravity
        this.engine.engine.gravity.y = 0;

        // Create Visible Boundaries
        const wallBodies = this.engine.createBoundaries(startX, startY, size, size, 10);

        // Map walls for easy access and state tracking
        wallBodies.forEach(w => {
            this.walls[w.id] = {
                body: w,
                hitIntensity: 0,
                baseColor: `rgba(255, 255, 255, 0.2)`
            };
        });

        // Spawn Objects
        this.spawnObjects();

        // Setup Collision Events
        this.setupCollisions();

        // Start Physics
        this.engine.start();

        // Start Render Loop
        this.loop();
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.engine) {
            this.engine.stop();
        }
        if (this.audio) {
            this.audio.stopBackgroundMusic();
        }
        this.engine = null;
        this.counts = { rock: 0, paper: 0, scissors: 0 };
    },

    spawnObjects() {
        const { Bodies, Composite } = window.Matter;
        const total = 99; // 33 of each type
        const types = ['rock', 'paper', 'scissors'];
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        const radius = 12;

        const { x, y, size } = this.bounds;
        const padding = 20;

        for (let i = 0; i < total; i++) {
            const type = types[i % 3];

            // Random position inside the box
            const spawnX = x + padding + Math.random() * (size - padding * 2);
            const spawnY = y + padding + Math.random() * (size - padding * 2);

            const body = Bodies.circle(spawnX, spawnY, radius, {
                restitution: 1.0,
                friction: 0,
                frictionAir: 0,
                frictionStatic: 0,
                inertia: Infinity, // Prevent rotation (Ideal Particle)
                inverseInertia: 0,
                sleepThreshold: Infinity, // Never sleep
                label: type,
                render: { fillStyle: 'transparent' }
            });

            body.gameType = type;
            body.gameEmoji = emojis[type];
            body.spawnTime = Date.now(); // Track spawn time for intro animation

            // Random Velocity
            const launchSpeed = 3;
            const angle = Math.random() * Math.PI * 2;
            window.Matter.Body.setVelocity(body, {
                x: Math.cos(angle) * launchSpeed,
                y: Math.sin(angle) * launchSpeed
            });

            Composite.add(this.engine.engine.world, body);

            // Play spawn sound (staggered to avoid overwhelming)
            if (i % 10 === 0) {
                setTimeout(() => this.audio.playSpawnSound(type), i * 5);
            }
        }

        this.counts = { rock: total / 3, paper: total / 3, scissors: total / 3 };
        this.updateScoreboard();
    },

    setupCollisions() {
        const { Events } = window.Matter;

        Events.on(this.engine.engine, 'collisionStart', (event) => {
            if (this.isOver) return;

            const pairs = event.pairs;

            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                // Wall Collision Check (Action-Reaction Visuals)
                this.checkWallCollision(bodyA, bodyB) || this.checkWallCollision(bodyB, bodyA);

                // Game Logic Collision
                if (!bodyA.label.startsWith('Wall') && !bodyB.label.startsWith('Wall')) {
                    this.resolveInteraction(bodyA, bodyB);
                }
            }
        });
    },

    checkWallCollision(wall, obj) {
        if (wall.label && wall.label.startsWith('Wall-')) {
            // Wall collision detected but no visual effect
            // if (this.walls[wall.id]) {
            //     const impact = obj.speed * 0.5;
            //     const intensity = Math.min(impact, 1.0);
            //     this.walls[wall.id].hitIntensity = Math.min(this.walls[wall.id].hitIntensity + intensity, 1.0);
            // }
            return true;
        }
        return false;
    },

    resolveInteraction(bodyA, bodyB) {
        const typeA = bodyA.gameType;
        const typeB = bodyB.gameType;

        if (typeA === typeB) return;

        let winner = null;
        let loser = null;

        if (typeA === 'rock' && typeB === 'scissors') { winner = bodyA; loser = bodyB; }
        else if (typeA === 'scissors' && typeB === 'rock') { winner = bodyB; loser = bodyA; }

        else if (typeA === 'scissors' && typeB === 'paper') { winner = bodyA; loser = bodyB; }
        else if (typeA === 'paper' && typeB === 'scissors') { winner = bodyB; loser = bodyA; }

        else if (typeA === 'paper' && typeB === 'rock') { winner = bodyA; loser = bodyB; }
        else if (typeA === 'rock' && typeB === 'paper') { winner = bodyB; loser = bodyA; }

        if (winner && loser) {
            this.transform(loser, winner.gameType);
            this.checkWinCondition();
        }
    },

    transform(body, newType) {
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

        const oldType = body.gameType;

        this.counts[body.gameType]--;
        this.counts[newType]++;
        this.updateScoreboard();

        body.gameType = newType;
        body.gameEmoji = emojis[newType];
        body.label = newType;

        // Play transformation sound
        this.audio.playTransformSound(oldType, newType);

        // Reverted Mass update
    },

    // ... updateScoreboard, checkWinCondition ...

    updateScoreboard() {
        if (!this.scoreEls.rock) {
            this.scoreEls = {
                rock: document.getElementById('score-rock'),
                paper: document.getElementById('score-paper'),
                scissors: document.getElementById('score-scissors')
            };
        }
        this.scoreEls.rock.innerText = this.counts.rock;
        this.scoreEls.paper.innerText = this.counts.paper;
        this.scoreEls.scissors.innerText = this.counts.scissors;
    },

    checkWinCondition() {
        const { rock, paper, scissors } = this.counts;
        const activeTypes = [rock > 0, paper > 0, scissors > 0].filter(Boolean).length;

        if (activeTypes === 1) {
            this.isOver = true;
            let winner = '';
            if (rock > 0) winner = 'Rock';
            else if (paper > 0) winner = 'Paper';
            else winner = 'Scissors';

            this.onGameOver(winner);
        }
    },

    loop() {
        if (!this.engine) return;

        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    update() {
        const engine = this.engine.engine;
        const bodies = window.Matter.Composite.allBodies(engine.world);

        // Check for dominant type and play background music
        if (!this.isOver) {
            const total = this.counts.rock + this.counts.paper + this.counts.scissors;
            const dominanceThreshold = 0.7; // 70% dominance

            let dominantType = null;
            if (this.counts.rock / total > dominanceThreshold) dominantType = 'rock';
            else if (this.counts.paper / total > dominanceThreshold) dominantType = 'paper';
            else if (this.counts.scissors / total > dominanceThreshold) dominantType = 'scissors';

            if (dominantType !== this.lastDominantType) {
                if (dominantType) {
                    this.audio.startDominantMusic(dominantType);
                } else {
                    this.audio.stopBackgroundMusic();
                }
                this.lastDominantType = dominantType;
            }
        }

        // Check for Speed Boost (50 seconds)
        if (!this.speedBoosted && !this.isOver) {
            const elapsed = Date.now() - this.startTime;
            if (elapsed > 50000) { // 50 seconds
                this.speedBoosted = true;
                bodies.forEach(body => {
                    if (!body.isStatic) {
                        window.Matter.Body.setVelocity(body, {
                            x: body.velocity.x * 1.5,
                            y: body.velocity.y * 1.5
                        });
                    }
                });
                Object.values(this.walls).forEach(w => w.hitIntensity = 2.0);
            }
        }

        // Bounds / Containment Check (Fix for Escaped Objects)
        const { x, y, size } = this.bounds;
        // Allow a small buffer outside the visible box before forcing them back
        const buffer = 50;

        bodies.forEach(body => {
            if (body.isStatic || body.label.startsWith('Wall')) return;

            // 1. Anti-Stall: Boost if too slow
            const speed = body.speed;
            const minSpeed = 2.0;

            if (speed < minSpeed) {
                let vx = body.velocity.x;
                let vy = body.velocity.y;
                if (speed < 0.1) {
                    const angle = Math.random() * Math.PI * 2;
                    vx = Math.cos(angle);
                    vy = Math.sin(angle);
                }
                const factor = minSpeed / (speed || 1);
                window.Matter.Body.setVelocity(body, { x: vx * factor, y: vy * factor });
            }

            // 2. Containment: Teleport back if escaped
            const p = body.position;
            const minX = x - buffer;
            const maxX = x + size + buffer;
            const minY = y - buffer;
            const maxY = y + size + buffer;

            let escaped = false;
            let newX = p.x;
            let newY = p.y;

            if (p.x < minX) { newX = x + 20; escaped = true; }
            if (p.x > maxX) { newX = x + size - 20; escaped = true; }
            if (p.y < minY) { newY = y + 20; escaped = true; }
            if (p.y > maxY) { newY = y + size - 20; escaped = true; }

            if (escaped) {
                // Teleport back inside with random velocity towards center
                window.Matter.Body.setPosition(body, { x: newX, y: newY });

                // Shoot it towards center to prevent re-escape
                const centerX = x + size / 2;
                const centerY = y + size / 2;
                const angle = Math.atan2(centerY - newY, centerX - newX);
                const velocity = 5;
                window.Matter.Body.setVelocity(body, {
                    x: Math.cos(angle) * velocity,
                    y: Math.sin(angle) * velocity
                });
            }
        });

        // Decay wall hits
        for (const id in this.walls) {
            const wall = this.walls[id];
            if (wall.hitIntensity > 0) {
                wall.hitIntensity -= 0.05;
                if (wall.hitIntensity < 0) wall.hitIntensity = 0;
            }
        }
    },

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw Walls (with reaction effect)
        Object.values(this.walls).forEach(wallRef => {
            const body = wallRef.body;
            const intensity = wallRef.hitIntensity;

            ctx.beginPath();
            const vertices = body.vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            ctx.lineTo(vertices[0].x, vertices[0].y);

            // Pulse logic
            if (intensity > 0) {
                // Flash white/blue
                ctx.fillStyle = `rgba(100, 108, 255, ${0.4 + intensity * 0.6})`;
                // Slight shake effect could be added here by offsetting vertex drawing, but color is safer
                ctx.shadowBlur = 20 * intensity;
                ctx.shadowColor = '#646cff';
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
                ctx.shadowBlur = 0;
            }

            ctx.fill();
            ctx.shadowBlur = 0; // Reset
        });

        // Draw Objects
        const bodies = window.Matter.Composite.allBodies(this.engine.engine.world);

        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        bodies.forEach(body => {
            if (body.label.startsWith('Wall')) return; // Already drawn

            // Draw Emoji with intro animation
            if (body.gameEmoji) {
                let scale = 1;
                let alpha = 1;

                // Intro animation (first 500ms after spawn)
                if (body.spawnTime) {
                    const elapsed = Date.now() - body.spawnTime;
                    const introDuration = 500; // 500ms intro

                    if (elapsed < introDuration) {
                        const progress = elapsed / introDuration;
                        // Bounce easing for scale
                        scale = progress < 0.5
                            ? 2 * progress * progress
                            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                        alpha = progress;
                    }
                }

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(body.position.x, body.position.y + 2);
                ctx.scale(scale, scale);
                ctx.fillText(body.gameEmoji, 0, 0);
                ctx.restore();
            }
        });
    }
};
