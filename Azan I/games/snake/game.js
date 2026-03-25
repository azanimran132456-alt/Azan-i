(function () {
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('snake-overlay');
  const overlayTitle = document.getElementById('snake-overlay-title');
  const overlayText = document.getElementById('snake-overlay-text');
  const overlayAction = document.getElementById('snake-overlay-action');
  const startButton = document.getElementById('snake-start');
  const pauseButton = document.getElementById('snake-pause');
  const restartButton = document.getElementById('snake-restart');
  const scoreLabel = document.getElementById('snake-score');
  const speedLabel = document.getElementById('snake-speed');
  const statusLabel = document.getElementById('snake-status');
  const directionButtons = Array.from(document.querySelectorAll('[data-direction]'));

  const gridSize = 20;
  const cell = canvas.width / gridSize;
  const directionMap = {
    arrowup: 'up',
    arrowdown: 'down',
    arrowleft: 'left',
    arrowright: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
  };

  const state = {
    running: false,
    paused: false,
    gameOver: false,
    animationId: 0,
    accumulator: 0,
    lastTime: 0,
    tickRate: 170,
    score: 0,
    snake: [],
    food: { x: 8, y: 8 },
    direction: 'right',
    queuedDirection: 'right',
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updateHud = () => {
    scoreLabel.textContent = String(state.score);
    speedLabel.textContent = `${Math.round((170 / state.tickRate) * 10) / 10}x`;
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

  const buildFood = () => {
    const occupied = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
    let nextFood = null;
    while (!nextFood || occupied.has(`${nextFood.x},${nextFood.y}`)) {
      nextFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    }
    state.food = nextFood;
  };

  const resetGame = () => {
    state.snake = [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }];
    state.direction = 'right';
    state.queuedDirection = 'right';
    state.score = 0;
    state.tickRate = 170;
    state.accumulator = 0;
    state.paused = false;
    state.gameOver = false;
    buildFood();
    updateHud();
  };

  const setDirection = (direction) => {
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (opposite[state.direction] === direction) return;
    state.queuedDirection = direction;
  };

  const finishGame = () => {
    state.running = false;
    state.gameOver = true;
    updateHud();
    showOverlay('Run Over', 'Restart and push for a longer streak.', 'Play Again');
  };

  const step = () => {
    state.direction = state.queuedDirection;
    const head = { ...state.snake[0] };
    if (state.direction === 'up') head.y -= 1;
    if (state.direction === 'down') head.y += 1;
    if (state.direction === 'left') head.x -= 1;
    if (state.direction === 'right') head.x += 1;

    const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
    const hitSelf = state.snake.some((segment) => segment.x === head.x && segment.y === head.y);
    if (hitWall || hitSelf) {
      finishGame();
      return;
    }

    state.snake.unshift(head);
    if (head.x === state.food.x && head.y === state.food.y) {
      state.score += 1;
      state.tickRate = clamp(state.tickRate - 6, 80, 170);
      buildFood();
    } else {
      state.snake.pop();
    }
    updateHud();
  };

  const drawCell = (x, y, color, inset) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * cell + inset, y * cell + inset, cell - inset * 2, cell - inset * 2);
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < gridSize; x += 1) {
      for (let y = 0; y < gridSize; y += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    drawCell(state.food.x, state.food.y, '#9d7cff', 5);
    state.snake.forEach((segment, index) => {
      drawCell(segment.x, segment.y, index === 0 ? '#f7f9ff' : '#7aa2ff', 3);
    });
  };

  const startGame = () => {
    if (state.gameOver || (!state.running && state.score === 0)) resetGame();
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
      showOverlay('Paused', 'Resume when you are ready to continue the run.', 'Resume');
    } else {
      hideOverlay();
      state.lastTime = performance.now();
    }
  };

  const restartGame = () => {
    resetGame();
    state.running = false;
    draw();
    showOverlay('Snake', 'Start the run and keep control as the speed rises.', 'Start Run');
  };

  const loop = (timestamp) => {
    state.animationId = requestAnimationFrame(loop);
    if (!state.running || state.paused || state.gameOver) {
      draw();
      return;
    }
    if (!state.lastTime) state.lastTime = timestamp;
    state.accumulator += timestamp - state.lastTime;
    state.lastTime = timestamp;
    while (state.accumulator >= state.tickRate) {
      step();
      state.accumulator -= state.tickRate;
    }
    draw();
  };

  window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      pauseGame();
      return;
    }
    const direction = directionMap[event.key.toLowerCase()];
    if (!direction) return;
    event.preventDefault();
    setDirection(direction);
    if (!state.running && !state.gameOver) startGame();
  });

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', pauseGame);
  restartButton.addEventListener('click', restartGame);
  overlayAction.addEventListener('click', startGame);
  directionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setDirection(button.dataset.direction);
      if (!state.running && !state.gameOver) startGame();
    });
  });

  resetGame();
  draw();
  showOverlay('Snake', 'Start the run and keep control as the speed rises.', 'Start Run');
})();
