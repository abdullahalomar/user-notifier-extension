document.addEventListener('DOMContentLoaded', async () => {
  const nameInput = document.getElementById('nameInput');
  const saveNameBtn = document.getElementById('saveNameBtn');
  const uuidDisplay = document.getElementById('uuidDisplay');
  const userList = document.getElementById('userList');
  const onlineCount = document.getElementById('onlineCount');

  // Load user data from storage
  const { userId, userName, onlineUsers = [] } = await chrome.storage.local.get([
    'userId',
    'userName',
    'onlineUsers'
  ]);

  if (userId) {
    uuidDisplay.textContent = `UUID: ${userId}`;
  }
  if (userName) {
    nameInput.value = userName;
  }

  // Update display name event
  saveNameBtn.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    if (newName) {
      chrome.runtime.sendMessage({ action: 'UPDATE_NAME', newName }, (res) => {
        saveNameBtn.textContent = 'Saved!';
        setTimeout(() => { saveNameBtn.textContent = 'Save'; }, 1500);
      });
    }
  });

  // Render user list
  function renderUsers(users) {
    userList.innerHTML = '';

    // Filter out self
    const otherUsers = users.filter(u => u.userId !== userId);
    onlineCount.textContent = `${otherUsers.length} online`;

    if (otherUsers.length === 0) {
      userList.innerHTML = `<div class="empty-state">No other users online right now</div>`;
      return;
    }

    otherUsers.forEach(user => {
      const card = document.createElement('div');
      card.className = 'user-card';
      card.innerHTML = `
        <div class="user-info">
          <div class="status-dot"></div>
          <div>
            <div class="user-name">${escapeHtml(user.userName)}</div>
            <div class="user-id-sub">${escapeHtml(user.userId.slice(0, 8))}...</div>
          </div>
        </div>
        <div class="sound-icon" title="Click to trigger sound">🔊</div>
      `;

      card.addEventListener('click', () => {
        card.style.opacity = '0.5';
        chrome.runtime.sendMessage({
          action: 'SEND_TRIGGER',
          targetUserId: user.userId
        }, (response) => {
          card.style.opacity = '1';
          if (response && response.success) {
            flashBadge('Sent!');
          }
        });
      });

      userList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function flashBadge(text) {
    const originalText = saveNameBtn.textContent;
    saveNameBtn.textContent = text;
    setTimeout(() => { saveNameBtn.textContent = originalText; }, 1200);
  }

  // Initial render
  renderUsers(onlineUsers);

  // Storage listener to update UI in real-time when onlineUsers change
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.onlineUsers) {
      renderUsers(changes.onlineUsers.newValue || []);
    }
  });

  // Tell background script to connect/reconnect if needed
  chrome.runtime.sendMessage({ action: 'RECONNECT' });
});
