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

function showHomeMenu() {
  gameState = "SETUP";
  if (timerInterval) clearInterval(timerInterval);

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
    "挑戦する進数を選択して、<br>ゲームスタートボタンを押してください。";
  document.getElementById("overlay-base-select").style.display = "block";
  document.getElementById("overlay-btn-main").innerText = "ゲームスタート";
  document.getElementById("overlay-btn-sub").style.display = "none";

  handleBaseSelectChange();
  document.getElementById("game-overlay").style.display = "flex";
}

function handleBaseSelectChange() {
  const base = parseInt(document.getElementById("overlay-base-select").value);
  const timeContainer = document.getElementById("hex-time-container");
  const hintContainer = document.getElementById("hint-select-container");

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
  targetValue = currentBase;

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

  document.getElementById("target-info").innerText =
    `${currentBase}進数目標: 『 ${targetValue.toString(currentBase).toUpperCase()} 』を作れ！`;

  document.getElementById("giveup-btn").disabled = false;
  document.getElementById("pause-btn").disabled = false;

  renderReferenceTable();
  preGenerateProblem();
  startGameRound();
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
    score = 0;
    document.getElementById("score-val").innerText = score;
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
    document.getElementById("overlay-btn-main").innerText = "ゲームを再開する";
    document.getElementById("overlay-btn-sub").style.display = "block";
    document.getElementById("overlay-btn-sub").innerText = "中断してメニューへ";

    document.getElementById("game-overlay").style.display = "flex";
  } else {
    gameState = "PLAYING";
    document.getElementById("game-overlay").style.display = "none";
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

  formulaBox.style.color = "#fff";
  let displayText = "";
  let evalText = "";

  currentFormula.forEach((item) => {
    let displayChar =
      item.text === "*" ? "×" : item.text === "/" ? "÷" : item.text;
    displayText += displayChar + " ";
    evalText += item.val !== undefined ? item.val : item.text;
  });

  formulaBox.innerText = displayText;

  try {
    if (/[^0-9+\-*/().\s]/.test(evalText.replace(/\d+/g, "")))
      throw new Error();
    let res = eval(evalText);

    if (res === undefined || isNaN(res) || !isFinite(res)) {
      resultBox.innerText = "計算結果: 数式が不完全です";
    } else {
      let displayRes = Number.isInteger(res)
        ? toCustomBaseString(res)
        : res.toFixed(2) + " (10進数)";
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
            if (
              checkIntegerOnly(p[0], p[1], o1) &&
              checkIntegerOnly(p[2], p[3], o3)
            ) {
              let step1 = eval(`${p[0]}${o1}${p[1]}`);
              let step2 = eval(`${p[2]}${o3}${p[3]}`);
              if (
                Number.isInteger(step1) &&
                Number.isInteger(step2) &&
                checkIntegerOnly(step1, step2, o2)
              ) {
                let res = eval(`${step1}${o2}${step2}`);
                if (Math.abs(res - target) < 0.00001) {
                  storeAnswerFormula(fPattern, p, o1, o2, o3);
                  return true;
                }
              }
            }
            let a_o1_b = eval(`${p[0]}${o1}${p[1]}`);
            if (Number.isInteger(a_o1_b)) {
              let ab_o2_c = eval(`${a_o1_b}${o2}${p[2]}`);
              if (Number.isInteger(ab_o2_c)) {
                let res = eval(`${ab_o2_c}${o3}${p[3]}`);
                if (Number.isInteger(res) && Math.abs(res - target) < 0.00001) {
                  storeAnswerFormula(fPattern, p, o1, o2, o3);
                  return true;
                }
              }
            }
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
  let maxAttempts = 800;
  let nums = [];
  for (let i = 0; i < maxAttempts; i++) {
    nums = [];
    for (let j = 0; j < 4; j++) {
      if (currentBase === 2) {
        nums.push(Math.floor(Math.random() * 4));
      } else if (currentBase === 4) {
        nums.push(Math.floor(Math.random() * 16));
      } else {
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
  problemNumbers =
    currentBase === 2
      ? [1, 1, 0, 0]
      : [1, 1, 1, targetValue - 3 > 0 ? targetValue - 3 : 1];
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
    mainSpan.innerText = toCustomBaseString(num);
    card.appendChild(mainSpan);

    if (
      (currentBase === 16 || currentBase === 4 || currentBase === 2) &&
      isHintEnabled
    ) {
      const hintSpan = document.createElement("span");
      hintSpan.className = "card-hint-text";
      hintSpan.innerText = `(10進数: ${num})`;
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
  document.getElementById("overlay-title").innerHTML = "🎉 GAME CLEAR!";
  document.getElementById("overlay-msg").innerHTML =
    "素晴らしい！見事10ポイント獲得しました！";
  document.getElementById("overlay-base-select").style.display = "block";
  document.getElementById("overlay-btn-main").innerText = "もう一度遊ぶ";
  document.getElementById("overlay-btn-sub").style.display = "none";

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
    refTable.innerHTML = `<div class="ref-item"><b>01</b>=1</div><div class="ref-item"><b>10</b>=4</div><div class="ref-item"><b>20</b>=8</div><div class="ref-item"><b>30</b>=12</div><div class="ref-item" style="border-color:var(--success-color)">目標 <b>10</b>=4</div>`;
  } else if (currentBase === 2) {
    refTable.innerHTML = `<div class="ref-item"><b>00</b>=0</div><div class="ref-item"><b>01</b>=1</div><div class="ref-item"><b>10</b>=2</div><div class="ref-item"><b>11</b>=3</div><div class="ref-item" style="border-color:var(--success-color)">目標 <b>10</b>=2</div>`;
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

// 最初の起動
showHomeMenu();
