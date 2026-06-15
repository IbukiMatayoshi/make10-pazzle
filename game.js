let currentBase = 10;
let targetValue = 10;
let problemNumbers = [];
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

// ★【新機能】同じような問題の連続を防ぐための履歴リスト
let pastProblemsHistory = [];

window.onload = function () {
  showHomeMenu();
};

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
    btn.innerText = "🛠️ 高度な設定を表示";
  } else {
    panel.style.display = "flex";
    btn.innerText = "🛠️ 高度な設定を隠す";
  }
}

function showHomeMenu() {
  gameState = "SETUP";
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById("overlay-content").style.display = "flex";

  score = 0;
  document.getElementById("score-val").innerText = score;
  document.getElementById("timer-val").innerText = "60";
  document.getElementById("gauge-bar").style.width = "100%";

  document.getElementById("target-info").innerText = "進数を選択してスタート！";
  document.getElementById("formula-box").innerText = "数式を作ってください";
  document.getElementById("formula-box").style.color = "#555";
  document.getElementById("result-box").innerText = "計算結果: -";
  document.getElementById("reference-table").innerHTML = "";

  document.getElementById("giveup-btn").disabled = true;
  document.getElementById("pause-btn").disabled = true;

  // 履歴のクリア
  pastProblemsHistory = [];

  renderDummyCards();

  document.getElementById("overlay-title").innerHTML = "📢 MAKE10 PUZZLE";
  document.getElementById("overlay-msg").innerHTML =
    "条件を選んで、<br>ゲームスタートボタンを押してください。";
  document.getElementById("overlay-base-select").style.display = "block";
  document.getElementById("overlay-btn-main").innerText = "ゲームスタート";
  document.getElementById("overlay-btn-sub").style.display = "none";

  const toggleBtn = document.querySelector(".btn-toggle-options");
  if (toggleBtn) {
    toggleBtn.style.display = "inline-block";
    toggleBtn.innerText = "🛠️ 高度な設定を表示";
  }
  document.getElementById("difficulty-options-panel").style.display = "none";

  handleBaseSelectChange();
  document.getElementById("game-overlay").style.display = "flex";
}

function handleBaseSelectChange() {
  const base = parseInt(document.getElementById("overlay-base-select").value);
  const timeContainer = document.getElementById("hex-time-container");
  const hintContainer = document.getElementById("hint-select-container");

  const optTarget = document.getElementById("opt-target");
  const labelTarget = document.getElementById("label-opt-target");
  const optNone = document.getElementById("opt-none");

  if (base === 2) {
    if (optTarget.checked) {
      optNone.checked = true;
    }
    optTarget.disabled = true;
    labelTarget.style.opacity = "0.4";
  } else {
    optTarget.disabled = false;
    labelTarget.style.opacity = "1";
  }

  if (base === 16) {
    timeContainer.style.display = "flex";
    hintContainer.style.display = "flex";
  } else if (base === 4 || base === 2) {
    timeContainer.style.display = "none";
    hintContainer.style.display = "flex";
  } else {
    timeContainer.style.display = "none";
    hintContainer.style.display = "none";
  }
}

function initGameRound() {
  currentBase = parseInt(document.getElementById("overlay-base-select").value);
  document.getElementById("game-base-select").value = currentBase;

  modeFraction = document.getElementById("opt-fraction").checked;
  modeTargetShift = document.getElementById("opt-target").checked;
  modeBlind = document.getElementById("opt-blind").checked;

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
  timeLeft = maxRoundTime;

  updateTargetDisplayString();

  document.getElementById("giveup-btn").disabled = false;
  document.getElementById("pause-btn").disabled = false;

  renderReferenceTable();
  preGenerateProblem();

  startGameRound();
}

function updateTargetDisplayString() {
  let targetText = targetValue.toString(currentBase).toUpperCase();
  let modeExText = "";
  if (modeFraction) modeExText += " [分数解禁]";
  if (modeTargetShift) modeExText += " [目標変動]";
  if (modeBlind) modeExText += " [ブラインド]";

  document.getElementById("target-info").innerText =
    `${currentBase}進数目標: 『 ${targetText} 』(10進数: ${targetValue}) を作れ！${modeExText}`;
}

function startGameRound() {
  gameState = "PLAYING";
  document.getElementById("game-overlay").style.display = "none";
  renderCards();
  clearFormulaInternal();
  startTimer();
}

function overlayMainAction() {
  if (gameState === "SETUP" || gameState === "CLEAR") {
    initGameRound();
  } else if (gameState === "PAUSED") {
    togglePause();
  }
}

