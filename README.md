# 🎮 Arc Games

A collection of physics-based arcade games built with vanilla JavaScript and Matter.js.

## 🎯 Games

### Rock-Paper-Scissors Physics Arena
Watch 99 objects battle it out in a zero-gravity arena! Each object follows the classic RPS rules:
- 🪨 Rock beats ✂️ Scissors
- ✂️ Scissors beats 📄 Paper  
- 📄 Paper beats 🪨 Rock

**Features:**
- Ideal physics simulation (no rotation, perfect elasticity)
- Speed boost after 50 seconds
- Colorful flower-pattern background
- Real-time scoreboard
- Anti-stall system for endless gameplay

## 🚀 How to Run

This project uses ES6 modules, so you need a local web server:

### Option 1: Python
```bash
python3 -m http.server 8080
```

### Option 2: Node.js
```bash
npx serve .
```

Then open `http://localhost:8080` in your browser.

## 🛠️ Tech Stack

- **Vanilla JavaScript** (ES6 Modules)
- **Matter.js** - 2D physics engine
- **HTML5 Canvas** - Rendering
- **CSS3** - Styling

## 📁 Project Structure

```
arcGames/
├── index.html          # Main HTML file
├── style.css           # Global styles
├── main.js            # Game manager
├── engine/
│   └── physics.js     # Physics engine wrapper
├── games/
│   └── rpsArena.js    # RPS Arena game logic
└── vendor/
    └── matter.min.js  # Matter.js library
```

## 🎨 Features

- Zero gravity physics
- Ideal particle collisions (no energy loss to rotation)
- Automatic containment system
- Responsive design
- Modular game architecture

## 📝 License

MIT License - feel free to use and modify!

---

Built with ❤️ using vanilla JavaScript
