// Web Audio API synthesis for funny notification sounds
function playFunnySound(soundType = 'boing') {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    switch (soundType) {
      case 'quack':
        playDuckQuack(audioCtx, now);
        break;
      case 'wahwah':
        playSadTrombone(audioCtx, now);
        break;
      case 'pop':
        playCartoonPop(audioCtx, now);
        break;
      case 'whistle':
        playSlideWhistle(audioCtx, now);
        break;
      case 'boing':
      default:
        playCartoonBoing(audioCtx, now);
        break;
    }
  } catch (err) {
    console.error('Failed to play funny sound via Web Audio API:', err);
  }
}

// 1. Cartoon Boing / Spring Bounce 🤪
function playCartoonBoing(audioCtx, now) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(560, now + 0.35);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(28, now);
  lfoGain.gain.setValueAtTime(45, now);

  lfo.connect(osc.frequency);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  lfo.start(now);
  osc.start(now);
  lfo.stop(now + 0.45);
  osc.stop(now + 0.45);
}

// 2. Duck Quack 🦆
function playDuckQuack(audioCtx, now) {
  function singleQuack(startTime) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, startTime);
    osc.frequency.exponentialRampToValueAtTime(180, startTime + 0.15);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, startTime);
    filter.Q.setValueAtTime(4, startTime);

    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.18);
  }

  singleQuack(now);
  singleQuack(now + 0.2);
}

// 3. Sad Trombone (Wah-Wah) 🎺
function playSadTrombone(audioCtx, now) {
  const notes = [
    { freq: 311.13, duration: 0.25 },
    { freq: 293.66, duration: 0.25 },
    { freq: 277.18, duration: 0.25 },
    { freq: 261.63, duration: 0.6 }
  ];

  let timeOffset = 0;
  notes.forEach((note, idx) => {
    const startTime = now + timeOffset;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(note.freq, startTime);

    if (idx === 3) {
      osc.frequency.linearRampToValueAtTime(220, startTime + note.duration);
    }

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration);

    timeOffset += note.duration + 0.03;
  });
}

// 4. Funny Cartoon Pop / Squeak 🎈
function playCartoonPop(audioCtx, now) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.09);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(800, now + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(300, now + 0.18);

  gain2.gain.setValueAtTime(0.4, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);

  osc2.start(now + 0.1);
  osc2.stop(now + 0.19);
}

// 5. Slide Whistle Up & Down 🌀
function playSlideWhistle(audioCtx, now) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.6);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.65);
}

// Listen for play sound commands from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PLAY_SOUND') {
    playFunnySound(message.soundType || 'boing');
    sendResponse({ status: 'sound_played' });
  }
  return true;
});

