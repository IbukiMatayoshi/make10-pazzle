// --- ⚙️ グローバルシステム変数 ---
let gameMode = "normal"; // "normal" | "timeattack" | "survival" | "mix"
let currentBase = 10;
let targetValue = 10;
let problemNumbers = []; // 通常時: 数値の配列 / ミックス時: {val: 10進数値, base: 進数} のオブジェクト配列
let usedCardIndices = [];
let currentFormula = [];
let score = 0;

let maxRoundTime = 60;
let timeLeft = 60;
let timerInterval = null;
let gameState = "SETUP";
let currentAnswerFormula = "";
let isHintEnabled = true;

let modeFraction = false;
let modeTargetShift = false;
let modeBlind = false;
let blindCardIndex = -1;

let pastProblemsHistory = [];

// 起動時の初期化
window.onload = function () {
  showHomeMenu();
};

// --- 🎨 UI・テーマ制御系 ---
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("theme-toggle-btn");
  if (body.classList.contains("dark-theme")) {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    btn.innerText = "☀️";
  } else {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    btn.innerText = "🌙";
  }
}

function toggleOptionsVisibility() {
  const panel = document.getElementById("difficulty-options-panel");
  const btn = document.querySelector(".btn-toggle-options");
  if (panel.style.display === "flex") {
    panel.style.display = "none";
    btn.innerText = "🛠️ 特殊ルールを表示";
  } else {
    panel.style.display = "flex";
    btn.innerText = "🛠️ 特殊ルールを隠す";
  }
}

// --- 📂 メニュー画面・モード変更制御 ---
function handleModeSelectChange() {
  const mode = document.getElementById("overlay-mode-select").value;
  const baseSection = document.getElementById("menu-section-base");
  const targetLabel = document.getElementById("label-opt-target");
  const optTarget = document.getElementById("opt-target");
  const optNone = document.getElementById("opt-none");

  if (mode === "mix") {
    if (baseSection) baseSection.style.display = "none";
    if (optTarget.checked) optNone.checked = true;
    optTarget.disabled = true;
    targetLabel.style.opacity = "0.3";

    const timeContainer = document.getElementById("hex-time-container");
    const hintSection = document.getElementById("menu-section-hint");
    if (timeContainer) timeContainer.style.display = "flex";
    if (hintSection) hintSection.style.display = "block";
  } else {
    if (baseSection) baseSection.style.display = "block";
    optTarget.disabled = false;
    targetLabel.style.opacity = "1";
    handleBaseSelectChange();
  }
}

function handleBaseSelectChange() {
  const mode = document.getElementById("overlay-mode-select").value;
  const timeContainer = document.getElementById("hex-time-container");
  const hintSection = document.getElementById("menu-section-hint");

  if (mode === "mix") return;

  if (mode === "timeattack") {
    if (timeContainer) timeContainer.style.display = "none";
  }

  const base = parseInt(document.getElementById("overlay-base-select").value);
  const optTarget = document.getElementById("opt-target");
  const labelTarget = document.getElementById("label-opt-target");
  const optNone = document.getElementById("opt-none");

  if (base === 2) {
    if (optTarget.checked) optNone.checked = true;
    optTarget.disabled = true;
    labelTarget.style.opacity = "0.4";
  } else {
    optTarget.disabled = false;
    labelTarget.style.opacity = "1";
  }

  if (base === 16 && mode !== "timeattack") {
    if (timeContainer) timeContainer.style.display = "flex";
  } else {
    if (timeContainer) timeContainer.style.display = "none";
  }

  if (base === 16 || base === 4 || base === 2) {
    if (hintSection) hintSection.style.display = "block";
  } else {
    if (hintSection) hintSection.style.display = "none";
  }
}

