let board = Array(9).fill().map(() => Array(9).fill("")); // 9×9の盤面
let metaBoard = Array(3).fill().map(() => Array(3).fill(null)); // 各小区域の勝者
let currentPlayer = "◯"; // ◯は常に先手。AI対戦の場合は✕がAI、二人対戦なら交互に
let lastMove = null;
let secondLastMove = null;
let gameOver = false;

let boardElement = document.getElementById("game-board");
let statusElement = document.getElementById("status");
let gameMode = document.getElementById("game-mode").value;

document.getElementById("game-mode").addEventListener("change", () => {
	gameMode = document.getElementById("game-mode").value;
	init();
});


// 盤面作成
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

function makeMove(row, col) {
	board[row][col] = currentPlayer;
	const cells = document.getElementsByClassName("cell");
	for (let cell of cells) {
		if (parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col) {
			cell.textContent = currentPlayer;
			cell.classList.add(currentPlayer === "◯" ? "occupied-o" : "occupied-x");
			break;
		}
	}

	secondLastMove = lastMove;
	lastMove = {
		row, col
	};

	// 全体盤での勝利判定（5目揃え）
	let winningSequence = getWinningSequence(row, col, currentPlayer);
	if (winningSequence) {
		displayWinningLine("overall", winningSequence);
		statusElement.textContent = `${currentPlayer} の勝ち！（全体5目揃え）`;
		gameOver = true;
		return;
	}

	// 小区域でのミニ勝利判定（3目揃え）
	let miniRow = Math.floor(row / 3);
	let miniCol = Math.floor(col / 3);
	if (metaBoard[miniRow][miniCol] === null) {
		let miniWinner = checkMiniWin(miniRow, miniCol);
		if (miniWinner) {
			metaBoard[miniRow][miniCol] = miniWinner;
			displayLargeMark(miniRow, miniCol, miniWinner);
			let metaSequence = getMetaWinningSequence(miniWinner);
			if (metaSequence) {
				displayWinningLine("meta", metaSequence);
				statusElement.textContent = `${miniWinner} の勝ち！（大きな印3つ揃え）`;
				gameOver = true;
				return;
			}
		}
	}
	// プレイヤー交代
	currentPlayer = currentPlayer === "◯" ? "✕" : "◯";
	if (gameMode === "ai") {
		statusElement.textContent = currentPlayer === "◯" ? "あなた（◯）の番です" :
			"コンピュータ（✕）の番です";
	} else {
		// 二人対戦の場合
		statusElement.textContent = currentPlayer === "◯" ? "プレイヤー1 (◯) の番です" :
			"プレイヤー2 (✕) の番です";
	}

	// AI対戦モードの場合、AIの手を自動実行
	if (!gameOver && gameMode === "ai" && currentPlayer === "✕") {
		computerMove();
	}
}

// コンピュータの手（minimaxなど最強AIの処理が組み込まれている部分）
// ※gameMode が "ai" の場合のみ使用
function computerMove() {
	if (gameOver) return;
	let currentState = {
		board: board.map(row => row.slice()),
		metaBoard: metaBoard.map(row => row.slice()),
		currentPlayer: currentPlayer,
		lastMove: lastMove ? {...lastMove
		} : null,
		secondLastMove: secondLastMove ? {...secondLastMove
		} : null,
		gameOver: gameOver
	};
	let {
		move
	} = minimax(currentState, SEARCH_DEPTH, -Infinity, Infinity, true);
	if (move) {
		makeMove(move.row, move.col);
	} else {
		statusElement.textContent = "引き分け！";
		gameOver = true;
	}
}

// 小区域の枠作成（ナンプレ風の強調）
function createSmallBoardBorders() {
	// 既存の small-board 要素があれば削除
	let existingMeta = document.getElementsByClassName("small-board");
	while (existingMeta[0]) {
		existingMeta[0].parentNode.removeChild(existingMeta[0]);
	}
	// 3×3の各小区域に対応する div を作成（ID付与）
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			const border = document.createElement("div");
			border.classList.add("small-board");
			border.style.top = `${i * 150}px`;
			border.style.left = `${j * 150}px`;
			border.id = `meta-${i}-${j}`;
			document.querySelector(".board-container").appendChild(border);
		}
	}
}

