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

// 【新機能】高度な設定パネルの出し入れ切り替え
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

  // カウントダウン画面を隠し、メニューコンテンツを再表示
  document.getElementById("countdown-screen").style.display = "none";
  document.getElementById("overlay-content").style.display = "block";

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

  renderDummyCards();

  document.getElementById("overlay-title").innerHTML = "📢 MAKE10 PUZZLE";
  document.getElementById("overlay-msg").innerHTML =
    "条件を選んで、<br>ゲームスタートボタンを押してください。";
  document.getElementById("overlay-base-select").style.display = "block";
  document.getElementById("overlay-btn-main").innerText = "ゲームスタート";
  document.getElementById("overlay-btn-sub").style.display = "none";

  // パネルのトグルを閉じて初期化
  document.getElementById("difficulty-options-panel").style.display = "none";
  document.querySelector(".btn-toggle-options").innerText =
    "🛠️ 高度な設定を表示";

  handleBaseSelectChange();
  document.getElementById("game-overlay").style.display = "flex";
}

function handleBaseSelectChange() {
  const base = parseInt(document.getElementById("overlay-base-select").value);
  const timeContainer = document.getElementById("hex-time-container");
  const hintContainer = document.getElementById("hint-select-container");

  const optTarget = document.getElementById("opt-target");
  const labelTarget = document.getElementById("label-opt-target");
  if (base === 2) {
    optTarget.checked = false;
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

  // 【新機能】ここからカウントダウン演出を呼び出す
  runStartCountdown();
}

// 【新機能】スタートカウントダウンシステム
function runStartCountdown() {
  gameState = "TRANSITION"; // カウントダウン中は操作をロック
  const menuContent = document.getElementById("overlay-content");
  const countdownScreen = document.getElementById("countdown-screen");

  menuContent.style.display = "none"; // メニューを隠す
  countdownScreen.style.display = "block"; // カウントダウンテキストを出す

  let count = 3;
  countdownScreen.innerText = count;

  let cdInterval = setInterval(() => {
    count--;
    if (count === 3) {
      countdownScreen.innerText = "3";
    } else if (count === 2) {
      countdownScreen.innerText = "2";
    } else if (count === 1) {
      countdownScreen.innerText = "1";
      countdownScreen.style.color = "var(--danger-color)"; // 1は赤っぽく
    } else if (count === 0) {
      countdownScreen.innerText = "GO!!";
      countdownScreen.style.color = "var(--success-color)"; // GOは緑っぽく
    } else {
      clearInterval(cdInterval);
      countdownScreen.style.color = "var(--warning-color)"; // 色を元に戻す
      startGameRound(); // カウントダウン終了でゲーム開始
    }
  }, 1000);
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
      if (allCardsUsed && Math.abs(res - targetValue) < 0.00001) {
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
  if (num < 0) return "-" + toCustomBaseString(Math.abs(num));
  if (currentBase === 2) {
    let s = num.toString(2);
    return s.length < 2 ? "0" + s : s;
  }
  if (currentBase === 4) {
    let s = num.toString(4);
    return s.length < 2 ? "0" + s : s;
  }
  return num.toString(currentBase).toUpperCase();
}

function solveStrictly(nums, target) {
  let permutations = permute(nums);
  let ops = ["+", "-", "*", "/"];
  for (let p of permutations) {
    let formulas = [
      `((A)O1(B))O2((C)O3(D))`,
      `(((A)O1(B))O2(C))O3(D)`,
      `((A)O1((B)O2(C)))O3(D)`,
      `(A)O1(((B)O2(C))O3(D))`,
      `(A)O1((B)O2((C)O3(D)))`,
    ];
    for (let o1 of ops) {
      for (let o2 of ops) {
        for (let o3 of ops) {
          for (let fPattern of formulas) {
            if (!modeFraction) {
              if (
                !checkIntegerOnly(p[0], p[1], o1) ||
                !checkIntegerOnly(p[2], p[3], o3)
              )
                continue;
              let step1 = eval(`${p[0]}${o1}${p[1]}`);
              let step2 = eval(`${p[2]}${o3}${p[3]}`);
              if (
                !Number.isInteger(step1) ||
                !Number.isInteger(step2) ||
                !checkIntegerOnly(step1, step2, o2)
              )
                continue;
            }

            try {
              let f = fPattern
                .replace("A", p[0])
                .replace("B", p[1])
                .replace("C", p[2])
                .replace("D", p[3])
                .replace("O1", o1)
                .replace("O2", o2)
                .replace("O3", o3);
              let res = eval(f);

              if (res !== undefined && isFinite(res) && !isNaN(res)) {
                if (Math.abs(res - target) < 0.00001) {
                  storeAnswerFormula(fPattern, p, o1, o2, o3);
                  return true;
                }
              }
            } catch (e) {}
          }
        }
      }
    }
  }
  return false;
}

function checkIntegerOnly(v1, v2, op) {
  if (op === "/") {
    if (v2 === 0) return false;
    return v1 % v2 === 0;
  }
  return true;
}

function storeAnswerFormula(pattern, p, o1, o2, o3) {
  currentAnswerFormula = pattern
    .replace("A", toCustomBaseString(p[0]))
    .replace("B", toCustomBaseString(p[1]))
    .replace("C", toCustomBaseString(p[2]))
    .replace("D", toCustomBaseString(p[3]))
    .replace("O1", o1)
    .replace("O2", o2)
    .replace("O3", o3);
}

function preGenerateProblem() {
  let maxAttempts = 1000;
  let nums = [];

  blindCardIndex = modeBlind ? Math.floor(Math.random() * 4) : -1;

  for (let i = 0; i < maxAttempts; i++) {
    nums = [];
    for (let j = 0; j < 4; j++) {
      if (currentBase === 2) nums.push(Math.floor(Math.random() * 4));
      else if (currentBase === 4) nums.push(Math.floor(Math.random() * 16));
      else {
        let val = Math.floor(Math.random() * (currentBase - 1)) + 1;
        if (Math.random() < 0.08) val = 0;
        nums.push(val);
      }
    }
    if (solveStrictly(nums, targetValue)) {
      problemNumbers = nums;
      return;
    }
  }
  problemNumbers = currentBase === 2 ? [1, 1, 0, 0] : [1, 1, 1, 2];
  solveStrictly(problemNumbers, targetValue);
}

function renderCards() {
  const container = document.getElementById("card-container");
  container.innerHTML = "";
  problemNumbers.forEach((num, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.id = `card-${idx}`;

    const mainSpan = document.createElement("span");
    mainSpan.className = "card-main-text";

    if (modeBlind && idx === blindCardIndex) {
      mainSpan.innerText = "？";
    } else {
      mainSpan.innerText = toCustomBaseString(num);
    }
    card.appendChild(mainSpan);

    if (
      (currentBase === 16 || currentBase === 4 || currentBase === 2) &&
      isHintEnabled
    ) {
      const hintSpan = document.createElement("span");
      hintSpan.className = "card-hint-text";
      if (modeBlind && idx === blindCardIndex) {
        hintSpan.innerText = "(??)";
      } else {
        hintSpan.innerText = `(${num})`;
      }
      card.appendChild(hintSpan);
    }

    card.onclick = () => pressCard(idx);
    container.appendChild(card);
  });
}

function renderDummyCards() {
  const container = document.getElementById("card-container");
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
  document.getElementById("countdown-screen").style.display = "none";
  document.getElementById("overlay-content").style.display = "block";

  document.getElementById("overlay-title").innerHTML = "🎉 GAME CLEAR!";
  document.getElementById("overlay-msg").innerHTML =
    "素晴らしい！見事10ポイント獲得しました！";
  document.getElementById("overlay-base-select").style.display = "block";
  document.getElementById("overlay-btn-main").innerText = "もう一度遊ぶ";
  document.getElementById("overlay-btn-sub").style.display = "none";

  // パネルとボタンの初期化
  document.getElementById("difficulty-options-panel").style.display = "none";
  document.querySelector(".btn-toggle-options").style.display = "inline-block";
  document.querySelector(".btn-toggle-options").innerText =
    "🛠️ 高度な設定を表示";

  handleBaseSelectChange();
  document.getElementById("game-overlay").style.display = "flex";
}

function renderReferenceTable() {
  const refTable = document.getElementById("reference-table");
  refTable.innerHTML = "";
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
  } else if (currentBase === 2) {
    refTable.innerHTML = `<div class="ref-item"><b>00</b>=0</div><div class="ref-item"><b>01</b>=1</div><div class="ref-item"><b>10</b>=2</div><div class="ref-item"><b>11</b>=3</div>`;
  } else {
    refTable.innerHTML = `<div class="ref-item">馴染み深い 10進数モード</div>`;
  }
}