function showHomeMenu() {
  gameState = "SETUP";
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById("game-overlay").style.display = "flex";
  document.getElementById("overlay-content").style.display = "flex";

  score = 0;
  const scoreBox = document.getElementById("game-score-box");
  if (scoreBox) {
    scoreBox.innerHTML = `SCORE: <span id="score-val" class="score-val">0</span> / 10`;
  }
  document.getElementById("timer-val").innerText = "60";
  document.getElementById("gauge-bar").style.width = "100%";

  document.getElementById("target-info").innerText = "モードを選んでスタート！";
  document.getElementById("formula-box").innerText = "数式を作ってください";
  document.getElementById("formula-box").style.color = "#555";
  document.getElementById("result-box").innerText = "計算結果: -";
  document.getElementById("reference-table").innerHTML = "";

  document.getElementById("giveup-btn").disabled = true;
  document.getElementById("pause-btn").disabled = true;

  pastProblemsHistory = [];
  renderDummyCards();

  document.getElementById("overlay-title").innerHTML = "📢 MAKE10 PUZZLE";
  document.getElementById("overlay-msg").innerHTML =
    "条件を選んで、ゲームスタートボタンを押してください。";

  const modeSelect = document.getElementById("overlay-mode-select");
  const btnMain = document.getElementById("overlay-btn-main");
  const btnSub = document.getElementById("overlay-btn-sub");
  const baseSection = document.getElementById("menu-section-base");
  const baseSelect = document.getElementById("overlay-base-select");
  const menuSections = document.querySelectorAll(".menu-section");

  if (modeSelect) modeSelect.style.display = "block";
  if (btnMain) {
    btnMain.style.display = "block";
    btnMain.innerText = "ゲームスタート";
  }

  if (btnSub) btnSub.style.display = "none";
  if (baseSection) baseSection.style.display = "block";
  if (baseSelect) baseSelect.style.display = "block";

  menuSections.forEach((sec) => {
    sec.style.display = "block";
  });

  const toggleBtn = document.querySelector(".btn-toggle-options");
  if (toggleBtn) {
    toggleBtn.style.display = "inline-block";
    toggleBtn.innerText = "🛠️ 特殊ルールを表示";
  }
  document.getElementById("difficulty-options-panel").style.display = "none";

  handleModeSelectChange();
}

// --- 🎮 ゲームループ・ステージ初期化 ---
function initGameRound() {
  gameMode = document.getElementById("overlay-mode-select").value;

  modeFraction = document.getElementById("opt-fraction").checked;
  modeTargetShift = document.getElementById("opt-target").checked;
  modeBlind = document.getElementById("opt-blind").checked;

  if (gameMode === "mix") {
    currentBase = "mix";
    targetValue = 10;
    isHintEnabled =
      document.getElementById("overlay-hint-select").value === "on";
    maxRoundTime =
      parseInt(document.getElementById("overlay-time-select").value) || 60;
  } else {
    currentBase = parseInt(
      document.getElementById("overlay-base-select").value,
    );
    if (modeTargetShift) {
      if (currentBase === 4) targetValue = Math.floor(Math.random() * 8) + 2;
      else if (currentBase === 8)
        targetValue = Math.floor(Math.random() * 15) + 3;
      else if (currentBase === 10)
        targetValue = Math.floor(Math.random() * 20) + 5;
      else if (currentBase === 16)
        targetValue = Math.floor(Math.random() * 30) + 5;
    } else {
      targetValue = currentBase;
    }

    if (currentBase === 16) {
      maxRoundTime = parseInt(
        document.getElementById("overlay-time-select").value,
      );
      isHintEnabled =
        document.getElementById("overlay-hint-select").value === "on";
    } else if (currentBase === 4 || currentBase === 2) {
      maxRoundTime = 60;
      isHintEnabled =
        document.getElementById("overlay-hint-select").value === "on";
    } else {
      maxRoundTime = 60;
      isHintEnabled = false;
    }
  }

  document.getElementById("game-base-select").value = currentBase;

  if (gameMode === "timeattack") {
    maxRoundTime = 300;
    timeLeft = 300;
  } else {
    timeLeft = maxRoundTime;
  }

  const scoreBox = document.getElementById("game-score-box");
  if (scoreBox) {
    if (gameMode === "normal" || gameMode === "mix") {
      scoreBox.innerHTML = `SCORE: <span id="score-val" class="score-val">${score}</span> / 10`;
    } else {
      scoreBox.innerHTML = `SOLVED: <span id="score-val" class="score-val">${score}</span> 問`;
    }
  }

  updateTargetDisplayString();

  document.getElementById("giveup-btn").disabled = false;
  document.getElementById("pause-btn").disabled = false;

  renderReferenceTable();
  preGenerateProblem();
  startGameRound();
}