// 人間のクリック処理（※以前は小区域が既に決まっている場合は無視していたが、そのチェックを削除）
function handleMove(event) {
	if (gameOver) return;
	const row = parseInt(event.target.dataset.row);
	const col = parseInt(event.target.dataset.col);
	// 小区域に大きな印があっても、空セルなら手を打てるようにする
	if (board[row][col] !== "" || (secondLastMove && !isValidMove(row, col,
			secondLastMove))) return;
	makeMove(row, col);
}


// 前々回の手の小区域制限
function isValidMove(row, col, secondLastMove) {
	if (!secondLastMove) return true;
	return !(Math.floor(row / 3) === Math.floor(secondLastMove.row / 3) &&
		Math.floor(col / 3) === Math.floor(secondLastMove.col / 3));
}

// 全体盤の勝利シーケンス（5目揃い）の取得
function getWinningSequence(row, col, player) {
	const directions = [
		[
			[-1, 0],
			[1, 0]
		],
		[
			[0, -1],
			[0, 1]
		],
		[
			[-1, -1],
			[1, 1]
		],
		[
			[-1, 1],
			[1, -1]
		]
	];
	for (let [
			[dx1, dy1],
			[dx2, dy2]
		] of directions) {
		let sequence = [{
			row, col
		}];
		let r = row + dx1,
			c = col + dy1;
		while (r >= 0 && r < 9 && c >= 0 && c < 9 && board[r][c] === player) {
			sequence.unshift({
				row: r,
				col: c
			});
			r += dx1;
			c += dy1;
		}
		r = row + dx2;
		c = col + dy2;
		while (r >= 0 && r < 9 && c >= 0 && c < 9 && board[r][c] === player) {
			sequence.push({
				row: r,
				col: c
			});
			r += dx2;
			c += dy2;
		}
		if (sequence.length >= 5) return sequence;
	}
	return null;
}

// メタ盤（小区域）の勝利シーケンス（3目揃い）の取得
function getMetaWinningSequence(player) {
	for (let i = 0; i < 3; i++) {
		if (metaBoard[i][0] === player && metaBoard[i][1] === player && metaBoard[i][
				2
			] === player) {
			return [{
				r: i,
				c: 0
			}, {
				r: i,
				c: 1
			}, {
				r: i,
				c: 2
			}];
		}
		if (metaBoard[0][i] === player && metaBoard[1][i] === player && metaBoard[2][
				i
			] === player) {
			return [{
				r: 0,
				c: i
			}, {
				r: 1,
				c: i
			}, {
				r: 2,
				c: i
			}];
		}
	}
	if (metaBoard[0][0] === player && metaBoard[1][1] === player && metaBoard[2][2] ===
		player) {
		return [{
			r: 0,
			c: 0
		}, {
			r: 1,
			c: 1
		}, {
			r: 2,
			c: 2
		}];
	}
	if (metaBoard[0][2] === player && metaBoard[1][1] === player && metaBoard[2][0] ===
		player) {
		return [{
			r: 0,
			c: 2
		}, {
			r: 1,
			c: 1
		}, {
			r: 2,
			c: 0
		}];
	}
	return null;
}

// 小区域内のミニ勝利判定（3×3盤）
function checkMiniWin(miniRow, miniCol) {
	let startRow = miniRow * 3,
		startCol = miniCol * 3;
	let mini = [];
	for (let i = 0; i < 3; i++) {
		mini[i] = [];
		for (let j = 0; j < 3; j++) {
			mini[i][j] = board[startRow + i][startCol + j];
		}
	}
	for (let i = 0; i < 3; i++) {
		if (mini[i][0] && mini[i][0] === mini[i][1] && mini[i][1] === mini[i][2])
			return mini[i][0];
		if (mini[0][i] && mini[0][i] === mini[1][i] && mini[1][i] === mini[2][i])
			return mini[0][i];
	}
	if (mini[0][0] && mini[0][0] === mini[1][1] && mini[1][1] === mini[2][2])
		return mini[0][0];
	if (mini[0][2] && mini[0][2] === mini[1][1] && mini[1][1] === mini[2][0])
		return mini[0][2];
	return null;
}

