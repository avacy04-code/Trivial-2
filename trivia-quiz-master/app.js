let questions = [];
let current = 0;
let score = 0;
let locked = false;

const $ = (id) => document.getElementById(id);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Decodifica &quot; &#039; etc. (común en OpenTDB)
function decodeHTML(str) {
  const t = document.createElement("textarea");
  t.innerHTML = String(str);
  return t.value;
}

function normalizeQuestion(q) {
  const correct = decodeHTML(q.correct_answer);
  const incorrect = (q.incorrect_answers || []).map(decodeHTML);
  const answers = [correct, ...incorrect];

  return {
    question: decodeHTML(q.question),
    category: q.category || "Custom",
    difficulty: q.difficulty || "medium",
    type: q.type || "multiple",
    correct,
    answers: shuffle(answers.slice())
  };
}

function render() {
  const q = questions[current];

  $("q").textContent = q.question;
  $("cat").textContent = q.category;
  $("diff").textContent = q.difficulty;
  $("type").textContent = q.type;
  $("score").textContent = String(score);
  $("idx").textContent = String(current + 1);
  $("total").textContent = String(questions.length);

  const box = $("answers");
  box.innerHTML = "";
  locked = false;
  $("next").style.display = "none";

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  q.answers.forEach((ans, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer";              // <- clave para el estilo nuevo
    btn.dataset.answer = ans;              // <- para comparar sin depender del texto/HTML
    btn.innerHTML = `<span class="badge">${letters[i] || "•"}</span><span>${ans}</span>`;

    btn.addEventListener("click", () => choose(btn, ans));
    box.appendChild(btn);
  });
}

function choose(btn, ans) {
  if (locked) return;
  locked = true;

  const q = questions[current];
  const buttons = Array.from($("answers").querySelectorAll("button"));

  // Deshabilita todos tras elegir
  buttons.forEach(b => (b.disabled = true));

  // Marca la correcta (usando dataset)
  buttons.forEach(b => {
    if (b.dataset.answer === q.correct) b.classList.add("ok");
  });

  if (ans === q.correct) {
    score += 1;
    btn.classList.add("ok");
  } else {
    btn.classList.add("bad");
  }

  $("score").textContent = String(score);
  $("next").style.display = "block";
}

$("next").addEventListener("click", () => {
  current += 1;

  if (current >= questions.length) {
    $("q").textContent = `Fin 🎉 Puntuación: ${score}/${questions.length}`;
    $("answers").innerHTML = "";
    $("next").style.display = "none";
    return;
  }

  render();
});

async function start() {
  const res = await fetch("./questions.json");
  if (!res.ok) throw new Error(`HTTP ${res.status} al cargar questions.json`);

  const raw = await res.json();
  questions = raw.map(normalizeQuestion);

  shuffle(questions);
  current = 0;
  score = 0;

  render();
}

start().catch(err => {
  $("q").textContent = "Error cargando questions.json (¿lo estás abriendo sin servidor?)";
  $("answers").innerHTML = `<pre style="white-space:pre-wrap;color:#b91c1c;">${String(err)}</pre>`;
});
