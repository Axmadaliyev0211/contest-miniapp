// ==================== TELEGRAM WEB APP INITIALIZATION ====================

let tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Theme setup
if (tg.colorScheme === 'dark') {
    document.body.classList.add('theme-dark');
} else {
    document.body.classList.add('theme-light');
}

// ==================== GLOBAL VARIABLES ====================

let contestId = null;
let participants = [];
let winnersCount = 0;
let selectedWinners = [];
let isSpinning = false;

// ==================== URL PARAMETERS ====================

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ==================== INITIALIZATION ====================

async function init() {
    showLoading(true);
    
    try {
        // Get data from URL fragment (after #)
        const fragment = window.location.hash.substring(1); // Remove #
        
        if (!fragment) {
            showError('Ma\'lumotlar topilmadi!');
            return;
        }
        
        // Decode base64
        const decoded = atob(fragment);
        const data = JSON.parse(decoded);
        
        // Extract data
        contestId = data.contest_id;
        participants = data.participants || [];
        winnersCount = data.winners_count || 1;
        
        // Validate
        if (!contestId) {
            showError('Konkurs ID topilmadi!');
            return;
        }
        
        if (!Array.isArray(participants) || participants.length < 2) {
            showError('Ishtirokchilar topilmadi yoki soni juda kam!');
            return;
        }
        
        // Update UI
        document.getElementById('participants-count').textContent = participants.length;
        document.getElementById('winners-count').textContent = winnersCount;
        
        console.log('Ma\'lumotlar yuklandi:', {
            contestId,
            participantsCount: participants.length,
            winnersCount
        });
        
        showLoading(false);
        
    } catch (error) {
        console.error('Init error:', error);
        showError('Ma\'lumotlarni yuklashda xatolik: ' + error.message);
    }
}

// ==================== SPIN LOGIC ====================

async function startSpin() {
    if (isSpinning) return;
    if (selectedWinners.length >= winnersCount) {
        alert('Barcha g\'oliblar tanlandi!');
        return;
    }
    
    isSpinning = true;
    document.getElementById('spinBtn').disabled = true;
    
    const spinContainer = document.querySelector('.spin-container');
    const spinText = document.getElementById('spinText');
    const winnerDisplay = document.getElementById('winnerDisplay');
    
    // Hide winner display
    winnerDisplay.style.display = 'none';
    spinText.style.display = 'block';
    
    // Add spinning class
    spinContainer.classList.add('spinning');
    
    // Get available participants (exclude already selected winners)
    const availableParticipants = participants.filter(p => 
        !selectedWinners.find(w => w.user_id === p.user_id)
    );
    
    if (availableParticipants.length === 0) {
        showError('Barcha ishtirokchilar tanlandi!');
        isSpinning = false;
        document.getElementById('spinBtn').disabled = false;
        return;
    }
    
    // Spinning animation - show random indices rapidly
    const spinDuration = 3000; // 3 seconds
    const spinInterval = 100; // Change every 100ms
    const spinCount = spinDuration / spinInterval;
    
    for (let i = 0; i < spinCount; i++) {
        const randomParticipant = availableParticipants[
            Math.floor(Math.random() * availableParticipants.length)
        ];
        spinText.textContent = getParticipantDisplay(randomParticipant);
        await sleep(spinInterval);
    }
    
    // Slow down
    for (let i = 0; i < 5; i++) {
        const randomParticipant = availableParticipants[
            Math.floor(Math.random() * availableParticipants.length)
        ];
        spinText.textContent = getParticipantDisplay(randomParticipant);
        await sleep(200 + i * 100);
    }
    
    // Select final winner
    const winner = availableParticipants[
        Math.floor(Math.random() * availableParticipants.length)
    ];
    
    // Stop spinning
    spinContainer.classList.remove('spinning');
    
    // Pause before showing winner
    await sleep(500);
    
    // Show winner
    spinText.style.display = 'none';
    winnerDisplay.style.display = 'block';
    
    const position = selectedWinners.length + 1;
    const emoji = getPositionEmoji(position);
    
    document.getElementById('winnerDisplay').querySelector('.winner-emoji').textContent = emoji;
    document.getElementById('winnerName').textContent = winner.display;
    document.getElementById('winnerPosition').textContent = `${position}-o'rin`;
    
    // Add to selected winners
    selectedWinners.push({
        user_id: winner.user_id,
        first_name: winner.first_name,
        last_name: winner.last_name,
        username: winner.username,
        position: position
    });
    
    // Confetti!
    createConfetti();
    
    // Update winners list
    updateWinnersList();
    
    // Show controls
    document.getElementById('confirmBtn').style.display = 'block';
    document.getElementById('resetBtn').style.display = 'block';
    
    // Re-enable spin button if not all winners selected
    if (selectedWinners.length < winnersCount) {
        document.getElementById('spinBtn').disabled = false;
        document.getElementById('spinBtn').innerHTML = '🎰 Keyingisini tanlash';
    } else {
        document.getElementById('spinBtn').style.display = 'none';
    }
    
    isSpinning = false;
}