// 小区域に大きな印を表示（小区域全体を覆う）
function displayLargeMark(miniRow, miniCol, player) {
	let metaDiv = document.getElementById(`meta-${miniRow}-${miniCol}`);
	// 大きな印が小区域全体を覆うようにスタイル調整
	let color = player === "✕" ? "black" : "red";
	metaDiv.innerHTML =
		`<div class="large-mark" style="color:${color}">${player}</div>`;
}

// 勝利ライン描画
// type: "overall"（9×9盤）または "meta"（3×3メタ盤）
// sequence: 勝利シーケンスの座標配列
function displayWinningLine(type, sequence) {
	let container = document.querySelector(".board-container");
	let line = document.createElement("div");
	line.classList.add("winning-line");

	let startX, startY, endX, endY;
	if (type === "overall") {
		// セル中心座標（50pxセル、中心は25px）に加え、左右に25px拡張
		let extension = 25;
		let first = sequence[0],
			last = sequence[sequence.length - 1];
		let startCenterX = first.col * 50 + 25;
		let startCenterY = first.row * 50 + 25;
		let endCenterX = last.col * 50 + 25;
		let endCenterY = last.row * 50 + 25;
		let deltaX = endCenterX - startCenterX;
		let deltaY = endCenterY - startCenterY;
		let length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		let unitX = deltaX / length,
			unitY = deltaY / length;
		startX = startCenterX - unitX * extension;
		startY = startCenterY - unitY * extension;
		endX = endCenterX + unitX * extension;
		endY = endCenterY + unitY * extension;
	} else if (type === "meta") {
		// メタ盤は各小区域150px、中心は75px、左右に75px拡張
		let extension = 75;
		let first = sequence[0],
			last = sequence[sequence.length - 1];
		let startCenterX = first.c * 150 + 75;
		let startCenterY = first.r * 150 + 75;
		let endCenterX = last.c * 150 + 75;
		let endCenterY = last.r * 150 + 75;
		let deltaX = endCenterX - startCenterX;
		let deltaY = endCenterY - startCenterY;
		let length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		let unitX = deltaX / length,
			unitY = deltaY / length;
		startX = startCenterX - unitX * extension;
		startY = startCenterY - unitY * extension;
		endX = endCenterX + unitX * extension;
		endY = endCenterY + unitY * extension;
	}

	let deltaX = endX - startX;
	let deltaY = endY - startY;
	let length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	let angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

	line.style.width = `${length}px`;
	line.style.transform = `rotate(${angle}deg)`;
	line.style.left = `${startX}px`;
	line.style.top = `${startY}px`;

	container.appendChild(line);
}


// 定数：探索深度（深くすると計算量が増えます）
const SEARCH_DEPTH = 3;

// ----- 状態のクローン/シミュレーション用ヘルパー -----
function cloneState(state) {
	return {
		board: state.board.map(row => row.slice()),
		metaBoard: state.metaBoard.map(row => row.slice()),
		currentPlayer: state.currentPlayer,
		lastMove: state.lastMove ? {...state.lastMove
		} : null,
		secondLastMove: state.secondLastMove ? {...state.secondLastMove
		} : null,
		gameOver: state.gameOver
	};
}

function simulateMove(state, move, player) {
	// クローン状態に手を適用
	let newState = cloneState(state);
	newState.board[move.row][move.col] = player;
	newState.secondLastMove = newState.lastMove;
	newState.lastMove = {
		row: move.row,
		col: move.col
	};

	// ※ 全体盤の勝利判定（5目揃え）は本探索では評価関数で大まかに判定
	// 小区域の勝利判定（3目揃え）→メタ盤更新
	let miniRow = Math.floor(move.row / 3);
	let miniCol = Math.floor(move.col / 3);
	if (newState.metaBoard[miniRow][miniCol] === null) {
		let miniWinner = checkMiniWin_(miniRow, miniCol, newState.board);
		if (miniWinner) {
			newState.metaBoard[miniRow][miniCol] = miniWinner;
		}
	}
	// 手番交代
	newState.currentPlayer = player === "◯" ? "✕" : "◯";
	return newState;
}

