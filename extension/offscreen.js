// Web Audio API synthesis for standard clean notification sounds
function playStandardSound(soundType = 'chime') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    switch (soundType) {
      case 'glass':
        playGlassBell(audioCtx, now);
        break;
      case 'ping':
        playTwoTonePing(audioCtx, now);
        break;
      case 'pulse':
        playTechPulse(audioCtx, now);
        break;
      case 'breeze':
        playSoftBreeze(audioCtx, now);
        break;
      case 'chime':
      default:
        playStandardChime(audioCtx, now);
        break;
    }
  } catch (err) {
    console.error('Failed to play standard sound via Web Audio API:', err);
  }
}

// 1. Standard Chime 🔔 (Harmonized E5 -> B5, clean & professional)
function playStandardChime(audioCtx, now) {
  const notes = [
    { freq: 659.25, time: 0, duration: 0.25 },
    { freq: 987.77, time: 0.1, duration: 0.4 }
  ];

  notes.forEach((note) => {
    const startTime = now + note.time;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration);
  });
}

// 2. Crystal Glass Bell ✨ (C6 -> G6 high shimmer bell)
function playGlassBell(audioCtx, now) {
  const notes = [
    { freq: 1046.50, time: 0, duration: 0.3 },
    { freq: 1567.98, time: 0.08, duration: 0.5 }
  ];

  notes.forEach((note) => {
    const startTime = now + note.time;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, startTime);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration);
  });
}

// 3. Two-Tone Studio Ping 🎵 (A5 -> D6 smooth ping)
function playTwoTonePing(audioCtx, now) {
  const notes = [
    { freq: 880.00, time: 0, duration: 0.2 },
    { freq: 1174.66, time: 0.12, duration: 0.35 }
  ];

  notes.forEach((note) => {
    const startTime = now + note.time;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration);
  });
}

// 4. Modern Tech Pulse 💎 (Double soft electronic pulse)
function playTechPulse(audioCtx, now) {
  const p1 = audioCtx.createOscillator();
  const g1 = audioCtx.createGain();
  p1.type = 'sine';
  p1.frequency.setValueAtTime(523.25, now);
  g1.gain.setValueAtTime(0.35, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  p1.connect(g1);
  g1.connect(audioCtx.destination);
  p1.start(now);
  p1.stop(now + 0.15);

  const p2 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  p2.type = 'sine';
  p2.frequency.setValueAtTime(1046.50, now + 0.12);
  g2.gain.setValueAtTime(0.3, now + 0.12);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  p2.connect(g2);
  g2.connect(audioCtx.destination);
  p2.start(now + 0.12);
  p2.stop(now + 0.32);
}

// 5. Soft Ambient Breeze 🍃 (3-note ascending arpeggio C5 -> E5 -> G5)
function playSoftBreeze(audioCtx, now) {
  const notes = [
    { freq: 523.25, time: 0, duration: 0.25 },
    { freq: 659.25, time: 0.08, duration: 0.25 },
    { freq: 783.99, time: 0.16, duration: 0.4 }
  ];

  notes.forEach((note) => {
    const startTime = now + note.time;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration);
  });
}

// Listen for play sound commands from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PLAY_SOUND') {
    playStandardSound(message.soundType || 'chime');
    sendResponse({ status: 'sound_played' });
  }
  return true;
});