// ==================== CONFETTI ====================

function createConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        container.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

// ==================== WINNERS LIST ====================

function updateWinnersList() {
    const winnersList = document.getElementById('winnersList');
    const winnersItems = document.getElementById('winnersItems');
    
    winnersList.style.display = 'block';
    winnersItems.innerHTML = '';
    
    selectedWinners.forEach(winner => {
        const item = document.createElement('div');
        item.className = 'winner-item';
        
        const emoji = getPositionEmoji(winner.position);
        
        item.innerHTML = `
            <div class="winner-icon">${emoji}</div>
            <div class="winner-info">
                <div class="winner-info-name">${getParticipantDisplay(winner)}</div>
                <div class="winner-info-id">ID: ${winner.user_id}</div>
            </div>
        `;
        
        winnersItems.appendChild(item);
    });
}

// ==================== CONFIRM WINNERS ====================

function confirmWinners() {
    if (selectedWinners.length === 0) {
        alert('G\'oliblar tanlanmagan!');
        return;
    }
    
    // Confirm dialog
    const confirmed = confirm(
        `${selectedWinners.length} ta g\'olib tanladingiz.\n\nTasdiqlaysizmi?`
    );
    
    if (!confirmed) return;
    
    // Send winner indices to bot
    const winnerIndices = selectedWinners.map(w => w.index).join(',');
    const message = `WINNERS:${contestId}:${winnerIndices}`;
    
    // Send to bot via Telegram WebApp
    tg.sendData(message);
    
    // Close WebApp
    tg.close();
}

// ==================== RESET ====================

function resetSelection() {
    const confirmed = confirm('Barcha tanlovlarni bekor qilasizmi?');
    
    if (!confirmed) return;
    
    // Reset
    selectedWinners = [];
    isSpinning = false;
    
    // Reset UI
    document.getElementById('winnerDisplay').style.display = 'none';
    document.getElementById('spinText').style.display = 'block';
    document.getElementById('spinText').textContent = 'Tayyor';
    
    document.getElementById('winnersList').style.display = 'none';
    
    document.getElementById('spinBtn').style.display = 'block';
    document.getElementById('spinBtn').disabled = false;
    document.getElementById('spinBtn').innerHTML = '🎰 Aylantirish';
    
    document.getElementById('confirmBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'none';
    
    // Clear confetti
    document.getElementById('confettiContainer').innerHTML = '';
}

// ==================== HELPERS ====================

function getParticipantDisplay(participant) {
    if (participant.username) {
        return '@' + participant.username;
    } else if (participant.first_name) {
        return participant.first_name + (participant.last_name ? ' ' + participant.last_name : '');
    } else {
        return 'ID: ' + participant.user_id;
    }
}

function getPositionEmoji(position) {
    const emojis = {
        1: '🥇',
        2: '🥈',
        3: '🥉'
    };
    return emojis[position] || '🏆';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const mainContent = document.querySelector('.main-content');
    const controls = document.querySelector('.controls');
    
    if (show) {
        loading.style.display = 'block';
        mainContent.style.display = 'none';
        controls.style.display = 'none';
    } else {
        loading.style.display = 'none';
        mainContent.style.display = 'flex';
        controls.style.display = 'flex';
    }
}

function showError(message) {
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    const mainContent = document.querySelector('.main-content');
    const controls = document.querySelector('.controls');
    
    error.style.display = 'block';
    errorMessage.textContent = message;
    mainContent.style.display = 'none';
    controls.style.display = 'none';
    
    showLoading(false);
}

// ==================== INITIALIZE ON LOAD ====================

window.addEventListener('load', () => {
    init();
});

// ==================== TELEGRAM THEME LISTENER ====================

tg.onEvent('themeChanged', () => {
    document.body.classList.remove('theme-light', 'theme-dark');
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('theme-dark');
    } else {
        document.body.classList.add('theme-light');
    }
});
