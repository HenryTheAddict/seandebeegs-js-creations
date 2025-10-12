let knownCards = new Set();
let cardsPerPlayer = 2;
let cards = [];
let previousBetValue = 1;
let playerNumber;

function createPlayer(className){
  return {
    cards: [],
    chips: {
      oneDollar: 20,
      fiveDollar: 15,
      tenDollar: 10,
      twentyFiveDollar: 5,
      fiftyDollar: 2,
      hundredDollar: 1
    },
    isTurn: false,
    className: className,
    isStanding: false,
    i: 1
  };
}

let players = [
  createPlayer('player1'),
  createPlayer('player2'),
  createPlayer('player3'),
  createPlayer('player4'),
  createPlayer('player5')
];
players[0].isTurn = true;

function countPlayers(){
  playerNumber = parseInt(document.getElementById('playerCount').value);
  return playerNumber;
}

function buildDeck() {
  const values = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
  const suits = ['hearts', 'diamonds', 'spades', 'clubs'];
  let deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ name: value, suit, photo: `<img src="deck-of-cards/${value}_of_${suit}.png">` });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

cards = buildDeck();
shuffle(cards);

function dealCards(){
  playerNumber = countPlayers();
  const playersPlaying = parseInt(playerNumber);
  for (let i = 0; i < playersPlaying; i++) {
    for (let j = 0; j < cardsPerPlayer; j++) {
      players[i].cards.push(cards.shift());
    }
  }
  document.querySelector('.initial-page').innerHTML = '';
  document.querySelector('.deck').innerHTML = '<img src="card-facedown.jpg" class="deck">';
  playAudio('sounds/card-flip.mp3');
  revealCards(false);
}

function check(didHit, betValue, player){
  if (!didHit) {
    // Get all hand values for active players
    let allHands = players.slice(0, playerNumber).map(p => getHandValue(p));
    player.isStanding = true;

    // Get standing status for active players
    const standingValues = players.slice(0, playerNumber).map(p => p.isStanding);
    // Marks busted hands as standing
    allHands.forEach((hand, index) => {
      if (hand > 21) {
        standingValues[index] = true;
        players[index].isStanding = true;
      }
    });

    if (standingValues.includes(false)) {
      changeTurns();
      return;
    } else {
      let maxHand = Math.max(...allHands.filter(h => h <= 21));
      let winners = players
        .slice(0, playerNumber)
        .map((p, idx) => ({ value: getHandValue(p), index: idx }))
        .filter(hand => hand.value === maxHand && hand.value <= 21);

      if (winners.length > 0) {
        document.querySelector('.results').innerHTML =
          `Winner(s): Player ${winners.map(w => w.index + 1).join(', ')} with ${maxHand}
          <button class="action-button" onclick="resetGame();">Play Again</button>`;
        revealCards(true);
      }
    }
    changeTurns();
  } else {
    player.chips.oneDollar -= betValue;
    if (player.chips.oneDollar <= 0 || player.chips.oneDollar < betValue) {
      alert('You do not have enough money to bet');
      changeTurns();
    } else {
      player.cards.push(cards.shift());
      player.i++;
      if (player !== players[0]) {
        decideForBot(player);
      } else {
        changeTurns();
      }
    }
  }
}

function playAudio(filePath){
  let audio = new Audio(filePath);
  audio.play().catch(err =>{
    console.error('Sound Error:',err);
  })
}

function getCardValue(card) {
  if (card.name === 'ace') return 11;
  if (['jack', 'queen', 'king'].includes(card.name)) return 10;
  return parseInt(card.name);
}

function getHandValue(player){
  let totalValue = 0;
  let aceCount = 0;
  player.cards.forEach(card => {
    let value = getCardValue(card);
    totalValue += value;
    if (card.name === 'ace') aceCount++;
  });
  
  while(totalValue > 21 && aceCount >=1){
    totalValue -= 10;
    aceCount--;
  }
  return totalValue;
}

function revealCards(isGameEnded) {
  if (!isGameEnded) {
    let createdDiv = [];
    for (let i = 0; i < playerNumber; i++) {
      createdDiv[i] = document.createElement('div');
      createdDiv[i].classList.add(`player${i + 1}`);
      createdDiv[i].id = String(i + 1);
      document.body.appendChild(createdDiv[i]);
    }

    players.slice(0, playerNumber).forEach((player, index) => {
      const playerDiv = document.getElementById(`${index + 1}`);
      if (player.cards.length <= 0) {
        playerDiv.innerHTML = '';
      } else {
        if(playerDiv.id == '1'){
          playerDiv.innerHTML =  `<button onclick="check(true,${previousBetValue},players[0])" class="action-button">Meet!</button> 
          <button onclick="check(true,${previousBetValue + 1},players[0])" class="action-button">Raise!</button>
          <button onclick="check(false,0,players[0])"class="action-button">Stand!</button><br>`
        }
        playerDiv.innerHTML += player.cards.map((card, index) => {
          if(index == 0 && player !== players[0]){
            return `<img src="card-facedown.jpg">`;
          }else{
            return card.photo;
          }
        })
        .join('');
      }
    });
  } else {
    players.slice(0, playerNumber).forEach((player, index) => {
      const playerDiv = document.getElementById(`${index + 1}`);
      if (player.cards.length === 0) {
        if (playerDiv) playerDiv.innerHTML = '';
      } else {
        if (playerDiv) {
          playerDiv.innerHTML = player.cards.map(card => card.photo).join('');
        }
      }
    });
  }
}

function decideForBot(player) {
  if (!player || !player.cards || player.cards.length === 0) return;
  let handValue = getHandValue(player);
  if (handValue <= 15) {
    setTimeout(() => check(true, previousBetValue, player), 500);
  } else {
    setTimeout(() => check(false, 0, player), 500);
  }
}

function changeTurns() {
  const playersPlaying = parseInt(playerNumber);
  const currentPlayerIndex = players.slice(0, playersPlaying).findIndex(p => p.isTurn);

  if (currentPlayerIndex >= 0) {
    players[currentPlayerIndex].isTurn = false;
    let nextIndex = (currentPlayerIndex + 1) % playersPlaying;
    players[nextIndex].isTurn = true;
    if (players[nextIndex] !== players[0]) {
       decideForBot(players[nextIndex]);
    }
  }
}

function checkForBust(){
  let bustArray = [];
  const allHands = players.map(p => getHandValue(p));
  allHands.forEach(hand => {
    if (hand > 21) bustArray.push(true);
    else bustArray.push(false);
  });
  return bustArray;
}

function resetGame() {
  players.forEach(player => {
    player.cards = [];
    player.isStanding = false;
    player.isTurn = false;
    player.i = 1;
  });

  cards = [];
  cards = buildDeck();
  shuffle(cards);
  previousBetValue = 1;
  clearDivs();
  restoreInitialPage();
}

function clearDivs(){
  for (let i = 1; i <= 5; i++) {
    const div = document.getElementById(`${i}`);
    if (div) div.innerHTML = '';
  }
}

function restoreInitialPage(){
  document.querySelector('.initial-page').innerHTML = `
    <div class="initial-page">
      <h1>Pre-Game: Player Count</h1>
      <form class="playerForm">
        <select id="playerCount" class="action-button" style="padding: 10px;">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        <button type="submit" class="action-button" onclick="event.preventDefault(); dealCards()">Confirm</button>
      </form>
    </div>`;

  document.querySelector('.results').innerHTML = '';
  document.querySelector('.deck').innerHTML = '';
}

