// A simple sound player using the Web Audio API to generate tones without needing audio files.

let audioContext: AudioContext | null = null;

/**
 * Initializes the AudioContext.
 * This must be called as a result of a user gesture (e.g., a click) to comply with browser autoplay policies.
 */
const initializeAudioContext = () => {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
        }
    }
    // In case the context was suspended, resume it.
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

// Add listeners to initialize the audio context on the first user interaction.
document.body.addEventListener('click', initializeAudioContext, { once: true });
document.body.addEventListener('touchend', initializeAudioContext, { once: true });

export type SoundType = 'click' | 'select' | 'deselect' | 'clear' | 'success' | 'gameOver' | 'incorrect';

interface SoundParams {
    type: OscillatorType;
    frequency: number;
    duration: number;
    volume: number;
}

// Defines the parameters for each sound effect.
const sounds: Record<SoundType, SoundParams | SoundParams[]> = {
    click: { type: 'sine', frequency: 587.33, duration: 0.08, volume: 0.3 }, // D5
    select: { type: 'sine', frequency: 698.46, duration: 0.1, volume: 0.4 }, // F5
    deselect: { type: 'sine', frequency: 440.00, duration: 0.1, volume: 0.4 }, // A4
    clear: { type: 'triangle', frequency: 220, duration: 0.1, volume: 0.25 },
    incorrect: [
        { type: 'sawtooth', frequency: 392.00, duration: 0.1, volume: 0.2 }, // G4
        { type: 'sawtooth', frequency: 261.63, duration: 0.15, volume: 0.2 }, // C4
    ],
    success: [
        { type: 'sine', frequency: 523.25, duration: 0.1, volume: 0.3 }, // C5
        { type: 'sine', frequency: 659.25, duration: 0.1, volume: 0.3 }, // E5
        { type: 'sine', frequency: 783.99, duration: 0.1, volume: 0.3 }, // G5
    ],
    gameOver: [
        { type: 'sine', frequency: 783.99, duration: 0.12, volume: 0.4 }, // G5
        { type: 'sine', frequency: 659.25, duration: 0.12, volume: 0.4 }, // E5
        { type: 'sine', frequency: 523.25, duration: 0.12, volume: 0.4 }, // C5
        { type: 'sine', frequency: 392.00, duration: 0.2, volume: 0.4 }, // G4
    ],
};

/**
 * Plays a sound effect based on its type.
 * @param type The type of sound to play.
 */
export const playSound = (type: SoundType) => {
    if (!audioContext) {
        initializeAudioContext();
        if (!audioContext) return;
    }
    
    // Double-check and resume the context if needed.
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const soundData = sounds[type];
    const now = audioContext.currentTime;
    
    const playNote = (params: SoundParams, delay: number) => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = params.type;
        oscillator.frequency.setValueAtTime(params.frequency, now + delay);

        gainNode.gain.setValueAtTime(params.volume, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + params.duration);

        oscillator.start(now + delay);
        oscillator.stop(now + delay + params.duration);
    }
    
    if (Array.isArray(soundData)) {
        let cumulativeDelay = 0;
        soundData.forEach(note => {
            playNote(note, cumulativeDelay);
            cumulativeDelay += note.duration;
        });
    } else {
        playNote(soundData, 0);
    }
};