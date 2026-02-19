const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = {
  I: "#00d8ff",
  O: "#ffe26c",
  T: "#bf8fff",
  S: "#6cff9d",
  Z: "#ff7889",
  J: "#6fa2ff",
  L: "#ffb56b"
};

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

let board;
let active;
let score;
let lines;
let level;
let dropCounter;
let dropInterval;
let lastTime;
let running;
let paused;
let started;
let animationId;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomType() {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
}

function spawnPiece() {
  const type = randomType();
  const shape = SHAPES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  };
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = "rgba(8, 10, 30, 0.9)";
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = board[y][x];
      if (cell) {
        drawBlock(x, y, COLORS[cell]);
      }
    }
  }

  active.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawBlock(active.x + x, active.y + y, COLORS[active.type]);
      }
    });
  });
}

function collide(piece, moveX = 0, moveY = 0, shape = piece.shape) {
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) {
        continue;
      }
      const nextX = piece.x + x + moveX;
      const nextY = piece.y + y + moveY;
      if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
        return true;
      }
      if (nextY >= 0 && board[nextY][nextX]) {
        return true;
      }
    }
  }
  return false;
}

function mergePiece() {
  active.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && active.y + y >= 0) {
        board[active.y + y][active.x + x] = active.type;
      }
    });
  });
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function rotatePiece() {
  const rotated = rotateMatrix(active.shape);
  if (!collide(active, 0, 0, rotated)) {
    active.shape = rotated;
    return;
  }
  if (!collide(active, -1, 0, rotated)) {
    active.x -= 1;
    active.shape = rotated;
    return;
  }
  if (!collide(active, 1, 0, rotated)) {
    active.x += 1;
    active.shape = rotated;
  }
}

function clearLines() {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every((cell) => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    const scoreTable = [0, 100, 300, 500, 800];
    score += scoreTable[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(120, 900 - (level - 1) * 70);
    updateInfo();
  }
}

function lockAndContinue() {
  mergePiece();
  clearLines();
  active = spawnPiece();

  if (collide(active)) {
    running = false;
    statusEl.textContent = "游戏结束，点击“重新开始”再来一次！";
    cancelAnimationFrame(animationId);
  }
}

function softDrop() {
  if (!collide(active, 0, 1)) {
    active.y += 1;
  } else {
    lockAndContinue();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(active, 0, 1)) {
    active.y += 1;
  }
  lockAndContinue();
  draw();
}

function move(dx) {
  if (!collide(active, dx, 0)) {
    active.x += dx;
  }
}

function updateInfo() {
  scoreEl.textContent = String(score);
  linesEl.textContent = String(lines);
  levelEl.textContent = String(level);
}

function gameLoop(time = 0) {
  if (!running || paused) {
    return;
  }

  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if (dropCounter > dropInterval) {
    softDrop();
  }

  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  board = createBoard();
  active = spawnPiece();
  score = 0;
  lines = 0;
  level = 1;
  dropCounter = 0;
  dropInterval = 900;
  lastTime = 0;
  running = true;
  paused = false;
  started = false;
  updateInfo();
  statusEl.textContent = "按任意方向键开始游戏";
  draw();
}

function ensureStarted() {
  if (!started && running && !paused) {
    started = true;
    statusEl.textContent = "游戏进行中";
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
  }
}

document.addEventListener("keydown", (event) => {
  if (!running) {
    return;
  }

  if (event.key.toLowerCase() === "p") {
    paused = !paused;
    statusEl.textContent = paused ? "已暂停（按 P 继续）" : "游戏进行中";
    if (!paused) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(gameLoop);
    }
    return;
  }

  if (paused) {
    return;
  }

  if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
    event.preventDefault();
    ensureStarted();
  }

  if (event.key === "ArrowLeft") {
    move(-1);
  } else if (event.key === "ArrowRight") {
    move(1);
  } else if (event.key === "ArrowDown") {
    softDrop();
  } else if (event.key === "ArrowUp") {
    rotatePiece();
  } else if (event.key === " ") {
    hardDrop();
  }

  draw();
});

restartBtn.addEventListener("click", () => {
  cancelAnimationFrame(animationId);
  startGame();
});

startGame();
