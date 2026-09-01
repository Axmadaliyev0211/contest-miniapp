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
        // Show data input screen
        showDataInput();
        
    } catch (error) {
        console.error('Init error:', error);
        showError('Xatolik: ' + error.message);
    }
}

function showDataInput() {
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    
    // Show data input screen
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <h2>📋 Ma'lumotlarni kiriting</h2>
            <p style="margin: 20px 0;">Bot yuborgan <code>DATA:...</code> kodini nusxalab bu yerga qo'ying:</p>
            <textarea id="dataInput" 
                      style="width: 100%; min-height: 120px; padding: 10px; font-family: monospace; font-size: 12px; border: 2px solid #ddd; border-radius: 8px;"
                      placeholder="DATA:eyJjIjoxLCJwIjpb..."></textarea>
            <button onclick="loadData()" 
                    style="margin-top: 15px; padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                ✅ Yuklash
            </button>
        </div>
    `;
    
    mainContent.style.display = 'block';
    document.querySelector('.controls').style.display = 'none';
}

function loadData() {
    try {
        const input = document.getElementById('dataInput').value.trim();
        
        if (!input.startsWith('DATA:')) {
            alert('❌ Noto\'g\'ri format! DATA: bilan boshlanishi kerak.');
            return;
        }
        
        // Extract encoded data
        const encoded = input.substring(5); // Remove "DATA:"
        
        // Add padding if needed
        let paddedEncoded = encoded;
        while (paddedEncoded.length % 4 !== 0) {
            paddedEncoded += '=';
        }
        
        // Decode base64
        const decoded = atob(paddedEncoded.replace(/-/g, '+').replace(/_/g, '/'));
        const data = JSON.parse(decoded);
        
        // Extract data
        contestId = data.c;
        winnersCount = data.w;
        
        // Convert compact format to full format
        participants = data.p.map(p => ({
            user_id: p.i,
            first_name: p.f || 'User',
            last_name: p.l,
            username: p.u
        }));
        
        // Validate
        if (!contestId || !participants || participants.length < 2) {
            throw new Error('Ma\'lumotlar to\'liq emas!');
        }
        
        // Update UI
        document.getElementById('participants-count').textContent = participants.length;
        document.getElementById('winners-count').textContent = winnersCount;
        
        // Show main interface
        document.querySelector('.main-content').innerHTML = `
            <div class="spin-zone" id="spinZone">
                <div class="spin-container">
                    <div class="spin-text" id="spinText">Tayyor</div>
                    <div class="winner-display" id="winnerDisplay" style="display: none;">
                        <div class="winner-emoji">🎉</div>
                        <div class="winner-name" id="winnerName"></div>
                        <div class="winner-position" id="winnerPosition"></div>
                    </div>
                </div>
                <div class="confetti-container" id="confettiContainer"></div>
            </div>
            <div class="winners-list" id="winnersList" style="display: none;">
                <h3>🏆 Tanlangan g'oliblar:</h3>
                <div class="winners-items" id="winnersItems"></div>
            </div>
        `;
        
        document.querySelector('.controls').style.display = 'flex';
        
        console.log('Ma\'lumotlar yuklandi:', {
            contestId,
            participantsCount: participants.length,
            winnersCount,
            participants: participants.slice(0, 3)
        });
        
        showLoading(false);
        
    } catch (error) {
        console.error('Load data error:', error);
        alert('❌ Xatolik: ' + error.message + '\n\nIltimos, to\'g\'ri DATA kodni kiriting.');
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
    document.getElementById('winnerName').textContent = getParticipantDisplay(winner);
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
    
    // Send winner user_ids to bot
    const winnerUserIds = selectedWinners.map(w => w.user_id).join(',');
    const message = `WINNERS:${contestId}:${winnerUserIds}`;
    
    console.log('📤 Sending to bot:', message);
    console.log('👥 Selected winners:', selectedWinners);
    
    // Check if sendData is available
    if (typeof tg.sendData === 'function') {
        try {
            tg.sendData(message);
            console.log('✅ Data sent via sendData()');
        } catch (error) {
            console.error('❌ sendData() failed:', error);
            
            // Fallback: prompt user to copy-paste
            alert('Mini App xabar yuborolmadi.\n\nIltimos, quyidagi xabarni botga yuboring:\n\n' + message);
            
            // Copy to clipboard
            navigator.clipboard.writeText(message).then(() => {
                alert('✅ Xabar nusxalandi! Botga yuboring.');
            }).catch(() => {
                prompt('Ushbu xabarni nusxalab, botga yuboring:', message);
            });
        }
    } else {
        // No sendData support - show message to copy
        console.warn('⚠️ sendData() not available');
        
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(message).then(() => {
                alert('✅ G\'oliblar tanlandi!\n\nXabar nusxalandi. Botga yuboring.');
                tg.close();
            }).catch(() => {
                prompt('Ushbu xabarni nusxalab, botga yuboring:', message);
            });
        } else {
            prompt('Ushbu xabarni nusxalab, botga yuboring:', message);
        }
    }
    
    // Close WebApp after a delay
    setTimeout(() => {
        tg.close();
    }, 1000);
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