function updateTargetDisplayString() {
  let modeLabelText = "";
  if (gameMode === "normal") modeLabelText = "通常モード";
  if (gameMode === "timeattack") modeLabelText = "タイムアタック";
  if (gameMode === "survival") modeLabelText = "サバイバル";
  if (gameMode === "mix") modeLabelText = "進数ごちゃまぜ";

  let modeExText = ` [${modeLabelText}]`;
  if (modeFraction) modeExText += " [分数解禁]";
  if (modeTargetShift) modeExText += " [目標変動]";
  if (modeBlind) modeExText += " [ブラインド]";

  if (gameMode === "mix") {
    document.getElementById("target-info").innerText =
      `目標値: 『 10 』(10進数) を作れ！${modeExText}`;
  } else {
    let targetText = targetValue.toString(currentBase).toUpperCase();
    document.getElementById("target-info").innerText =
      `${currentBase}進数目標: 『 ${targetText} 』(10進数: ${targetValue}) を作れ！${modeExText}`;
  }
}

function startGameRound() {
  gameState = "PLAYING";
  document.getElementById("game-overlay").style.display = "none";
  renderCards();
  clearFormulaInternal();

  if (gameMode === "timeattack" && timerInterval !== null && timeLeft < 300) {
    document.getElementById("timer-val").innerText = timeLeft;
  } else {
    startTimer();
  }
}

function overlayMainAction() {
  if (
    gameState === "SETUP" ||
    gameState === "CLEAR" ||
    gameState === "GAMEOVER"
  ) {
    initGameRound();
  } else if (gameState === "PAUSED") {
    togglePause();
  }
}

function overlaySubAction() {
  if (
    gameState === "PAUSED" ||
    gameState === "CLEAR" ||
    gameState === "GAMEOVER"
  ) {
    showHomeMenu();
  }
}

function togglePause() {
  if (
    gameState !== "PLAYING" &&
    gameState !== "PAUSED" &&
    gameState !== "TRANSITION"
  )
    return;

  if (gameState === "PLAYING" || gameState === "TRANSITION") {
    this.prePauseState = gameState;
    gameState = "PAUSED";
    clearInterval(timerInterval);

    document.getElementById("overlay-title").innerHTML = "⏸️ PAUSE";

    let modeLabelText = "";
    if (gameMode === "normal") modeLabelText = "通常モード (10問チャレンジ)";
    if (gameMode === "timeattack")
      modeLabelText = "タイムアタック (5分一本勝負)";
    if (gameMode === "survival")
      modeLabelText = "サバイバルモード (ノーミス耐久)";
    if (gameMode === "mix") modeLabelText = "進数ごちゃまぜモード";

    document.getElementById("overlay-msg").innerHTML =
      `ゲームを一時停止しています<br><span style="color: var(--primary-color); font-weight: bold;">【 現在: ${modeLabelText} 】</span>`;

    const menuSections = document.querySelectorAll(".menu-section");
    menuSections.forEach((sec) => {
      sec.style.display = "none";
    });

    const baseSection = document.getElementById("menu-section-base");
    const timeContainer = document.getElementById("hex-time-container");
    const hintSection = document.getElementById("menu-section-hint");
    const modeSelect = document.getElementById("overlay-mode-select");

    if (baseSection) baseSection.style.display = "none";
    if (timeContainer) timeContainer.style.display = "none";
    if (hintSection) hintSection.style.display = "none";
    if (modeSelect) modeSelect.style.display = "none";

    document.querySelector(".btn-toggle-options").style.display = "none";
    document.getElementById("difficulty-options-panel").style.display = "none";

    const btnMain = document.getElementById("overlay-btn-main");
    if (btnMain) {
      btnMain.style.display = "block";
      btnMain.innerText = "▶ ゲームを再開する";
    }

    document.getElementById("overlay-btn-sub").style.display = "block";
    document.getElementById("overlay-btn-sub").innerText = "中断してメニューへ";

    document.getElementById("game-overlay").style.display = "flex";
  } else {
    gameState = this.prePauseState || "PLAYING";
    document.getElementById("game-overlay").style.display = "none";

    if (gameState === "PLAYING") {
      timerInterval = setInterval(timerTick, 1000);
    }
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  document.getElementById("timer-val").innerText = timeLeft;
  document.getElementById("gauge-bar").style.width =
    (timeLeft / maxRoundTime) * 100 + "%";
  timerInterval = setInterval(timerTick, 1000);
}

function timerTick() {
  if (gameState !== "PLAYING") return;
  timeLeft--;
  document.getElementById("timer-val").innerText = timeLeft;
  document.getElementById("gauge-bar").style.width =
    (timeLeft / maxRoundTime) * 100 + "%";

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timeUp();
  }
}

