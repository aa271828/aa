// 1. ----- 全体変数 -----
const N = 8;
const HUMAN = 0;
const AI = 1;

const board = document.getElementById("board");
const edge = document.getElementById("edge");
const status = document.getElementById("status");
const applyBtn = document.getElementById("apply");
const resetBtn = document.getElementById("reset");
const overlay = document.getElementById("overlay");
const modal = document.getElementById("modal");
const youBtn = document.getElementById("You");
const aiBtn = document.getElementById("AI");
const showPlayLog = document.getElementById("log");
const copyBtn = document.getElementById("copy-btn");

const board_state = Array.from({ length: N }, () => Array(N).fill(0));
const buttons = Array.from({ length: N }, () => Array(N).fill(null));

let selected = [];

let currentPlayer = HUMAN;   // 手番: HUMAN / AI
let game_started = false;    // ポップアップで開始選択済みか

let PlayLog = "";

// 内側判定
function triangleArea(x0, y0, x1, y1, x2, y2) {
   return Math.abs((x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0));
}

function is_inner(px, py, ax, ay, bx, by, cx, cy) {
   const s = triangleArea(ax, ay, bx, by, cx, cy);
   const s1 = triangleArea(px, py, bx, by, cx, cy);
   const s2 = triangleArea(ax, ay, px, py, cx, cy);
   const s3 = triangleArea(ax, ay, bx, by, px, py);
   return Math.abs((s1 + s2 + s3) - s) < 1e-9 && s > 1e-9;
}

// 破線追加
function svg_line(btn1, btn2, animated = false) {
   const rect1 = btn1.getBoundingClientRect();
   const rect2 = btn2.getBoundingClientRect();

   const x1 = rect1.left + rect1.width / 2;
   const y1 = rect1.top + rect1.height / 2;
   const x2 = rect2.left + rect2.width / 2;
   const y2 = rect2.top + rect2.height / 2;

   const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
   line.setAttribute("x1", x1);
   line.setAttribute("y1", y1);
   line.setAttribute("x2", x2);
   line.setAttribute("y2", y2);
   line.setAttribute("stroke", "black");
   line.setAttribute("stroke-width", "2");
   line.setAttribute("stroke-dasharray", "5,5");

   if (animated) {
      line.classList.add("animated-line");
   }
   return line;
}

function clearSelection() {
   selected = [];
}

// ポップアップ
function setModalVisible(show) {
   overlay.classList.toggle("hidden", !show);
   modal.classList.toggle("hidden", !show);
}

function setStatusText() {
   if (!game_started) {
      status.textContent = "---";
      return;
   }
   status.textContent = (currentPlayer === HUMAN) ? "Your turn" : "AI turn";
}

// 盤面の破線、ボタンの色を更新
function refresh() {
   edge.innerHTML = "";

   const selectedSet = new Set(
      selected.map(p => `${p.x},${p.y}`)
   );
   const is_valid = valid();

   for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
         const btn = buttons[x][y];

         if (selectedSet.has(`${x},${y}`)) {
            btn.style.backgroundColor = "#ffd54f";
            continue;
         }

         if (
            selected.length==3&&
            is_inner(
               x, y,
               selected[0].x, selected[0].y,
               selected[1].x, selected[1].y,
               selected[2].x, selected[2].y
            )
         ) {
            btn.style.backgroundColor = (board_state[x][y] === 1) ?
"#442222" : "#cccccc";
         } else {
            btn.style.backgroundColor = (board_state[x][y] === 1) ?
"#424242" : "#fafafa";
         }
      }
   }

   if (selected.length >= 2) {
      const animated = (selected.length === 3);
      edge.appendChild(svg_line(buttons[selected[0].x][selected[0].y],
         buttons[selected[1].x][selected[1].y], animated));
   }
   if (selected.length == 3) {
      const animated = true;
      edge.appendChild(svg_line(buttons[selected[1].x][selected[1].y],
         buttons[selected[2].x][selected[2].y], animated));
      edge.appendChild(svg_line(buttons[selected[2].x][selected[2].y],
         buttons[selected[0].x][selected[0].y], animated));
   }

   applyBtn.disabled = !is_valid;
   setStatusText();
}

function toggleCell(x, y) {
   const btn = buttons[x][y];

   if (!selected.some(value => (value.x == x && value.y == y))) {
      if (selected.length >= 3) return;
      selected.push({ x, y });
   } else {
      for (let i = 0; i < selected.length; i++) {
         if (selected[i].x == x && selected[i].y == y) {
            selected.splice(i, 1);
            break;
         }
      }
   }
   refresh();
}

function valid() {
   if (!game_started) return false;
   if (selected.length != 3) return false;
   if (triangleArea(selected[0].x, selected[0].y, selected[1].x, selected[1].y, selected[2].x, selected[2].y) < 1e-9) return false;

   for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
         if (
            board_state[x][y] == 1 &&
            is_inner( x, y,
               selected[0].x, selected[0].y,
               selected[1].x, selected[1].y,
               selected[2].x, selected[2].y
            )
         ) {
            return false;
         }
      }
   }
   return true;
}
function hasValidMove() {
   console.log("judging");
   empty_cells = [];
   for (let i=0; i<8; i++) {
      for (let j=0; j<8; j++) {
         if (board_state[i][j] === 0) empty_cells.push({x:i,y:j});
      }
   }
   for (let a=0  ;a<empty_cells.length; a++) {
   for (let b=a+1;b<empty_cells.length; b++) {
   for (let c=b+1;c<empty_cells.length; c++) {
      selected = [empty_cells[a], empty_cells[b], empty_cells[c]];
      if (valid()) {selected = []; console.log("finished judge"); return true;}
   }}}
   selected = [];
   console.log("finished judge");
   return false;
}

