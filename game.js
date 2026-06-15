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

  document.getElementById("game-overlay").style.display = "flex";
  document.getElementById("overlay-content").style.display = "flex";

  // 一番実績のある「メニューに戻る」タイミングで、確実に各種変数をクリーンアップ
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
  if (gameState === "SETUP") {
    initGameRound();
  } else if (gameState === "CLEAR") {
    // ★【変更】もし何らかの理由でこのボタンが押された場合も強制的にメニュー初期化を挟む
    showHomeMenu();
  } else if (gameState === "PAUSED") {
    togglePause();
  }
}

function overlaySubAction() {
  if (gameState === "PAUSED" || gameState === "CLEAR") {
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
      if (allCardsUsed && Math.abs(res - targetValue) < 0.01) {
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

function checkIntRoute(p, o1, o2, o3, treeType) {
  let a = p[0],
    b = p[1],
    c = p[2],
    d = p[3];
  let step1, step2;

  if (treeType === 0) {
    step1 = calcMath(a, b, o1);
    step2 = calcMath(c, d, o3);
    if (!isCleanInteger(step1) || !isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(step1, step2, o2));
  } else if (treeType === 1) {
    step1 = calcMath(a, b, o1);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(step1, c, o2);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(step2, d, o3));
  } else if (treeType === 2) {
    step1 = calcMath(b, c, o2);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(a, step1, o1);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(step2, d, o3));
  } else if (treeType === 3) {
    step1 = calcMath(b, c, o2);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(step1, d, o3);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(a, step2, o1));
  } else if (treeType === 4) {
    step1 = calcMath(c, d, o3);
    if (!isCleanInteger(step1)) return false;
    step2 = calcMath(b, step1, o2);
    if (!isCleanInteger(step2)) return false;
    return isCleanInteger(calcMath(a, step2, o1));
  }
  return false;
}

const opStrs = ["+", "-", "*", "/"];
function buildFormulaString(p, o1, o2, o3, treeType) {
  let A = toCustomBaseString(p[0]);
  let B = toCustomBaseString(p[1]);
  let C = toCustomBaseString(p[2]);
  let D = toCustomBaseString(p[3]);
  let op1 = opStrs[o1],
    op2 = opStrs[o2],
    op3 = opStrs[o3];

  if (treeType === 0) return `((${A})${op1}(${B}))${op2}((${C})${op3}(${D}))`;
  if (treeType === 1) return `(((${A})${op1}(${B}))${op2}(${C}))${op3}(${D})`;
  if (treeType === 2) return `((${A})${op1}((${B})${op2}(${C})))${op3}(${D})`;
  if (treeType === 3) return `(${A})${op1}(((${B})${op2}(${C}))${op3}(${D}))`;
  if (treeType === 4) return `(${A})${op1}((${B})${op2}((${C})${op3}(${D})))`;
}

function fastSolve(nums, target, strictFractionCheck = false) {
  let permutations = permute(nums);
  let hasInt = false;
  let hasFrac = false;
  let fracPattern = null;

  for (let p of permutations) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          let a = p[0],
            b = p[1],
            c = p[2],
            d = p[3];

          let vals = [
            calcMath(calcMath(a, b, i), calcMath(c, d, k), j),
            calcMath(calcMath(calcMath(a, b, i), c, j), d, k),
            calcMath(calcMath(a, calcMath(b, c, j), i), d, k),
            calcMath(a, calcMath(calcMath(b, c, j), d, k), i),
            calcMath(a, calcMath(b, calcMath(c, d, k), j), i),
          ];

          for (let t = 0; t < 5; t++) {
            let res = vals[t];
            if (Number.isFinite(res) && Math.abs(res - target) < 0.001) {
              let isIntRoute = checkIntRoute(p, i, j, k, t);
              if (isIntRoute) {
                hasInt = true;
                if (!strictFractionCheck) {
                  currentAnswerFormula = buildFormulaString(p, i, j, k, t);
                  return true;
                }
              } else {
                hasFrac = true;
                fracPattern = { p, i, j, k, t };
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

function preGenerateProblem() {
  let maxAttempts = modeFraction ? 5000 : 2000;
  let nums = [];
  let found = false;

  blindCardIndex = modeBlind ? Math.floor(Math.random() * 4) : -1;

  let maxHistorySize = 3;
  if (currentBase === 4) maxHistorySize = 1;
  if (currentBase === 2) maxHistorySize = 0;

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

    if (isProblemRepeated(nums) && i < 100) continue;

    if (fastSolve(nums, targetValue, modeFraction)) {
      problemNumbers = nums;
      found = true;
      break;
    }
  }

  if (!found && modeFraction) {
    for (let i = 0; i < 1000; i++) {
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
      if (fastSolve(nums, targetValue, false)) {
        problemNumbers = nums;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    if (currentBase === 16) problemNumbers = [2, 4, 8, 2];
    else if (currentBase === 10) problemNumbers = [2, 3, 5, 0];
    else if (currentBase === 8) problemNumbers = [2, 2, 2, 2];
    else if (currentBase === 4) problemNumbers = [1, 1, 1, 1];
    else problemNumbers = [1, 1, 0, 0];
    fastSolve(problemNumbers, targetValue, false);
  }

  if (maxHistorySize > 0) {
    pastProblemsHistory.push(
      [...problemNumbers].sort((a, b) => a - b).join(","),
    );
    if (pastProblemsHistory.length > maxHistorySize)
      pastProblemsHistory.shift();
  }
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
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById("overlay-content").style.display = "flex";
  document.getElementById("overlay-title").innerHTML = "🎉 GAME CLEAR!";
  document.getElementById("overlay-msg").innerHTML =
    "素晴らしい！見事10ポイント獲得しました！";

  // 【仕様変更】誤動作を防ぐため、メインボタン（もう一度遊ぶ）は非表示化
  document.getElementById("overlay-base-select").style.display = "none";
  document.getElementById("overlay-btn-main").style.display = "none";

  // サブボタンを「ホーム画面に戻る」として活用
  document.getElementById("overlay-btn-sub").style.display = "block";
  document.getElementById("overlay-btn-sub").innerText = "🏠 ホーム画面に戻る";

  // オプションパネル系もすべて非表示化
  const toggleBtn = document.querySelector(".btn-toggle-options");
  if (toggleBtn) toggleBtn.style.display = "none";
  document.getElementById("difficulty-options-panel").style.display = "none";

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
