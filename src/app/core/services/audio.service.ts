import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  public readonly isAmbientPlaying = signal<boolean>(false);
  public readonly isNarrationPlaying = signal<boolean>(false);
  public readonly volume = signal<number>(0.6);
  public readonly currentNarrationText = signal<string>('');

  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isSynthesizerActive = false;
  private synthInterval: any = null;

  // Web Speech API
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = this.volume();
        this.gainNode.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Toggle Ambient Royal Soundscape (Harmonic pentatonic palace bells & warm ambient pad)
  public toggleAmbient() {
    if (this.isAmbientPlaying()) {
      this.stopAmbient();
    } else {
      this.playAmbient();
    }
  }

  public playAmbient() {
    this.initAudioContext();
    if (!this.audioCtx || !this.gainNode) return;
    this.isAmbientPlaying.set(true);
    this.isSynthesizerActive = true;

    // Pentatonic Thai / Classical Royal frequencies (F, G, A, C, D)
    const notes = [174.61, 220.00, 261.63, 293.66, 349.23, 440.00, 523.25];

    const playHarmonicTone = () => {
      if (!this.isSynthesizerActive || !this.audioCtx || !this.gainNode) return;
      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      const note = notes[Math.floor(Math.random() * notes.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, this.audioCtx.currentTime);

      const now = this.audioCtx.currentTime;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.08 * this.volume(), now + 1.2);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start(now);
      osc.stop(now + 4.6);
    };

    // Initial note
    playHarmonicTone();
    this.synthInterval = setInterval(() => {
      if (this.isSynthesizerActive) {
        playHarmonicTone();
      }
    }, 2800);
  }

  public stopAmbient() {
    this.isAmbientPlaying.set(false);
    this.isSynthesizerActive = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // Play Thai Voice Narration
  public speakNarration(text: string) {
    if (!this.synth) {
      this.currentNarrationText.set(text);
      this.isNarrationPlaying.set(true);
      setTimeout(() => this.isNarrationPlaying.set(false), 5000);
      return;
    }

    this.stopNarration();
    this.currentNarrationText.set(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.92; // Serene, dignified pace
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isNarrationPlaying.set(true);
    };

    utterance.onend = () => {
      this.isNarrationPlaying.set(false);
      this.currentNarrationText.set('');
    };

    utterance.onerror = () => {
      this.isNarrationPlaying.set(false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stopNarration() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isNarrationPlaying.set(false);
    this.currentNarrationText.set('');
  }

  public setVolume(val: number) {
    this.volume.set(val);
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(val, this.audioCtx.currentTime);
    }
  }
}
