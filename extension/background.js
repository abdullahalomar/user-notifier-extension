// Load local bundled Socket.io client in Service Worker
importScripts('lib/socket.io.min.js');

const SERVER_URL = 'https://user-notifier-extension.onrender.com';
let socket = null;
let currentUserId = null;
let currentUserName = null;

// Ensure unique persistent userId exists in chrome.storage.local
async function getOrCreateUserData() {
  const data = await chrome.storage.local.get(['userId', 'userName']);
  
  if (!data.userId) {
    data.userId = crypto.randomUUID();
    data.userName = 'User_' + data.userId.slice(0, 5);
    await chrome.storage.local.set({ userId: data.userId, userName: data.userName });
  }

  currentUserId = data.userId;
  currentUserName = data.userName || ('User_' + data.userId.slice(0, 5));
  return { userId: currentUserId, userName: currentUserName };
}

// Initialize Socket Connection
async function initSocket() {
  const { userId, userName } = await getOrCreateUserData();

  if (socket && socket.connected) return;

  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true
  });

  socket.on('connect', () => {
    console.log('✅ Connected to notification server as:', userName, `(${userId})`);
    socket.emit('register_user', { userId, userName });
  });

  socket.on('update_user_list', (usersList) => {
    // Store active online users in storage for popup UI
    chrome.storage.local.set({ onlineUsers: usersList });
  });

  socket.on('play_sound_notification', async ({ senderName, customMessage }) => {
    console.log(`🔔 Received sound trigger from: ${senderName}`);
    await triggerSoundPlayback(senderName, customMessage);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from notification server');
  });
}

// Create Offscreen document and send play command
async function triggerSoundPlayback(senderName, customMessage) {
  try {
    const hasDoc = await chrome.offscreen.hasDocument();
    if (!hasDoc) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play funny notification sound when targeted by another user'
      });
    }

    const { soundType = 'boing' } = await chrome.storage.local.get('soundType');

    // Send trigger to offscreen document
    chrome.runtime.sendMessage({ action: 'PLAY_SOUND', senderName, soundType });

    // Format beautiful notification message featuring sender's nickname
    const nickname = senderName || 'Someone';
    const titles = [
      `✨ Notification from ${nickname}!`,
      `🎉 ${nickname} sent you a sound!`,
      `🤪 ${nickname} is calling your attention!`,
      `💌 Greetings from ${nickname}`
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];

    let notificationBody = "";
    if (customMessage && customMessage.trim()) {
      notificationBody = `💬 "${customMessage.trim()}" — ${nickname}`;
    } else {
      const phrases = [
        `🌟 ${nickname} আপনাকে একটি বিশেষ ফানি সাউন্ড পাঠিয়েছেন! 🎶`,
        `🤪 ${nickname} আপনার মনোযোগ আকর্ষণ করছেন! শুনুন সুন্দর সাউন্ডটি!`,
        `🎉 ${nickname} (Nickname) আপনার দিনটিকে সুন্দর করতে একটি ফানি টিউন পাঠিয়েছেন! 🎈`,
        `✨ ${nickname} sent you a warm smile and a hilarious chime!`
      ];
      notificationBody = phrases[Math.floor(Math.random() * phrases.length)];
    }

    // Show system notification with sender nickname
    chrome.notifications.create(`notif_${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: randomTitle,
      message: notificationBody
    });
  } catch (err) {
    console.error('Error playing sound:', err);
  }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.action === 'SEND_TRIGGER') {
      const { targetUserId, customMessage } = message;
      const { userName } = await chrome.storage.local.get('userName');
      
      if (socket && socket.connected) {
        socket.emit('send_sound_trigger', {
          targetUserId,
          senderName: userName || 'Someone',
          customMessage: customMessage || ''
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Socket not connected' });
      }
    } else if (message.action === 'UPDATE_NAME') {
      const { newName } = message;
      await chrome.storage.local.set({ userName: newName });
      currentUserName = newName;
      if (socket && socket.connected) {
        socket.emit('update_name', { userId: currentUserId, newName });
      }
      sendResponse({ success: true });
    } else if (message.action === 'RECONNECT') {
      await initSocket();
      sendResponse({ success: true });
    }
  })();
  return true; // Keep message channel open for async response
});

// Start socket connection on service worker startup
initSocket();
