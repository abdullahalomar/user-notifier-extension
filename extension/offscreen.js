// Web Audio API synthesis for notification chime
function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create two pleasant chime notes (C5 -> G5)
    const now = audioCtx.currentTime;
    
    // Note 1: C5 (523.25 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: G5 (783.99 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.15);
    gain2.gain.setValueAtTime(0.4, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.error('Failed to play sound via Web Audio API:', err);
  }
}

// Listen for play sound commands from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PLAY_SOUND') {
    playNotificationChime();
    sendResponse({ status: 'sound_played' });
  }
  return true;
});
