/**
 * Physics Engine Helper
 * Wrapper around Matter.js to simplify game setup
 */

export class PhysicsEngine {
    constructor() {
        this.Matter = window.Matter;
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Initialize physics engine without the built-in renderer (we use custom canvas render)
     */
    init() {
        // Create engine
        this.engine = this.Matter.Engine.create();

        // Create runner
        this.runner = this.Matter.Runner.create();
    }

    /**
     * Create static walls at specific coordinates
     */
    createBoundaries(x, y, width, height, thickness = 20) {
        this.width = width;
        this.height = height;

        const Bodies = this.Matter.Bodies;
        const World = this.Matter.World;

        const wallOptions = {
            isStatic: true,
            friction: 0,
            restitution: 1.0, // Perfect bounce
            label: 'Wall',
            render: { fillStyle: '#ffffff' }
        };

        const walls = [
            // Top
            Bodies.rectangle(x + width / 2, y - thickness / 2, width + thickness * 2, thickness, { ...wallOptions, label: 'Wall-Top' }),
            // Bottom
            Bodies.rectangle(x + width / 2, y + height + thickness / 2, width + thickness * 2, thickness, { ...wallOptions, label: 'Wall-Bottom' }),
            // Left
            Bodies.rectangle(x - thickness / 2, y + height / 2, thickness, height + thickness * 2, { ...wallOptions, label: 'Wall-Left' }),
            // Right
            Bodies.rectangle(x + width + thickness / 2, y + height / 2, thickness, height + thickness * 2, { ...wallOptions, label: 'Wall-Right' })
        ];

        World.add(this.engine.world, walls);
        return walls;
    }

    /**
     * Start the physics simulation
     */
    start() {
        this.Matter.Runner.run(this.runner, this.engine);
    }

    /**
     * Pause the physics simulation (keeps state)
     */
    pause() {
        if (this.runner) {
            this.Matter.Runner.stop(this.runner);
        }
    }

    /**
     * Resume the physics simulation
     */
    resume() {
        if (this.runner && this.engine) {
            this.Matter.Runner.run(this.runner, this.engine);
        }
    }

    /**
     * Stop the physics simulation and clear the world
     */
    stop() {
        this.Matter.Runner.stop(this.runner);
        this.Matter.World.clear(this.engine.world);
        this.Matter.Engine.clear(this.engine);
        this.engine = null;
        this.runner = null;
    }
}
