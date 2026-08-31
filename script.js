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
    
    // Get parameters from URL
    contestId = getUrlParameter('contest_id');
    const participantsParam = getUrlParameter('participants');
    const winnersParam = getUrlParameter('winners');
    
    if (!contestId) {
        showError('Konkurs ID topilmadi!');
        return;
    }
    
    // Parse parameters
    const participantsCount = parseInt(participantsParam) || 0;
    winnersCount = parseInt(winnersParam) || 1;
    
    if (participantsCount < 2) {
        showError('Ishtirokchilar soni juda kam! Kamida 2 ta ishtirokchi bo\'lishi kerak.');
        return;
    }
    
    // Generate mock participants for display
    participants = generateMockParticipants(participantsCount);
    
    // Update UI
    document.getElementById('participants-count').textContent = participantsCount;
    document.getElementById('winners-count').textContent = winnersCount;
    
    showLoading(false);
}

function generateMockParticipants(count) {
    // Generate mock participant list for UI display
    // Real participant data comes from bot backend
    // This is just for spinning animation
    
    const names = [
        'Ali Valiyev', 'Aziza Karimova', 'Bobur Toshmatov', 'Dilnoza Ergasheva',
        'Eldor Rahimov', 'Feruza Hasanova', 'G\'olibjon Saidov', 'Hulkar Yusupova',
        'Ilhom Abdullayev', 'Jahongir Muhammadov', 'Kamola Sharipova', 'Laziz Ismoilov',
        'Madina Turgunova', 'Nodira Qodirova', 'Otabek Salomov', 'Parvina Nazarova',
        'Rustam Ahmadov', 'Sevara Mirzayeva', 'Timur Oripov', 'Umida Jalilova'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        const name = names[i % names.length];
        result.push({
            user_id: 1000000 + i,
            first_name: name.split(' ')[0],
            last_name: name.split(' ')[1],
            username: 'user' + (i + 1)
        });
    }
    
    return result;
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
    
    // Spinning animation - show random names rapidly
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
    document.getElementById('winnerName').textContent = getParticipantDisplay(winner);
    document.getElementById('winnerPosition').textContent = `${position}-o'rin`;
    
    // Add to selected winners
    selectedWinners.push({
        ...winner,
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
    
    // Send winners to bot
    const winnerIds = selectedWinners.map(w => w.user_id).join(',');
    const message = `WINNERS:${contestId}:${winnerIds}`;
    
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