function timeUp() {
  gameState = "TRANSITION";
  if (gameMode === "survival") {
    showGameOverSurvival();
  } else if (gameMode === "timeattack") {
    showGameOverTimeAttack();
  } else {
    showAnswerAndNextButton("⏱️ タイムアップ！");
  }
}

function giveUpAndShowAnswer() {
  if (gameState !== "PLAYING") return;
  gameState = "TRANSITION";
  clearInterval(timerInterval);

  if (gameMode === "survival") {
    showGameOverSurvival();
  } else {
    showAnswerAndNextButton("💡 ギブアップ！");
  }
}

function handleNextStageClick() {
  if ((gameMode === "normal" || gameMode === "mix") && score >= 10) {
    showGameClearFinal();
  } else {
    if (gameMode !== "timeattack") {
      timeLeft = maxRoundTime;
    }

    if (modeTargetShift && gameMode !== "mix") {
      if (currentBase === 4) targetValue = Math.floor(Math.random() * 8) + 2;
      else if (currentBase === 8)
        targetValue = Math.floor(Math.random() * 15) + 3;
      else if (currentBase === 10)
        targetValue = Math.floor(Math.random() * 20) + 5;
      else if (currentBase === 16)
        targetValue = Math.floor(Math.random() * 30) + 5;
      updateTargetDisplayString();
    }
    preGenerateProblem();
    startGameRound();
  }
}

function showAnswerAndNextButton(titlePrefix) {
  const resultBox = document.getElementById("result-box");
  if (!resultBox) return;

  let cleanAns = currentAnswerFormula
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ");
  let displayTargetStr =
    gameMode === "mix" ? "10" : toCustomBaseString(targetValue);

  resultBox.innerHTML = `
        <div>
            <span class="fail-text" style="font-weight:bold;">${titlePrefix} 答えの一例：</span>
            <span style="color:#ff9f1c; font-size:18px; font-weight:bold; letter-spacing:1px;">${cleanAns} = ${displayTargetStr}</span>
        </div>
        <button class="btn-next-stage" onclick="handleNextStageClick()">次の問題へ ➔</button>
    `;
}

// --- ⚙️ サバイバル / タイムアタック専用ゲームオーバー処理 ---
function showGameOverSurvival() {
  gameState = "GAMEOVER";
  document.getElementById("overlay-content").style.display = "flex";
  document.getElementById("overlay-title").innerHTML = "💥 GAME OVER";
  document.getElementById("overlay-msg").innerHTML =
    `時間切れです！<br>あなたのサバイバル連続正解記録は<br><span style="font-size:28px; color:var(--warning-color); font-weight:bold;">${score} 問</span> でした！`;
  hideMenuElements();
}

function showGameOverTimeAttack() {
  gameState = "GAMEOVER";
  document.getElementById("overlay-content").style.display = "flex";
  document.getElementById("overlay-title").innerHTML = "⏱️ TIME UP!";
  document.getElementById("overlay-msg").innerHTML =
    `5分間が終了しました！<br>あなたのタイムアタック記録は<br><span style="font-size:28px; color:var(--success-color); font-weight:bold;">${score} 問</span> です！`;
  hideMenuElements();
}

function hideMenuElements() {
  document.getElementById("overlay-base-select").style.display = "none";
  const timeContainer = document.getElementById("hex-time-container");
  const hintSection = document.getElementById("menu-section-hint");
  const baseSection = document.getElementById("menu-section-base");
  const menuSections = document.querySelectorAll(".menu-section");

  if (timeContainer) timeContainer.style.display = "none";
  if (hintSection) hintSection.style.display = "none";
  if (baseSection) baseSection.style.display = "none";
  menuSections.forEach((sec) => {
    sec.style.display = "none";
  });
  document.getElementById("overlay-mode-select").style.display = "none";

  const btnMain = document.getElementById("overlay-btn-main");
  if (btnMain) btnMain.style.display = "none";

  const btnSub = document.getElementById("overlay-btn-sub");
  if (btnSub) {
    btnSub.style.display = "block";
    btnSub.innerText = "🏠 ホーム画面に戻る";
  }

  const toggleBtn = document.querySelector(".btn-toggle-options");
  if (toggleBtn) toggleBtn.style.display = "none";
  document.getElementById("difficulty-options-panel").style.display = "none";

  document.getElementById("game-overlay").style.display = "flex";
}