function overlaySubAction() {
  if (gameState === "PAUSED") {
    showHomeMenu();
  }
}

function togglePause() {
  if (gameState !== "PLAYING" && gameState !== "PAUSED") return;

  if (gameState === "PLAYING") {
    gameState = "PAUSED";
    clearInterval(timerInterval);

    document.getElementById("overlay-title").innerHTML = "⏸️ PAUSE";
    document.getElementById("overlay-msg").innerHTML =
      "ゲームを一時停止しています";
    document.getElementById("overlay-base-select").style.display = "none";
    document.getElementById("hex-time-container").style.display = "none";
    document.getElementById("hint-select-container").style.display = "none";
    document.querySelector(".btn-toggle-options").style.display = "none";
    document.getElementById("difficulty-options-panel").style.display = "none";
    document.getElementById("overlay-btn-main").innerText = "ゲームを再開する";
    document.getElementById("overlay-btn-sub").style.display = "block";
    document.getElementById("overlay-btn-sub").innerText = "中断してメニューへ";

    document.getElementById("game-overlay").style.display = "flex";
  } else {
    gameState = "PLAYING";
    document.getElementById("game-overlay").style.display = "none";
    document.querySelector(".btn-toggle-options").style.display =
      "inline-block";
    timerInterval = setInterval(timerTick, 1000);
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = maxRoundTime;
  document.getElementById("timer-val").innerText = timeLeft;
  document.getElementById("gauge-bar").style.width = "100%";
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
  showAnswerAndNextButton("⏱️ タイムアップ！");
}

function giveUpAndShowAnswer() {
  if (gameState !== "PLAYING") return;
  gameState = "TRANSITION";
  clearInterval(timerInterval);
  showAnswerAndNextButton("💡 ギブアップ！");
}

function handleNextStageClick() {
  if (score >= 10) {
    showGameClearFinal();
  } else {
    if (modeTargetShift) {
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
  let cleanAns = currentAnswerFormula
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ");

  resultBox.innerHTML = `
        <div>
            <span class="fail-text" style="font-weight:bold;">${titlePrefix} 答えの一例：</span>
            <span style="color:#ff9f1c; font-size:18px; font-weight:bold; letter-spacing:1px;">${cleanAns} = ${toCustomBaseString(targetValue)}</span>
        </div>
        <button class="btn-next-stage" onclick="handleNextStageClick()">次の問題へ ➔</button>
    `;
}

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
    if (blindCardIndex !== -1) {
      let blindText = toCustomBaseString(problemNumbers[blindCardIndex]);
      let regex = new RegExp(blindText, "g");
      formulaBox.innerText = displayText.replace(regex, "？");
    } else {
      formulaBox.innerText = displayText;
    }
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
    let blindText = toCustomBaseString(problemNumbers[blindCardIndex]);
    let regex = new RegExp(blindText, "g");
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
      let displayRes = Number.isInteger(res)
        ? toCustomBaseString(res)
        : res.toFixed(2) + " (小数)";
      resultBox.innerText = `計算結果: ${displayRes}`;

      let allCardsUsed = usedCardIndices.length === 4;
      // ★【修正】許容誤差を 0.00001 から 0.001 へわずかに最適化し、四捨五入による小数の判定ミスを完全防止
      if (allCardsUsed && Math.abs(res - targetValue) < 0.001) {
        gameState = "TRANSITION";
        clearInterval(timerInterval);

        score++;
        document.getElementById("score-val").innerText = score;

        if (score >= 10) {
          resultBox.innerHTML = `
                        <span class="success-text">🎉 正解！ [10 / 10] 達成！</span>
                        <button class="btn-next-stage" onclick="handleNextStageClick()">結果を見る ➔</button>
                    `;
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

function clearFormulaInternal() {
  currentFormula = [];
  usedCardIndices = [];
  const formulaBox = document.getElementById("formula-box");
  formulaBox.innerText = "数式を作ってください";
  formulaBox.style.color = "#555";
  document.getElementById("result-box").innerText = "計算結果: -";

  problemNumbers.forEach((_, idx) => {
    const card = document.getElementById(`card-${idx}`);
    if (card) card.classList.remove("used");
  });
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

  let numValue = problemNumbers[idx];
  currentFormula.push({
    type: "num",
    val: numValue,
    idx: idx,
    text: toCustomBaseString(numValue),
  });
  usedCardIndices.push(idx);
  document.getElementById(`card-${idx}`).classList.add("used");
  updateFormulaDisplay();
}
