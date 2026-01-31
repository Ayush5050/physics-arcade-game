/**
 * Audio Engine using Web Audio API
 * Creates unique tones for each game object type
 */

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgOscillator = null;
        this.bgGain = null;
        this.currentDominantType = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        try {
            // Create audio context (might be suspended initially)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain for overall volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5; // Bumped to 50% volume
            this.masterGain.connect(this.audioContext.destination);

            // Background music gain
            this.bgGain = this.audioContext.createGain();
            this.bgGain.gain.value = 0;
            this.bgGain.connect(this.masterGain);

            this.isInitialized = true;
        } catch (e) {
            console.error("AudioEngine failed to initialize:", e);
        }
    }

    // Play spawn sound for each object type
    playSpawnSound(type) {
        if (!this.isInitialized || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        const tones = {
            rock: { freq: 150, wave: 'square' },      // More punchy
            paper: { freq: 300, wave: 'sine' },       // Clearer
            scissors: { freq: 450, wave: 'triangle' } // Sharper
        };

        const tone = tones[type] || tones.rock;
        oscillator.type = tone.wave;
        oscillator.frequency.setValueAtTime(tone.freq, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    // Play transformation sound (when one converts another)
    playTransformSound(fromType, toType) {
        if (!this.isInitialized) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        const tones = {
            rock: 130.81,
            paper: 261.63,
            scissors: 392.00
        };

        // Sweep from old type to new type
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(tones[fromType], now);
        oscillator.frequency.exponentialRampToValueAtTime(tones[toType], now + 0.2);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + 0.25);
    }

    // Start background music when one type dominates
    startDominantMusic(type) {
        if (!this.isInitialized) return;
        if (this.currentDominantType === type) return;

        this.currentDominantType = type;

        // Stop existing background music
        this.stopBackgroundMusic();

        const now = this.audioContext.currentTime;

        // Create oscillators for a richer sound (chord)
        const tones = {
            rock: [130.81, 164.81, 196.00],      // C3, E3, G3 - C major chord
            paper: [261.63, 329.63, 392.00],     // C4, E4, G4 - C major chord (higher)
            scissors: [392.00, 493.88, 587.33]   // G4, B4, D5 - G major chord
        };

        const frequencies = tones[type];
        this.bgOscillators = [];

        frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Slight detuning for richness
            osc.detune.setValueAtTime((index - 1) * 2, now);

            oscGain.gain.setValueAtTime(0.1, now);

            osc.connect(oscGain);
            oscGain.connect(this.bgGain);

            osc.start(now);
            this.bgOscillators.push(osc);
        });

        // Fade in background music
        this.bgGain.gain.setValueAtTime(0, now);
        this.bgGain.gain.linearRampToValueAtTime(0.15, now + 1.0);
    }

    stopBackgroundMusic() {
        if (!this.isInitialized) return;

        const now = this.audioContext.currentTime;

        // Fade out
        this.bgGain.gain.linearRampToValueAtTime(0, now + 0.5);

        if (this.bgOscillators) {
            this.bgOscillators.forEach(osc => {
                osc.stop(now + 0.5);
            });
            this.bgOscillators = [];
        }

        this.currentDominantType = null;
    }

    // Resume audio context (needed for some browsers)
    resume() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully");
            }).catch(e => {
                console.error("Failed to resume AudioContext:", e);
            });
        }
    }

    stop() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
            this.isInitialized = false;
        }
    }
}