// --- 🧮 計算式・入力ディスプレイ制御系 ---
function updateFormulaDisplay() {
  const formulaBox = document.getElementById("formula-box");
  const resultBox = document.getElementById("result-box");

  if (currentFormula.length === 0) {
    formulaBox.innerText = "数式を作ってください";
    formulaBox.style.color = "#555";
    resultBox.innerText = "計算結果: -";
    return;
  }

  if (modeBlind && usedCardIndices.length < 2) {
    let displayText = "";
    currentFormula.forEach((item) => {
      let displayChar =
        item.text === "*" ? "×" : item.text === "/" ? "÷" : item.text;
      displayText += displayChar + " ";
    });
    formulaBox.innerText = displayText.replace(/\d+|[A-F]+/g, "？");
    resultBox.innerText =
      "計算結果: ？？ (カードを2枚以上組み合わせてください)";
    return;
  }

  formulaBox.style.color = "var(--text-main)";
  let displayText = "";
  let evalText = "";

  currentFormula.forEach((item) => {
    let displayChar =
      item.text === "*" ? "×" : item.text === "/" ? "÷" : item.text;
    displayText += displayChar + " ";
    evalText += item.val !== undefined ? item.val : item.text;
  });

  if (modeBlind && blindCardIndex !== -1) {
    let targetText =
      gameMode === "mix"
        ? toBaseString(
            problemNumbers[blindCardIndex].val,
            problemNumbers[blindCardIndex].base,
          )
        : toCustomBaseString(problemNumbers[blindCardIndex]);
    let regex = new RegExp(targetText, "g");
    formulaBox.innerText = displayText.replace(regex, "？");
  } else {
    formulaBox.innerText = displayText;
  }

  try {
    if (/[^0-9+\-*/().\s]/.test(evalText.replace(/\d+/g, "")))
      throw new Error();
    let res = eval(evalText);

    if (res === undefined || isNaN(res) || !isFinite(res)) {
      resultBox.innerText = "計算結果: 数式が不完全です";
    } else {
      let displayRes =
        gameMode === "mix"
          ? res.toFixed(2).replace(".00", "")
          : Number.isInteger(res)
            ? toCustomBaseString(res)
            : res.toFixed(2) + " (小数)";
      resultBox.innerText = `計算結果: ${displayRes}`;

      let allCardsUsed = usedCardIndices.length === 4;
      if (allCardsUsed && Math.abs(res - targetValue) < 0.01) {
        gameState = "TRANSITION";

        if (gameMode !== "timeattack") {
          clearInterval(timerInterval);
        }

        score++;
        const scoreValSpan = document.getElementById("score-val");
        if (scoreValSpan) scoreValSpan.innerText = score;

        if ((gameMode === "normal" || gameMode === "mix") && score >= 10) {
          showGameClearFinal();
        } else {
          resultBox.innerHTML = `
                        <span class="success-text">🎉 正解！ [+1 Point]</span>
                        <button class="btn-next-stage" onclick="handleNextStageClick()">次の問題へ ➔</button>
                    `;
        }
      }
    }
  } catch (e) {
    resultBox.innerText = "計算結果: 入力途中...";
  }
}

function cleanUpCardsUsedState() {
  problemNumbers.forEach((_, idx) => {
    const card = document.getElementById(`card-${idx}`);
    if (card) card.classList.remove("used");
  });
}

function clearFormulaInternal() {
  currentFormula = [];
  usedCardIndices = [];
  const formulaBox = document.getElementById("formula-box");
  formulaBox.innerText = "数式を作ってください";
  formulaBox.style.color = "#555";
  document.getElementById("result-box").innerText = "計算結果: -";
  cleanUpCardsUsedState();
}

function clearFormula() {
  if (gameState !== "PLAYING") return;
  clearFormulaInternal();
}

function pressCard(idx) {
  if (gameState !== "PLAYING" || usedCardIndices.includes(idx)) return;
  if (
    currentFormula.length > 0 &&
    currentFormula[currentFormula.length - 1].type === "num"
  )
    return;

  let numValue =
    gameMode === "mix" ? problemNumbers[idx].val : problemNumbers[idx];
  let displayText =
    gameMode === "mix"
      ? toBaseString(problemNumbers[idx].val, problemNumbers[idx].base)
      : toCustomBaseString(numValue);

  currentFormula.push({
    type: "num",
    val: numValue,
    idx: idx,
    text: displayText,
  });
  usedCardIndices.push(idx);
  document.getElementById(`card-${idx}`).classList.add("used");
  updateFormulaDisplay();
}

