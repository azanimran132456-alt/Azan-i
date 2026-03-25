(function () {
  const canvas = document.getElementById('pong-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('pong-overlay');
  const overlayTitle = document.getElementById('pong-overlay-title');
  const overlayText = document.getElementById('pong-overlay-text');
  const overlayAction = document.getElementById('pong-overlay-action');
  const startButton = document.getElementById('pong-start');
  const pauseButton = document.getElementById('pong-pause');
  const restartButton = document.getElementById('pong-restart');
  const difficultyButtons = Array.from(document.querySelectorAll('[data-difficulty]'));
  const playerScore = document.getElementById('player-score');
  const aiScore = document.getElementById('ai-score');
  const statusLabel = document.getElementById('pong-status');
  const touchButtons = Array.from(document.querySelectorAll('[data-move], [data-action]'));

  const paddle = { width: 14, height: 110, speed: 520 };
  const ballSize = 14;
  const maxScore = 5;
  const keys = new Set();

  const state = {
    difficulty: 'easy',
    running: false,
    paused: false,
    gameOver: false,
    animationId: 0,
    lastTime: 0,
    player: { x: 28, y: (canvas.height - paddle.height) / 2 },
    ai: { x: canvas.width - 42, y: (canvas.height - paddle.height) / 2 },
    ball: { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0 },
    scores: { player: 0, ai: 0 },
  };

  const updateHud = () => {
    playerScore.textContent = String(state.scores.player);
    aiScore.textContent = String(state.scores.ai);
    statusLabel.textContent = state.gameOver ? 'Complete' : state.paused ? 'Paused' : state.running ? 'Live' : 'Ready';
  };

  const showOverlay = (title, text, actionText) => {
    overlay.hidden = false;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayAction.textContent = actionText;
  };

  const hideOverlay = () => {
    overlay.hidden = true;
  };

  const resetBall = (direction) => {
    const profile = window.PongAI.getProfile(state.difficulty);
    state.ball.x = canvas.width / 2;
    state.ball.y = canvas.height / 2;
    state.ball.vx = profile.launchSpeed * direction;
    state.ball.vy = (Math.random() * 2 - 1) * 160;
  };

  const resetMatch = () => {
    state.scores.player = 0;
    state.scores.ai = 0;
    state.player.y = (canvas.height - paddle.height) / 2;
    state.ai.y = (canvas.height - paddle.height) / 2;
    state.paused = false;
    state.gameOver = false;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    updateHud();
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setDifficulty = (level) => {
    state.difficulty = level;
    difficultyButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.difficulty === level);
    });
    restartGame();
  };

  const finishGame = (winner) => {
    state.running = false;
    state.gameOver = true;
    updateHud();
    showOverlay(`${winner} Wins`, 'Restart the match or choose another difficulty.', 'Play Again');
  };

  const scorePoint = (winner) => {
    state.scores[winner] += 1;
    updateHud();
    if (state.scores[winner] >= maxScore) {
      finishGame(winner === 'player' ? 'Player' : 'Bot');
      return;
    }
    state.player.y = (canvas.height - paddle.height) / 2;
    state.ai.y = (canvas.height - paddle.height) / 2;
    resetBall(winner === 'player' ? -1 : 1);
  };

  const startGame = () => {
    if (state.gameOver || (state.scores.player === 0 && state.scores.ai === 0 && !state.running)) {
      resetMatch();
    }
    state.running = true;
    state.paused = false;
    hideOverlay();
    updateHud();
    if (!state.animationId) {
      state.lastTime = performance.now();
      state.animationId = requestAnimationFrame(loop);
    }
  };

  const pauseGame = () => {
    if (!state.running || state.gameOver) return;
    state.paused = !state.paused;
    updateHud();
    if (state.paused) {
      showOverlay('Paused', 'Return when you are ready to continue the rally.', 'Resume');
    } else {
      hideOverlay();
      state.lastTime = performance.now();
    }
  };

  const restartGame = () => {
    resetMatch();
    state.running = false;
    showOverlay('Pong', 'Choose a difficulty and start the match.', 'Start Match');
    draw();
  };

  const handlePlayerInput = (deltaSeconds) => {
    const moveStep = paddle.speed * deltaSeconds;
    if (keys.has('arrowup') || keys.has('w')) {
      state.player.y = clamp(state.player.y - moveStep, 0, canvas.height - paddle.height);
    }
    if (keys.has('arrowdown') || keys.has('s')) {
      state.player.y = clamp(state.player.y + moveStep, 0, canvas.height - paddle.height);
    }
  };

  const update = (deltaSeconds) => {
    if (!state.running || state.paused || state.gameOver) return;
    handlePlayerInput(deltaSeconds);
    window.PongAI.updatePaddle(state, deltaSeconds, canvas.height, paddle.height);
    state.ball.x += state.ball.vx * deltaSeconds;
    state.ball.y += state.ball.vy * deltaSeconds;

    if (state.ball.y <= ballSize / 2 || state.ball.y >= canvas.height - ballSize / 2) {
      state.ball.vy *= -1;
      state.ball.y = clamp(state.ball.y, ballSize / 2, canvas.height - ballSize / 2);
    }

    const playerHit = state.ball.x - ballSize / 2 <= state.player.x + paddle.width &&
      state.ball.y >= state.player.y &&
      state.ball.y <= state.player.y + paddle.height;
    const aiHit = state.ball.x + ballSize / 2 >= state.ai.x &&
      state.ball.y >= state.ai.y &&
      state.ball.y <= state.ai.y + paddle.height;

    if (playerHit && state.ball.vx < 0) {
      const offset = (state.ball.y - (state.player.y + paddle.height / 2)) / (paddle.height / 2);
      state.ball.vx = Math.abs(state.ball.vx) + 18;
      state.ball.vy = offset * 250;
    }

    if (aiHit && state.ball.vx > 0) {
      const offset = (state.ball.y - (state.ai.y + paddle.height / 2)) / (paddle.height / 2);
      state.ball.vx = -Math.abs(state.ball.vx) - 12;
      state.ball.vy = offset * 240;
    }

    if (state.ball.x < 0) scorePoint('ai');
    if (state.ball.x > canvas.width) scorePoint('player');
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#060914');
    gradient.addColorStop(1, '#0e1320');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 18);
    ctx.lineTo(canvas.width / 2, canvas.height - 18);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f4f7ff';
    ctx.font = '700 96px Georgia';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.08;
    ctx.fillText(String(state.scores.player), canvas.width / 2 - 90, 96);
    ctx.fillText(String(state.scores.ai), canvas.width / 2 + 90, 96);
    ctx.globalAlpha = 1;

    const playerGradient = ctx.createLinearGradient(0, state.player.y, 0, state.player.y + paddle.height);
    playerGradient.addColorStop(0, '#ffffff');
    playerGradient.addColorStop(1, '#7aa2ff');
    ctx.fillStyle = playerGradient;
    ctx.fillRect(state.player.x, state.player.y, paddle.width, paddle.height);

    const aiGradient = ctx.createLinearGradient(0, state.ai.y, 0, state.ai.y + paddle.height);
    aiGradient.addColorStop(0, '#ffffff');
    aiGradient.addColorStop(1, '#9d7cff');
    ctx.fillStyle = aiGradient;
    ctx.fillRect(state.ai.x, state.ai.y, paddle.width, paddle.height);

    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(122, 162, 255, 0.45)';
    ctx.fillStyle = '#f7f9ff';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, ballSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const loop = (timestamp) => {
    state.animationId = requestAnimationFrame(loop);
    const deltaSeconds = Math.min((timestamp - state.lastTime) / 1000, 0.033);
    state.lastTime = timestamp;
    update(deltaSeconds);
    draw();
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'w', 's'].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
    if (key === ' ') {
      event.preventDefault();
      pauseGame();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });

  touchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.move === 'up') state.player.y = clamp(state.player.y - 34, 0, canvas.height - paddle.height);
      if (button.dataset.move === 'down') state.player.y = clamp(state.player.y + 34, 0, canvas.height - paddle.height);
      if (button.dataset.action === 'start') startGame();
      if (button.dataset.action === 'pause') pauseGame();
    });
  });

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', pauseGame);
  restartButton.addEventListener('click', restartGame);
  overlayAction.addEventListener('click', startGame);
  difficultyButtons.forEach((button) => {
    button.addEventListener('click', () => setDifficulty(button.dataset.difficulty));
  });

  resetMatch();
  state.running = false;
  draw();
  showOverlay('Pong', 'Choose a difficulty and start the match.', 'Start Match');
})();
