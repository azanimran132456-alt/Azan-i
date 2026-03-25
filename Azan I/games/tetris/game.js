(function () {
  const boardCanvas = document.getElementById('tetris-canvas');
  const previewCanvas = document.getElementById('tetris-preview');
  const boardCtx = boardCanvas.getContext('2d');
  const previewCtx = previewCanvas.getContext('2d');
  const overlay = document.getElementById('tetris-overlay');
  const overlayTitle = document.getElementById('tetris-overlay-title');
  const overlayText = document.getElementById('tetris-overlay-text');
  const overlayAction = document.getElementById('tetris-overlay-action');
  const startButton = document.getElementById('tetris-start');
  const pauseButton = document.getElementById('tetris-pause');
  const restartButton = document.getElementById('tetris-restart');
  const scoreLabel = document.getElementById('tetris-score');
  const linesLabel = document.getElementById('tetris-lines');
  const statusLabel = document.getElementById('tetris-status');
  const mobileButtons = Array.from(document.querySelectorAll('[data-action]'));

  const cols = 10;
  const rows = 20;
  const block = 36;
  const pieces = {
    I: { color: '#7aa2ff', matrix: [[1, 1, 1, 1]] },
    J: { color: '#9d7cff', matrix: [[1, 0, 0], [1, 1, 1]] },
    L: { color: '#7df3c6', matrix: [[0, 0, 1], [1, 1, 1]] },
    O: { color: '#f7f9ff', matrix: [[1, 1], [1, 1]] },
    S: { color: '#6ee7b7', matrix: [[0, 1, 1], [1, 1, 0]] },
    T: { color: '#b88dff', matrix: [[0, 1, 0], [1, 1, 1]] },
    Z: { color: '#ff7f9f', matrix: [[1, 1, 0], [0, 1, 1]] },
  };
  const pieceKeys = Object.keys(pieces);
  const state = {
    running: false,
    paused: false,
    gameOver: false,
    animationId: 0,
    lastTime: 0,
    dropAccumulator: 0,
    dropInterval: 720,
    score: 0,
    lines: 0,
    board: [],
    current: null,
    next: null,
  };

  const cloneMatrix = (matrix) => matrix.map((row) => [...row]);
  const randomPiece = () => {
    const type = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    return { type, color: pieces[type].color, matrix: cloneMatrix(pieces[type].matrix), x: 0, y: 0 };
  };
  const rotateMatrix = (matrix) => matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
  const createBoard = () => Array.from({ length: rows }, () => Array(cols).fill(null));

  const updateHud = () => {
    scoreLabel.textContent = String(state.score);
    linesLabel.textContent = String(state.lines);
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

  const collide = (piece) => {
    for (let y = 0; y < piece.matrix.length; y += 1) {
      for (let x = 0; x < piece.matrix[y].length; x += 1) {
        if (!piece.matrix[y][x]) continue;
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardX < 0 || boardX >= cols || boardY >= rows) return true;
        if (boardY >= 0 && state.board[boardY][boardX]) return true;
      }
    }
    return false;
  };

  const mergePiece = () => {
    state.current.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const boardY = state.current.y + y;
        if (boardY >= 0) state.board[boardY][state.current.x + x] = state.current.color;
      });
    });
  };

  const clearRows = () => {
    let cleared = 0;
    for (let rowIndex = rows - 1; rowIndex >= 0; rowIndex -= 1) {
      if (state.board[rowIndex].every(Boolean)) {
        state.board.splice(rowIndex, 1);
        state.board.unshift(Array(cols).fill(null));
        cleared += 1;
        rowIndex += 1;
      }
    }
    if (cleared > 0) {
      state.lines += cleared;
      state.score += [0, 120, 320, 540, 860][cleared];
      state.dropInterval = Math.max(150, 720 - state.lines * 16);
      updateHud();
    }
  };

  const spawnPiece = () => {
    state.current = state.next || randomPiece();
    state.next = randomPiece();
    state.current.x = Math.floor((cols - state.current.matrix[0].length) / 2);
    state.current.y = -1;
    if (collide(state.current)) {
      state.running = false;
      state.gameOver = true;
      updateHud();
      showOverlay('Stack Closed', 'Restart and build a cleaner run.', 'Play Again');
    }
  };

  const resetGame = () => {
    state.board = createBoard();
    state.score = 0;
    state.lines = 0;
    state.dropAccumulator = 0;
    state.dropInterval = 720;
    state.paused = false;
    state.gameOver = false;
    state.next = randomPiece();
    spawnPiece();
    updateHud();
  };

  const startGame = () => {
    if (state.gameOver || (!state.running && state.score === 0 && state.lines === 0)) resetGame();
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
      showOverlay('Paused', 'Resume when you are ready to continue the stack.', 'Resume');
    } else {
      hideOverlay();
      state.lastTime = performance.now();
    }
  };

  const restartGame = () => {
    resetGame();
    state.running = false;
    draw();
    showOverlay('Tetris', 'Build clean lines, manage the stack, and keep the board open.', 'Start Stack');
  };

  const movePiece = (offset) => {
    if (!state.current || state.paused || state.gameOver) return;
    state.current.x += offset;
    if (collide(state.current)) state.current.x -= offset;
  };

  const rotatePiece = () => {
    if (!state.current || state.paused || state.gameOver) return;
    const previous = cloneMatrix(state.current.matrix);
    const previousX = state.current.x;
    state.current.matrix = rotateMatrix(state.current.matrix);
    let kick = 0;
    while (collide(state.current)) {
      kick = kick > 0 ? -(kick + 1) : -(kick - 1);
      state.current.x += kick;
      if (Math.abs(kick) > state.current.matrix[0].length) {
        state.current.matrix = previous;
        state.current.x = previousX;
        return;
      }
    }
  };

  const settlePiece = () => {
    mergePiece();
    clearRows();
    spawnPiece();
    state.dropAccumulator = 0;
  };

  const dropPiece = () => {
    if (!state.current || state.paused || state.gameOver) return;
    state.current.y += 1;
    if (collide(state.current)) {
      state.current.y -= 1;
      settlePiece();
    }
    state.dropAccumulator = 0;
  };

  const hardDrop = () => {
    if (!state.current || state.paused || state.gameOver) return;
    while (!collide(state.current)) state.current.y += 1;
    state.current.y -= 1;
    settlePiece();
  };

  const drawBlock = (ctx, x, y, color, size) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
  };

  const drawBoard = () => {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.fillStyle = '#060913';
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    state.board.forEach((row, y) => {
      row.forEach((cell, x) => {
        boardCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        boardCtx.strokeRect(x * block, y * block, block, block);
        if (cell) drawBlock(boardCtx, x * block, y * block, cell, block);
      });
    });
    if (state.current) {
      state.current.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (!value) return;
          const drawY = state.current.y + y;
          if (drawY >= 0) drawBlock(boardCtx, (state.current.x + x) * block, drawY * block, state.current.color, block);
        });
      });
    }
  };

  const drawPreview = () => {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.fillStyle = '#060913';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    if (!state.next) return;
    const size = 30;
    const offsetX = (previewCanvas.width - state.next.matrix[0].length * size) / 2;
    const offsetY = (previewCanvas.height - state.next.matrix.length * size) / 2;
    state.next.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        drawBlock(previewCtx, offsetX + x * size, offsetY + y * size, state.next.color, size);
      });
    });
  };

  const draw = () => {
    drawBoard();
    drawPreview();
  };

  const update = (delta) => {
    if (!state.running || state.paused || state.gameOver) return;
    state.dropAccumulator += delta;
    if (state.dropAccumulator >= state.dropInterval) dropPiece();
  };

  const loop = (timestamp) => {
    state.animationId = requestAnimationFrame(loop);
    const delta = Math.min(timestamp - state.lastTime, 32);
    state.lastTime = timestamp;
    update(delta);
    draw();
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (!state.running && !state.gameOver && ['arrowleft', 'arrowright', 'arrowdown', 'arrowup', 'a', 'd', 's', 'w', ' '].includes(key)) {
      startGame();
    }
    if (key === 'p') {
      event.preventDefault();
      pauseGame();
      return;
    }
    if (key === 'arrowleft' || key === 'a') { event.preventDefault(); movePiece(-1); }
    if (key === 'arrowright' || key === 'd') { event.preventDefault(); movePiece(1); }
    if (key === 'arrowdown' || key === 's') { event.preventDefault(); dropPiece(); }
    if (key === 'arrowup' || key === 'w') { event.preventDefault(); rotatePiece(); }
    if (key === ' ') { event.preventDefault(); hardDrop(); }
  });

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', pauseGame);
  restartButton.addEventListener('click', restartGame);
  overlayAction.addEventListener('click', startGame);
  mobileButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.running && !state.gameOver) startGame();
      const action = button.dataset.action;
      if (action === 'left') movePiece(-1);
      if (action === 'right') movePiece(1);
      if (action === 'rotate') rotatePiece();
      if (action === 'drop') hardDrop();
    });
  });

  resetGame();
  state.running = false;
  draw();
  showOverlay('Tetris', 'Build clean lines, manage the stack, and keep the board open.', 'Start Stack');
})();