function pressOp(op) {
  if (gameState !== "PLAYING") return;
  if (
    currentFormula.length > 0 &&
    currentFormula[currentFormula.length - 1].text === op &&
    op !== "(" &&
    op !== ")"
  )
    return;
  currentFormula.push({ type: "op", text: op });
  updateFormulaDisplay();
}

function popFormula() {
  if (gameState !== "PLAYING" || currentFormula.length === 0) return;
  let last = currentFormula.pop();
  if (last.type === "num") {
    usedCardIndices = usedCardIndices.filter((i) => i !== last.idx);
    document.getElementById(`card-${last.idx}`).classList.remove("used");
  }
  updateFormulaDisplay();
}

function toCustomBaseString(num) {
  return toBaseString(num, currentBase);
}

function toBaseString(num, base) {
  if (num < 0) return "-" + toBaseString(Math.abs(num), base);
  let s = num.toString(base);
  if ((base === 2 || base === 4) && s.length < 2) s = "0" + s;
  return s.toUpperCase();
}

// --- 🚀 高速数学検証エンジン ---
function calcMath(a, b, opIndex) {
  if (opIndex === 0) return a + b;
  if (opIndex === 1) return a - b;
  if (opIndex === 2) return a * b;
  if (opIndex === 3) return b === 0 ? NaN : a / b;
  return NaN;
}

function isCleanInteger(val) {
  return Number.isFinite(val) && Math.abs(val % 1) < 0.0001;
}

function checkIntRoute(p, i, j, k, t) {
  let a = p[0],
    b = p[1],
    c = p[2],
    d = p[3];
  let step1, step2;

  if (t === 0) {
    step1 = calcMath(a, b, i);
    step2 = calcMath(c, d, k);
    if (!isCleanInteger(step1) || !isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(step1, step2, j));
  } else if (t === 1) {
    step1 = calcMath(a, b, i);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(step1, c, j);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(step2, d, k));
  } else if (t === 2) {
    step1 = calcMath(b, c, j);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(step1, d, k);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(a, step2, i));
  } else if (t === 3) {
    step1 = calcMath(c, d, k);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(b, step1, j);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(a, step2, i));
  } else if (t === 4) {
    step1 = calcMath(b, c, j);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(a, step1, i);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(step2, d, k));
  }
  return false;
}

const opStrs = ["+", "-", "*", "/"];
function buildFormulaString(p, o1, o2, o3, treeType, customBases = null) {
  let A = customBases
    ? toBaseString(p[0], customBases[0])
    : toBaseString(p[0], currentBase);
  let B = customBases
    ? toBaseString(p[1], customBases[1])
    : toBaseString(p[1], currentBase);
  let C = customBases
    ? toBaseString(p[2], customBases[2])
    : toBaseString(p[2], currentBase);
  let D = customBases
    ? toBaseString(p[3], customBases[3])
    : toBaseString(p[3], currentBase);
  let op1 = opStrs[o1],
    op2 = opStrs[o2],
    op3 = opStrs[o3];

  if (treeType === 0) return `((${A})${op1}(${B}))${op2}((${C})${op3}(${D}))`;
  if (treeType === 1) return `(((${A})${op1}(${B}))${op2}(${C}))${op3}(${D})`;
  if (treeType === 2) return `(${A})${op1}((((${B})${op2}(${C}))${op3}(${D}))`;
  if (treeType === 3) return `(${A})${op1}((${B})${op2}((${C})${op3}(${D})))`;
  if (treeType === 4) return `((${A})${op1}((${B})${op2}(${C})))${op3}(${D})`;
  return "";
}

