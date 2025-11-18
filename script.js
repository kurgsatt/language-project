let questionsData = [];
let currentQuestion = 0;
let userAnswers = [];

async function translateWord() {
    const word = document.getElementById('word-input').value.trim();
    if (!word) return alert("Please enter a word!");

    const btn = document.querySelector('#translate-section button');
    btn.disabled = true;
    btn.textContent = "Loading...";

    try {
        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
            document.getElementById('result').style.display = 'none';
            return;
        }

        document.getElementById('turkish-meaning').textContent = data.turkish;
        document.getElementById('example-sentence').textContent = data.sentence;
        document.getElementById('result').style.display = 'block';
    } catch (err) {
        alert("Server bağlantı hatası");
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = "Translate";
    }
}

async function startQuiz(subject) {
    document.getElementById('quiz-area').innerHTML = "<h4>Loading...</h4>";

    try {
        const res = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject })
        });

        questionsData = await res.json();
        currentQuestion = 0;
        userAnswers = new Array(10).fill(null);
        showQuestion();
    } catch (err) {
        document.getElementById('quiz-area').innerHTML = '<p class="text-danger fw-bold">Quiz yüklenemedi.</p>';
        console.error(err);
    }
}

function showQuestion() {
    const q = questionsData[currentQuestion];

    let html = `
        <div class="text-center mb-4">
            <strong class="fs-5">Question ${currentQuestion + 1} of 10</strong>
            <div class="progress mt-2" style="height: 10px;">
                <div class="progress-bar bg-success" style="width: ${(currentQuestion + 1) * 10}%"></div>
            </div>
        </div>

        <h4 class="fw-bold mb-4">${q.question}</h4>`;

    q.options.forEach(opt => {
        const letter = opt.charAt(0);
        const checked = userAnswers[currentQuestion] === letter ? 'checked' : '';
        html += `
            <div class="form-check mb-3">
                <input class="form-check-input" type="radio" name="current" value="${letter}" id="opt${letter}" ${checked}>
                <label class="form-check-label fst-italic text-muted fs-5" for="opt${letter}">${opt}</label>
            </div>`;
    });

    html += `
        <div class="text-center mt-5">
            <button class="btn btn-primary btn-lg px-5" onclick="nextQuestion()">
                ${currentQuestion === 9 ? 'Submit & Show Results' : 'Next →'}
            </button>
        </div>`;

    document.getElementById('quiz-area').innerHTML = html;

    document.querySelectorAll('.form-check-input').forEach(input => {
        input.addEventListener('change', function() {
            document.querySelectorAll('.form-check')
                .forEach(div => div.classList.remove('selected'));
            this.parentElement.classList.add('selected');
        });
    });
}

function nextQuestion() {
    const selected = document.querySelector('input[name="current"]:checked');

    if (!selected) {
        return alert("Lütfen bir şık seçin!");
    }

    userAnswers[currentQuestion] = selected.value;
    currentQuestion++;

    if (currentQuestion < 10) {
        showQuestion();
    } else {
        submitQuiz();
    }
}

function submitQuiz() {
    // Son soruyu da kaydet
    const selected = document.querySelector('input[name="current"]:checked');
    if (selected) userAnswers[currentQuestion] = selected.value;

    let score = 0;
    questionsData.forEach((q, i) => {
        if (userAnswers[i] === q.answer) score++;
    });

    let html = `<ol class="list-group">`;

    questionsData.forEach((q, i) => {
        const userAns = userAnswers[i];
        const correctAns = q.answer;

        const statusClass = !userAns ? 'list-group-item-warning' : (userAns === correctAns ? 'list-group-item-success' : 'list-group-item-danger');

        html += `
            <li class="list-group-item ${statusClass} mb-3 p-4 rounded">
                <div class="fw-bold mb-2">${i + 1}. ${q.question}</div>
                <small>
                    Your answer: <strong>${userAns || '—'}</strong> | 
                    Correct: <strong class="text-success">${correctAns}</strong>
                </small>
                <div class="fst-italic text-muted mt-2 small">${q.options.join(' • ')}</div>
            </li>`;
    });

    html += `</ol>`;

    html += `
        <div class="text-center mt-5">
            <h2 class="text-primary fw-bold">Final Score: ${score}/10</h2>
            <button class="btn btn-outline-primary mt-3 btn-lg" onclick="location.reload()">New Quiz</button>
        </div>`;

    document.getElementById('quiz-area').innerHTML = html;
}
