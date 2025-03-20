let board = Array(9).fill().map(() => Array(9).fill(""));  // 盤面
let currentPlayer = "◯";  // 現在のプレイヤー
let lastMove = null;  // 直前の手
let secondLastMove = null;  // 前々回の手

let boardElement = document.getElementById("game-board");
let statusElement = document.getElementById("status");

// 盤面を作成する関数
function createBoard() {
    createSmallBoardBorders();
    boardElement.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener("click", handleMove);
            boardElement.appendChild(cell);
        }
    }
}

// 小区域の枠を作成する関数（ナンプレ風に枠を強調）
function createSmallBoardBorders() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const border = document.createElement("div");
            border.classList.add("small-board");
            border.style.top = `${i * 150}px`;
            border.style.left = `${j * 150}px`;
            document.querySelector(".board-container").appendChild(border);
        }
    }
}

// マスをクリックしたときの処理
function handleMove(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    // 既に置かれている場合、または無効な手なら無視
    if (board[row][col] !== "" || (secondLastMove && !isValidMove(row, col, secondLastMove))) return;

    // 盤面を更新
    board[row][col] = currentPlayer;
    event.target.textContent = currentPlayer;
    event.target.classList.add(currentPlayer === "◯" ? "occupied-o" : "occupied-x");

    // 手を更新
    secondLastMove = lastMove;
    lastMove = { row, col };
    
    // 勝利判定
    if (checkWin(row, col, currentPlayer)) {
        statusElement.textContent = `${currentPlayer} の勝ち！`;
        boardElement.removeEventListener("click", handleMove);
        return;
    }

    // プレイヤー交代
    currentPlayer = currentPlayer === "◯" ? "✕" : "◯";
    statusElement.textContent = `プレイヤー${currentPlayer === "◯" ? 1 : 2} (${currentPlayer}) の番です`;
}

// 前々回に自分が置いた場所に置けないようにする関数
function isValidMove(row, col, secondLastMove) {
    if (!secondLastMove) return true;  // まだ前々回の手がない場合は問題なし
    return !(Math.floor(row / 3) === Math.floor(secondLastMove.row / 3) && Math.floor(col / 3) === Math.floor(secondLastMove.col / 3));
}

// 勝利判定関数（縦・横・斜め）
function checkWin(row, col, player) {
    const directions = [
        [[-1, 0], [1, 0]], // 縦
        [[0, -1], [0, 1]], // 横
        [[-1, -1], [1, 1]], // 斜め（\）
        [[-1, 1], [1, -1]]  // 斜め（/）
    ];
    for (let [[dx1, dy1], [dx2, dy2]] of directions) {
        let count = 1 + countInDirection(row, col, dx1, dy1, player) + countInDirection(row, col, dx2, dy2, player);
        if (count >= 5) return true;
    }
    return false;
}

// ある方向に連続した同じマークがあるか数える
function countInDirection(row, col, dx, dy, player) {
    let count = 0, r = row + dx, c = col + dy;
    while (r >= 0 && r < 9 && c >= 0 && c < 9 && board[r][c] === player) {
        count++;
        r += dx;
        c += dy;
    }
    return count;
}

function init(){
	board = Array(9).fill().map(() => Array(9).fill(""));  // 盤面
	currentPlayer = "◯";  // 現在のプレイヤー
	lastMove = null;  // 直前の手
	secondLastMove = null;  // 前々回の手

	boardElement = document.getElementById("game-board");
	statusElement = document.getElementById("status");
	// ゲーム開始時に盤面を作成
	createBoard();
}

init();