function fastSolve(
  nums,
  target,
  strictFractionCheck = false,
  customBases = null,
) {
  let indexedNums = nums.map((v, i) => ({ val: v, origIdx: i }));
  let permutations = permute(indexedNums);

  let hasInt = false;
  let hasFrac = false;
  let fracPattern = null;

  for (let pObj of permutations) {
    let p = pObj.map((item) => item.val);
    let permBases = customBases
      ? pObj.map((item) => customBases[item.origIdx])
      : null;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          let a = p[0],
            b = p[1],
            c = p[2],
            d = p[3];

          let vals = [
            calcMath(calcMath(a, b, i), calcMath(c, d, k), j), // t=0
            calcMath(calcMath(calcMath(a, b, i), c, j), d, k), // t=1
            calcMath(a, calcMath(calcMath(b, c, j), d, k), i), // t=2
            calcMath(a, calcMath(b, calcMath(c, d, k), j), i), // t=3
            calcMath(calcMath(a, calcMath(b, c, j), i), d, k), // t=4
          ];

          for (let t = 0; t < 5; t++) {
            let res = vals[t];
            if (Number.isFinite(res) && Math.abs(res - target) < 0.001) {
              let isIntRoute = checkIntRoute(p, i, j, k, t);
              if (isIntRoute) {
                hasInt = true;
                if (!strictFractionCheck) {
                  currentAnswerFormula = buildFormulaString(
                    p,
                    i,
                    j,
                    k,
                    t,
                    permBases,
                  );
                  return true;
                }
              } else {
                hasFrac = true;
                fracPattern = { p, i, j, k, t, permBases };
              }
            }
          }
        }
      }
    }
  }

  if (strictFractionCheck && hasFrac && !hasInt) {
    currentAnswerFormula = buildFormulaString(
      fracPattern.p,
      fracPattern.i,
      fracPattern.j,
      fracPattern.k,
      fracPattern.t,
      fracPattern.permBases,
    );
    return true;
  }

  return false;
}

function isProblemRepeated(newNums) {
  let sortedNew = [...newNums].sort((a, b) => a - b).join(",");
  for (let past of pastProblemsHistory) {
    if (past === sortedNew) return true;
  }
  return false;
}

// --- 🎲 クイズ問題オート生成モジュール ---
function preGenerateProblem() {
  let maxAttempts = 5000;
  let found = false;

  blindCardIndex = modeBlind ? Math.floor(Math.random() * 4) : -1;

  // ★【バランス調整のキモ】分数解禁時、35%の確率で「分数必須問題（3,3,8,8など）」を狙い撃ちする
  let forceStrictFraction = modeFraction && Math.random() < 0.35;

  for (let i = 0; i < maxAttempts; i++) {
    let nums = [];
    let bases = [];

    for (let j = 0; j < 4; j++) {
      let cardBase = currentBase;
      if (gameMode === "mix") {
        const basePool = [2, 4, 8, 10, 16];
        cardBase = basePool[Math.floor(Math.random() * basePool.length)];
      }
      bases.push(cardBase);

      let val = 0;
      if (cardBase === 2) val = Math.floor(Math.random() * 4);
      else if (cardBase === 4) val = Math.floor(Math.random() * 16);
      else {
        val = Math.floor(Math.random() * (cardBase - 1)) + 1;
        if (Math.random() < 0.08) val = 0;
      }
      nums.push(val);
    }

    if (isProblemRepeated(nums) && i < 100) continue;

    if (forceStrictFraction) {
      // 狙い撃ち確率に当選した場合は、整数ルートでは絶対に解けない問題だけを探す
      if (
        fastSolve(nums, targetValue, true, gameMode === "mix" ? bases : null)
      ) {
        if (gameMode === "mix") {
          problemNumbers = nums.map((v, idx) => ({ val: v, base: bases[idx] }));
        } else {
          problemNumbers = nums;
        }
        found = true;
        break;
      }
    } else {
      // 通常時、または分数ONの残り65%の時は、整数・分数どちらでも解ければ即採用（無限バリエーション化）
      if (
        fastSolve(nums, targetValue, false, gameMode === "mix" ? bases : null)
      ) {
        if (gameMode === "mix") {
          problemNumbers = nums.map((v, idx) => ({ val: v, base: bases[idx] }));
        } else {
          problemNumbers = nums;
        }
        found = true;
        break;
      }
    }
  }

  if (!found) {
    if (gameMode === "mix") {
      problemNumbers = [
        { val: 2, base: 10 },
        { val: 3, base: 16 },
        { val: 5, base: 8 },
        { val: 0, base: 2 },
      ];
      currentAnswerFormula = "((2*5)+3)-0";
    } else {
      if (currentBase === 16) problemNumbers = [2, 4, 8, 2];
      else if (currentBase === 10) problemNumbers = [2, 3, 5, 0];
      else if (currentBase === 8) problemNumbers = [2, 2, 2, 2];
      else if (currentBase === 4) problemNumbers = [1, 1, 1, 1];
      else problemNumbers = [1, 1, 0, 0];
      fastSolve(problemNumbers, targetValue, false);
    }
  }

  let simpleNums =
    gameMode === "mix"
      ? problemNumbers.map((item) => item.val)
      : problemNumbers;
  pastProblemsHistory.push([...simpleNums].sort((a, b) => a - b).join(","));
  if (pastProblemsHistory.length > 3) pastProblemsHistory.shift();
}

