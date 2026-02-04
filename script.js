let deck = [];
let playerHand = [];
let dealerHand = [];
// 讀取存檔，如果沒有存檔就給 100
let playerChips = parseInt(localStorage.getItem('blackjack_chips')) || 100;
let currentBet = 0;

const suits = ['♥', '♦', '♣', '♠'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];


const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSyntheticSound(frequency, type, duration, volume) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function soundDeal() {
    playSyntheticSound(600, 'sine', 0.1, 0.3);
}

function soundChip() {
    playSyntheticSound(150, 'triangle', 0.2, 0.5);
}

function soundWin() {
    playSyntheticSound(523, 'sine', 0.1, 0.3); // C5
    setTimeout(() => playSyntheticSound(659, 'sine', 0.2, 0.3), 100); // E5
}

function soundLose() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            let value = parseInt(rank);
            if (['J', 'Q', 'K'].includes(rank)) value = 10;
            if (rank === 'A') value = 11;
            deck.push({ suit, rank, value });
        }
    }
    // 洗牌
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function saveChips() {
    localStorage.setItem('blackjack_chips', playerChips);
}

function calculateScore(hand) {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aceCount = hand.filter(card => card.rank === 'A').length;
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }
    return score;
}

function updateUI(showAllDealer = false) {
    const playerContainer = document.getElementById('player-cards');
    const dealerContainer = document.getElementById('dealer-cards');
    const tableElement = document.querySelector('.table');
    const pScore = calculateScore(playerHand);
    soundDeal();

    const getCardHTML = (card) => {
        const isRed = (card.suit === '♥' || card.suit === '♦') ? 'red' : '';
        return `<div class="card ${isRed}">${card.suit}${card.rank}</div>`;
    };

    playerContainer.innerHTML = playerHand.map(c => getCardHTML(c)).join('');

    if (showAllDealer) {
        dealerContainer.innerHTML = dealerHand.map(c => getCardHTML(c)).join('');
        document.getElementById('dealer-score').innerText = calculateScore(dealerHand);
    } else if (dealerHand.length > 0) {
        // 第一張加上 card-back 樣式
        const secondCardHTML = getCardHTML(dealerHand[1]);
        dealerContainer.innerHTML = `<div class="card card-back">?</div>` + secondCardHTML;
        document.getElementById('dealer-score').innerText = "?";
    }

    document.getElementById('player-score').innerText = pScore;
    document.getElementById('total-chips').innerText = playerChips;

    if (pScore === 21 && playerHand.length === 2) {
        document.getElementById('player-score').classList.add('blackjack-animate');
        tableElement.classList.add('party-time');
    } else {
        document.getElementById('player-score').classList.remove('blackjack-animate');
        tableElement.classList.remove('party-time');
    }
    saveChips(); // 每次 UI 更新都存檔
}

document.getElementById('deal-btn').addEventListener('click', () => {
    currentBet = parseInt(document.getElementById('bet-amount').value);
    if (audioCtx.state === 'suspended') audioCtx.resume(); // 啟動音訊上下文
    soundChip();
    if (isNaN(currentBet) || currentBet <= 0) return alert("請輸入有效的下注金額！");
    if (currentBet > playerChips) return alert("籌碼不足！");

    playerChips -= currentBet;
    createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];

    document.getElementById('status-message').innerText = "遊戲進行中... 下注: $" + currentBet;
    document.getElementById('deal-btn').disabled = true;
    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    updateUI();
});

document.getElementById('hit-btn').addEventListener('click', () => {
    playerHand.push(deck.pop());
    updateUI();
    if (calculateScore(playerHand) > 21) {
        endGame("你爆掉了！莊家獲勝。");
    }
});

document.getElementById('stand-btn').addEventListener('click', () => {
    while (calculateScore(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }
    
    let pScore = calculateScore(playerHand);
    let dScore = calculateScore(dealerHand);
    
    if (dScore > 21 || pScore > dScore) {
        playerChips += (currentBet * 2); 
        endGame("恭喜！你贏了！獲得了 $" + currentBet);
    } else if (pScore < dScore) {
        endGame("可惜，莊家贏了。輸掉了 $" + currentBet);
    } else {
        playerChips += currentBet;
        endGame("平局！退回下注金額。");
    }
});

function endGame(msg) {
    document.getElementById('status-message').innerText = msg;
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
    updateUI(true);
    if (msg.includes("贏") || msg.includes("BLACKJACK")) {
        soundWin();
    } else if (msg.includes("輸") || msg.includes("爆掉了")) {
        soundLose();
    }

    if (playerChips <= 0) {
        document.getElementById('status-message').innerText = msg + " 你已經破產了！";
        document.getElementById('restart-btn').style.display = 'inline-block';
        document.getElementById('deal-btn').style.display = 'none';
    }
}

document.getElementById('restart-btn').addEventListener('click', () => {
    playerChips = 100;
    saveChips();
    location.reload(); // 重新整理最快
});

// 初始化顯示存檔的籌碼
document.getElementById('total-chips').innerText = playerChips;