// 小区域内の勝利判定（盤面と領域を引数に）
function checkMiniWin_(miniRow, miniCol, boardState) {
	let startRow = miniRow * 3,
		startCol = miniCol * 3;
	let mini = [];
	for (let i = 0; i < 3; i++) {
		mini[i] = [];
		for (let j = 0; j < 3; j++) {
			mini[i][j] = boardState[startRow + i][startCol + j];
		}
	}
	for (let i = 0; i < 3; i++) {
		if (mini[i][0] && mini[i][0] === mini[i][1] && mini[i][1] === mini[i][2])
			return mini[i][0];
		if (mini[0][i] && mini[0][i] === mini[1][i] && mini[1][i] === mini[2][i])
			return mini[0][i];
	}
	if (mini[0][0] && mini[0][0] === mini[1][1] && mini[1][1] === mini[2][2])
		return mini[0][0];
	if (mini[0][2] && mini[0][2] === mini[1][1] && mini[1][1] === mini[2][0])
		return mini[0][2];
	return null;
}

// メタ盤の勝利判定：metaBoard から3目揃いがあれば true を返す
function getMetaWinningSequenceFromMeta(meta, player) {
	for (let i = 0; i < 3; i++) {
		if (meta[i][0] === player && meta[i][1] === player && meta[i][2] === player)
			return true;
		if (meta[0][i] === player && meta[1][i] === player && meta[2][i] === player)
			return true;
	}
	if (meta[0][0] === player && meta[1][1] === player && meta[2][2] === player)
		return true;
	if (meta[0][2] === player && meta[1][1] === player && meta[2][0] === player)
		return true;
	return false;
}

// ----- 評価関数関連 -----

// 各方向（横、縦、斜め）の組み合わせ
const directions = [
	[
		[0, 1],
		[0, -1]
	], // 横
	[
		[1, 0],
		[-1, 0]
	], // 縦
	[
		[1, 1],
		[-1, -1]
	], // 斜め (\)
	[
		[1, -1],
		[-1, 1]
	] // 斜め (/)
];

// 各空セルにおいて、もし player のマークを置いたらその連続数に応じたボーナスを返す
function potentialForCell(boardState, row, col, player) {
	let potential = 0;
	for (let [
			[dx1, dy1],
			[dx2, dy2]
		] of directions) {
		let count = 1; // 自分のマークを置いたと仮定
		let r = row + dx1,
			c = col + dy1;
		while (r >= 0 && r < 9 && c >= 0 && c < 9 && boardState[r][c] === player) {
			count++;
			r += dx1;
			c += dy1;
		}
		r = row + dx2;
		c = col + dy2;
		while (r >= 0 && r < 9 && c >= 0 && c < 9 && boardState[r][c] === player) {
			count++;
			r += dx2;
			c += dy2;
		}
		if (count === 2) potential += 20;
		else if (count === 3) potential += 200;
		else if (count === 4) potential += 5000;
	}
	return potential;
}

// 盤面全体のポテンシャル評価：各空セルにおける player の将来性を合計する
function evaluatePotential(boardState, player) {
	let total = 0;
	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			if (boardState[i][j] === "") {
				total += potentialForCell(boardState, i, j, player);
			}
		}
	}
	return total;
}

// 改良評価関数
function evaluateState(state) {
	// メタ盤勝利チェック（大きな印での3目揃え）
	if (getMetaWinningSequenceFromMeta(state.metaBoard, "✕")) return 10000;
	if (getMetaWinningSequenceFromMeta(state.metaBoard, "◯")) return -10000;

	// 盤面上のマーク数差（シンプルな評価）
	let countX = 0,
		countO = 0;
	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			if (state.board[i][j] === "✕") countX++;
			else if (state.board[i][j] === "◯") countO++;
		}
	}
	let baseScore = (countX - countO) * 10;

	// 各プレイヤーの将来性（ポテンシャル）の評価
	let potentialX = evaluatePotential(state.board, "✕");
	let potentialO = evaluatePotential(state.board, "◯");

	// 自分のポテンシャルが高い・相手の脅威が少ないほど評価が上がる
	return baseScore + (potentialX - potentialO);
}


// ----- ミニ勝利判定関数の名称変更 -----
// state.board を引数に取る形に変更（シミュレーション用）
function checkMiniWinState(miniRow, miniCol, boardState) {
	let startRow = miniRow * 3,
		startCol = miniCol * 3;
	let mini = [];
	for (let i = 0; i < 3; i++) {
		mini[i] = [];
		for (let j = 0; j < 3; j++) {
			mini[i][j] = boardState[startRow + i][startCol + j];
		}
	}
	for (let i = 0; i < 3; i++) {
		if (mini[i][0] && mini[i][0] === mini[i][1] && mini[i][1] === mini[i][2])
			return mini[i][0];
		if (mini[0][i] && mini[0][i] === mini[1][i] && mini[1][i] === mini[2][i])
			return mini[0][i];
	}
	if (mini[0][0] && mini[0][0] === mini[1][1] && mini[1][1] === mini[2][2])
		return mini[0][0];
	if (mini[0][2] && mini[0][2] === mini[1][1] && mini[1][1] === mini[2][0])
		return mini[0][2];
	return null;
}