// --- 🃏 カードレンダリングモジュール ---
function renderCards() {
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  problemNumbers.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.id = `card-${idx}`;

    let isBlindTarget = modeBlind && idx === blindCardIndex;

    if (gameMode === "mix") {
      const baseTag = document.createElement("div");
      baseTag.className = "card-base-tag";
      baseTag.innerText = `${item.base}進数`;
      card.appendChild(baseTag);
    }

    const mainSpan = document.createElement("span");
    mainSpan.className = "card-main-text";

    if (isBlindTarget) {
      mainSpan.innerText = "？";
    } else {
      mainSpan.innerText =
        gameMode === "mix"
          ? toBaseString(item.val, item.base)
          : toCustomBaseString(item);
    }
    card.appendChild(mainSpan);

    let shouldShowHint =
      isHintEnabled &&
      (currentBase === 16 ||
        currentBase === 4 ||
        currentBase === 2 ||
        gameMode === "mix");
    if (shouldShowHint) {
      const hintSpan = document.createElement("span");
      hintSpan.className = "card-hint-text";
      hintSpan.innerText = isBlindTarget
        ? "(??)"
        : `(${gameMode === "mix" ? item.val : item})`;
      card.appendChild(hintSpan);
    }

    card.onclick = () => pressCard(idx);
    container.appendChild(card);
  });
}

function renderDummyCards() {
  const container = document.getElementById("card-container");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const card = document.createElement("div");
    card.className = "card used";
    const mainSpan = document.createElement("span");
    mainSpan.className = "card-main-text";
    mainSpan.innerText = "?";
    card.appendChild(mainSpan);
    container.appendChild(card);
  }
}

function showGameClearFinal() {
  gameState = "CLEAR";
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById("overlay-content").style.display = "flex";
  document.getElementById("overlay-title").innerHTML = "🎉 GAME CLEAR!";
  document.getElementById("overlay-msg").innerHTML =
    "素晴らしい！見事10ポイント獲得しました！";
  hideMenuElements();
}

function renderReferenceTable() {
  const refTable = document.getElementById("reference-table");
  refTable.innerHTML = "";
  if (gameMode === "mix") {
    refTable.innerHTML = `<div class="ref-item">目標は 10進数の <b>10</b> 固定！カードごとの進数に注意！</div>`;
    return;
  }
  if (currentBase === 16) {
    const hexRefs = [
      { c: "A", v: 10 },
      { c: "B", v: 11 },
      { c: "C", v: 12 },
      { c: "D", v: 13 },
      { c: "E", v: 14 },
      { c: "F", v: 15 },
      { c: "10", v: 16 },
    ];
    hexRefs.forEach((item) => {
      refTable.innerHTML += `<div class="ref-item"><b>${item.c}</b>=${item.v}</div>`;
    });
  } else if (currentBase === 8) {
    refTable.innerHTML = `<div class="ref-item">8進数の <b>10</b> = 10進数の 8</div>`;
  } else if (currentBase === 4) {
    refTable.innerHTML = `<div class="ref-item"><b>01</b>=1</div><div class="ref-item"><b>10</b>=4</div><div class="ref-item"><b>20</b>=8</div><div class="ref-item"><b>30</b>=12</div>`;
  } else if (currentBase === 8) {
    refTable.innerHTML = `<div class="ref-item"><b>00</b>=0</div><div class="ref-item"><b>01</b>=1</div><div class="ref-item"><b>10</b>=2</div><div class="ref-item"><b>11</b>=3</div>`;
  } else {
    refTable.innerHTML = `<div class="ref-item">馴染み深い 10進数モード</div>`;
  }
}

function permute(arr) {
  let res = [];
  const dfs = (curr, remaining) => {
    if (remaining.length === 0) {
      res.push(curr);
      return;
    }
    for (let i = 0; i < remaining.length; i++) {
      dfs(
        [...curr, remaining[i]],
        remaining.filter((_, idx) => idx !== i),
      );
    }
  };
  dfs([], arr);
  return res;
}