function applyTriangle() {
   if (!valid()) return;

   for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
         if (
            is_inner(
               x, y,
               selected[0].x, selected[0].y,
               selected[1].x, selected[1].y,
               selected[2].x, selected[2].y
            )
         ) {
            board_state[x][y] ^= 1;
         }
      }
   }

   PlayLog += (currentPlayer === AI ? "AI" : "You") + "\n";
   for (const point of selected) PlayLog += (point.x + ", " + point.y) + "\n"

   clearSelection();
   currentPlayer ^= 1;
   refresh();

   //次の手があるか
   if (!hasValidMove()) {
      if (currentPlayer === AI) {
         status.textContent = "YOU WIN!";
      }
      else {
         status.textContent = "AI WINS";
      }
      currentPlayer = -1;
      return ;
   }

   // applyTriangleから発火させる
   if (game_started && currentPlayer === AI) {
      setTimeout(aiTurn, 300);
   }
}

function board_low() {
   let ret = 0;
   for (let c=0; c<32; c++) {
      let i=Math.floor(c/8);
      let j=c%8;
      if (board_state[i][j] == 1) ret += Math.pow(2, c);
   }
   console.log("LOW: ", ret);
   return ret;
}
function board_high() {
   let ret = 0;
   for (let c=0; c<32; c++) {
      let i=Math.floor(c/8)+4;
      let j=c%8;
      if (board_state[i][j] == 1) ret += Math.pow(2, c);
   }
   console.log("HIGH: ", ret);
   return ret;
}

const worker = new Worker("worker.js");

async function aiTurn() {
   if (!game_started) return;
   if (currentPlayer !== AI) return;

   clearSelection();
   resetBtn.disabled = true;
   const startTime = Date.now();
   let Timer = setInterval(() => {
      const t = Math.floor((Date.now() - startTime)/1000);
      console.log(t);
      status.textContent = "AI turn (" + (15 - t) + " sec" + ")";
   }, 1000);
   worker.postMessage({ type: "ai", low: board_low(), high: board_high() });
   worker.onmessage = (e) => {
      clearInterval(Timer);
      resetBtn.disabled = false;
      const mv = e.data.mv;
      selected.push({x: mv.r0, y: mv.c0});
      selected.push({x: mv.r1, y: mv.c1});
      selected.push({x: mv.r2, y: mv.c2});
      refresh();

      setTimeout(() => {
         applyTriangle();
      }, 300);
   }
}

function resetGame() {
   for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
         board_state[x][y] = 0;
      }
   }
   clearSelection();
   currentPlayer = HUMAN;
   game_started = false;
   setModalVisible(true);
   refresh();
}

function startGame(firstPlayer) {
   currentPlayer = firstPlayer;
   game_started = true;
   setModalVisible(false);
   refresh();

   if (currentPlayer === AI) {
      setTimeout(aiTurn, 300);
   }
}

function showLog() {
   document.getElementById("show").classList.add("active");
   document.getElementById("overlay2").classList.remove("hidden");
   
   document.getElementById("PlayLog").textContent = PlayLog;
}
document.getElementById("overlay2").addEventListener("pointerdown", () => {
   document.getElementById("show").classList.remove("active");
   document.getElementById("overlay2").classList.add("hidden");
});
copyBtn.addEventListener("pointerdown",async () => {
   try {
      await navigator.clipboard.writeText(PlayLog);

      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");

      setTimeout(() => {
         copyBtn.textContent = "Copy";
         copyBtn.classList.remove("copied");
      }, 1500);

   } catch (err) {
      console.error("コピー失敗:", err);
   }
});

// board 生成
for (let x = 0; x < N; x++) {
   for (let y = 0; y < N; y++) {
      const btn = document.createElement("button");
      btn.className = "cell";
      btn.type = "button";

      btn.addEventListener("pointerdown", (event) => {
         if (!game_started) return;
         if (currentPlayer !== HUMAN) return;
         toggleCell(x, y);
      });

      buttons[x][y] = btn;
      board.appendChild(btn);
   }
}

// ボタン
applyBtn.addEventListener("pointerdown", (event) => {
   if (currentPlayer !== HUMAN) return;
   applyTriangle();
});

resetBtn.addEventListener("pointerdown", (event) => {
   resetGame();
});

youBtn.addEventListener("pointerdown", (event) => {
   startGame(HUMAN);
});

aiBtn.addEventListener("pointerdown", (event) => {
   startGame(AI);
});

window.addEventListener("resize", () => {
   refresh();
});

// 初期化
setModalVisible(true);
refresh();

if (typeof WebAssembly !== "object") {
   alert("Wasm NG");
}

showPlayLog.addEventListener("pointerdown", () => {
   showLog();
});
