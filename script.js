let deck = [];
let playerHand = [];
let dealerHand = [];
let playerChips = 100;
let currentBet = 0;

const suits = ['♥', '♦', '♣', '♠'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];


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
    
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

document.querySelector('.back-btn').addEventListener('click', (e) => {
    // 如果遊戲正在進行中 (發牌按鈕被停用代表局中)
    if (document.getElementById('deal-btn').disabled && playerChips > 0) {
        const leave = confirm("遊戲還在進行中，現在離開將會損失當前下注的籌碼，確定要返回大廳嗎？");
        if (!leave) {
            e.preventDefault(); // 取消跳轉動作
        }
    }
});

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
    const playerScoreElement = document.getElementById('player-score');
    
    const pScore = calculateScore(playerHand);
    const tableElement = document.querySelector('.table');

    const getCardHTML = (card) => {
        const isRed = (card.suit === '♥' || card.suit === '♦') ? 'red' : '';
        const isGold = (pScore === 21) ? 'gold-glow' : '';
        return `<div class="card ${isRed}">${card.suit}${card.rank}</div>`;
    };
    
    playerContainer.innerHTML = playerHand.map(c => getCardHTML(c)).join('');

    playerScoreElement.innerText = pScore;
    if (pScore === 21) {
        playerScoreElement.classList.add('blackjack-animate');
        tableElement.classList.add('party-time'); // 讓整張桌子一起閃爍
        document.getElementById('status-message').innerText = "🔥 BLACKJACK! 您是天選之人！ 🔥";
    } else {
        playerScoreElement.classList.remove('blackjack-animate');
        tableElement.classList.remove('party-time');
    }

    
    if (showAllDealer) {
        dealerContainer.innerHTML = dealerHand.map(c => getCardHTML(c)).join('');
        dealerContainer.innerHTML = `<div class="card card-back">?</div>` + secondCardHTML;
        document.getElementById('dealer-score').innerText = calculateScore(dealerHand);
    } else {
        const secondCardHTML = getCardHTML(dealerHand[1]);
        dealerContainer.innerHTML = `<div class="card">?</div>` + secondCardHTML;
        document.getElementById('dealer-score').innerText = "?";
    }

    document.getElementById('player-score').innerText = calculateScore(playerHand);
    document.getElementById('total-chips').innerText = playerChips;
}   

document.getElementById('deal-btn').addEventListener('click', () => {
    currentBet = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(currentBet) || currentBet <= 0) {
        return alert("請輸入有效的下注金額！");}
    if (currentBet > playerChips) return alert("籌碼不足！");

    playerChips -= currentBet;

    createDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    
    document.getElementById('status-message').innerText = ("遊戲進行中...... 下注了 $ "+ currentBet);
    document.getElementById('deal-btn').disabled = true;
    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    updateUI();
});

document.getElementById('hit-btn').addEventListener('click', () => {
    playerHand.push(deck.pop());
    updateUI();
    const pScore = calculateScore(playerHand);
    if (pScore > 21) {
        endGame("你爆掉了！莊家獲勝。");
    } else if (pScore === 21) {
        // 如果剛好 21 點，幫玩家自動點擊「停住」
        setTimeout(() => {
            document.getElementById('stand-btn').click();
        }, 1000); // 延遲一秒讓玩家欣賞一下動畫
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

    if (playerChips <= 0) {
        document.getElementById('status-message').innerText = msg + " 你已經破產了！";
        document.getElementById('restart-btn').style.display = 'inline-block';
        document.getElementById('deal-btn').style.display = 'none';
        document.getElementById('bet-amount').style.display = 'none';
    }
}

document.getElementById('restart-btn').addEventListener('click', () => {
    playerChips = 100;
    document.getElementById('total-chips').innerText = playerChips;
    document.getElementById('status-message').innerText = "準備好開局了嗎？";
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('deal-btn').style.display = 'inline-block';
    document.getElementById('bet-amount').style.display = 'inline-block';
    document.getElementById('deal-btn').disabled = false;

});