// ----- 状態のシミュレーション用ヘルパー -----
function cloneState(state) {
	return {
		board: state.board.map(row => row.slice()),
		metaBoard: state.metaBoard.map(row => row.slice()),
		currentPlayer: state.currentPlayer,
		lastMove: state.lastMove ? {...state.lastMove
		} : null,
		secondLastMove: state.secondLastMove ? {...state.secondLastMove
		} : null,
		gameOver: state.gameOver
	};
}

function simulateMove(state, move, player) {
	let newState = cloneState(state);
	newState.board[move.row][move.col] = player;
	newState.secondLastMove = newState.lastMove;
	newState.lastMove = {
		row: move.row,
		col: move.col
	};
	let miniRow = Math.floor(move.row / 3);
	let miniCol = Math.floor(move.col / 3);
	if (newState.metaBoard[miniRow][miniCol] === null) {
		let miniWinner = checkMiniWinState(miniRow, miniCol, newState.board);
		if (miniWinner) {
			newState.metaBoard[miniRow][miniCol] = miniWinner;
		}
	}
	newState.currentPlayer = player === "◯" ? "✕" : "◯";
	return newState;
}

// ----- minimax (α–βカット付き) -----
function getValidMoves(state) {
	let moves = [];
	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			if (state.board[i][j] === "" &&
				(!state.secondLastMove ||
					!(Math.floor(i / 3) === Math.floor(state.secondLastMove.row / 3) &&
						Math.floor(j / 3) === Math.floor(state.secondLastMove.col / 3)))) {
				moves.push({
					row: i,
					col: j
				});
			}
		}
	}
	return moves;
}

function minimax(state, depth, alpha, beta, maximizingPlayer) {
	let validMoves = getValidMoves(state);
	if (depth === 0 || validMoves.length === 0) {
		return {
			score: evaluateState(state)
		};
	}

	if (maximizingPlayer) {
		let maxEval = -Infinity,
			bestMove = null;
		for (let move of validMoves) {
			let newState = simulateMove(state, move, "✕");
			let evalResult = minimax(newState, depth - 1, alpha, beta, false);
			if (evalResult.score > maxEval) {
				maxEval = evalResult.score;
				bestMove = move;
			}
			alpha = Math.max(alpha, evalResult.score);
			if (beta <= alpha) break;
		}
		return {
			score: maxEval,
			move: bestMove
		};
	} else {
		let minEval = Infinity,
			bestMove = null;
		for (let move of validMoves) {
			let newState = simulateMove(state, move, "◯");
			let evalResult = minimax(newState, depth - 1, alpha, beta, true);
			if (evalResult.score < minEval) {
				minEval = evalResult.score;
				bestMove = move;
			}
			beta = Math.min(beta, evalResult.score);
			if (beta <= alpha) break;
		}
		return {
			score: minEval,
			move: bestMove
		};
	}
}


function init() {
	// 勝利ラインの要素を削除
	let container = document.querySelector(".board-container");
	let lines = container.getElementsByClassName("winning-line");
	while (lines[0]) {
		lines[0].parentNode.removeChild(lines[0]);
	}

	board = Array(9).fill().map(() => Array(9).fill(""));
	metaBoard = Array(3).fill().map(() => Array(3).fill(null));
	currentPlayer = "◯";
	lastMove = null;
	secondLastMove = null;
	gameOver = false;
	boardElement = document.getElementById("game-board");
	statusElement = document.getElementById("status");
	createBoard();
	if (gameMode === "ai") {
		statusElement.textContent = "あなた（◯）の番です";
	} else {
		statusElement.textContent = "プレイヤー1 (◯) の番です";
	}
}


// リセットボタンでゲーム初期化
let resetButton = document.getElementById("reset-btn");
resetButton.addEventListener("click", init);

init();
