document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');

    const startBtn = document.getElementById('start-btn');
    const submitBtn = document.getElementById('submit-btn');
    const reviewBtn = document.getElementById('review-btn');
    const retestBtn = document.getElementById('retest-btn');
    const restartBtn = document.getElementById('restart-btn');
    const printBtn = document.getElementById('print-btn');
    const quickAnswerBtn = document.getElementById('quick-answer-btn');
    const globalRestartBtn = document.getElementById('global-restart-btn');

    const questionContainer = document.getElementById('question-container');
    const scoreEl = document.getElementById('score');
    const passFailEl = document.getElementById('pass-fail');
    const reviewContainer = document.getElementById('review-container');

    let currentQuestions = [];
    let score = 0;
    let incorrectQuestions = [];

    const questionCounts = {
        regulations: 13,
        communication: 13,
        principles: 6,
        safety: 1,
        emc: 1,
        interference: 1
    };

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startTest(questions) {
        let questionsToTest = [];
        // Check if we are retesting mistakes or starting a new proportional test
        if (Array.isArray(questions)) { 
            questionsToTest = [...questions];
        } else { 
            for (const category in questionCounts) {
                if (questionBank[category] && questionBank[category].length > 0) {
                    const count = questionCounts[category];
                    shuffleArray(questionBank[category]);
                    questionsToTest.push(...questionBank[category].slice(0, count));
                }
            }
        }

        shuffleArray(questionsToTest);
        currentQuestions = questionsToTest;
        incorrectQuestions = [];
        score = 0;

        questionContainer.innerHTML = '';
        currentQuestions.forEach((q, index) => {
            const questionEl = document.createElement('div');
            questionEl.classList.add('question');
            
            let optionsHTML = '';
            q.options.forEach((option, i) => {
                optionsHTML += `
                    <div class="option">
                        <input type="radio" id="q${index}_o${i}" name="q${index}" value="${i}">
                        <label for="q${index}_o${i}">${i + 1}. ${option}</label>
                    </div>
                `;
            });

            questionEl.innerHTML = `<p>${index + 1}. ${q.question}</p><div class="options">${optionsHTML}</div>`;
            questionContainer.appendChild(questionEl);
        });

        showScreen('quiz');
    }

    function submitTest() {
        score = 0;
        incorrectQuestions = [];

        currentQuestions.forEach((q, index) => {
            const userAnswerNode = document.querySelector(`input[name="q${index}"]:checked`);
            const userAnswer = userAnswerNode ? parseInt(userAnswerNode.value) : undefined;

            if (userAnswer === q.answer) {
                score++;
            } else {
                incorrectQuestions.push({ ...q, userAnswer, questionNumber: index + 1 });
            }
        });

        scoreEl.innerText = `你的分數: ${score} / ${currentQuestions.length}`;
        if (score >= 25) {
            passFailEl.innerText = '恭喜，你已及格！';
            passFailEl.className = 'pass';
        } else {
            passFailEl.innerText = '很遺憾，你未及格。';
            passFailEl.className = 'fail';
        }

        reviewBtn.style.display = incorrectQuestions.length > 0 ? 'block' : 'none';
        retestBtn.style.display = incorrectQuestions.length > 0 ? 'block' : 'none';
        printBtn.style.display = incorrectQuestions.length > 0 ? 'block' : 'none';
        reviewContainer.innerHTML = '';

        showScreen('result');
    }

    function reviewMistakes() {
        reviewContainer.innerHTML = '<h3>錯誤題目複習</h3>';
        incorrectQuestions.sort((a, b) => a.questionNumber - b.questionNumber).forEach(q => {
            const item = document.createElement('div');
            item.classList.add('review-item', 'incorrect');
            
            let optionsHTML = '';
            q.options.forEach((opt, i) => {
                let classStr = '';
                if (i === q.answer) classStr = 'correct-answer';
                optionsHTML += `<div class="${classStr}">${i + 1}. ${opt}</div>`;
            });

            item.innerHTML = `
                <p>${q.questionNumber}. ${q.question}</p>
                <div>${optionsHTML}</div>
                <p>你的答案: ${q.userAnswer !== undefined ? q.options[q.userAnswer] : '未作答'}</p>
                <p class="correct-answer">正確答案: ${q.options[q.answer]}</p>
            `;
            reviewContainer.appendChild(item);
        });
        reviewContainer.style.display = 'block';
    }

    function quickSubmit() {
        currentQuestions.forEach((q, index) => {
            const firstOption = document.getElementById(`q${index}_o0`);
            if (firstOption) {
                firstOption.checked = true;
            }
        });
        submitTest();
    }

    let printCounter = 0;
    const originalTitle = document.title;

    function printMistakes() {
        reviewMistakes();
        printCounter++;
        const serial = String(printCounter).padStart(3, '0');
        document.title = `wronganswer_${serial}`;
        setTimeout(() => {
            window.print();
        }, 100);
    }

    window.addEventListener('afterprint', () => {
        document.title = originalTitle;
    });

    function restartTest() {
        showScreen('start');
    }

    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`).classList.add('active');
        if (reviewContainer) {
            reviewContainer.style.display = 'none';
        }
        const quickSubmitContainer = document.getElementById('quick-submit-container');
        if (quickSubmitContainer) {
            quickSubmitContainer.style.display = screenName === 'quiz' ? 'block' : 'none';
        }
    }

    startBtn.addEventListener('click', () => startTest(questionBank));
    submitBtn.addEventListener('click', submitTest);
    reviewBtn.addEventListener('click', reviewMistakes);
    retestBtn.addEventListener('click', () => startTest(incorrectQuestions.map(q => { delete q.userAnswer; return q; })) );
    restartBtn.addEventListener('click', restartTest);
    globalRestartBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent the link from navigating
        restartTest();
    });
    printBtn.addEventListener('click', printMistakes);
    quickAnswerBtn.addEventListener('click', quickSubmit);

    const backToTopBtn = document.getElementById('back-to-top-btn');

    window.onscroll = function() {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
});
