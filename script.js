document.addEventListener('DOMContentLoaded', () => {
    // 1. Merge all question bank parts into a single, complete object.
    const questionBank = {
        regulations: questionBank_part1.regulations,
        communication: questionBank_part2.communication,
        principles: questionBank_part3.principles,
        safety: questionBank_part4.safety,
        emc: questionBank_part5.emc,
        interference: questionBank_part6.interference
    };

    // 2. Get all DOM elements.
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
    const progressBarContainer = document.getElementById('progress-bar-container');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // 3. Initialize state variables.
    let currentQuestions = [];
    let score = 0;
    let incorrectQuestions = [];
    let printCounter = 0;
    const originalTitle = document.title;

    const questionCounts = {
        regulations: 13,
        communication: 13,
        principles: 6,
        safety: 1,
        emc: 1,
        interference: 1
    };

    // 4. Utility and Core Functions.
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`).classList.add('active');
        if (reviewContainer) { reviewContainer.style.display = 'none'; }
        
        const topLinksContainer = document.querySelector('.top-links');
        if (topLinksContainer) {
             // This logic was complex, simplifying to always show the container,
             // but control individual links.
             topLinksContainer.style.display = 'flex';
        }

        const quickAnswerContainer = document.querySelector('.top-links-left');
        if (quickAnswerContainer) {
            quickAnswerContainer.style.display = screenName === 'quiz' ? 'block' : 'none';
        }
    }

    function startTest(questions) {
        console.log("startTest function called");
        let questionsToTest = [];
        if (Array.isArray(questions)) { // For re-testing mistakes
            questionsToTest = [...questions];
        } else { // For a new proportional test
            console.log("Creating a new proportional test");
            for (const category in questionCounts) {
                if (questions[category] && questions[category].length > 0) {
                    const count = questionCounts[category];
                    const shuffledCategory = [...questions[category]].sort(() => Math.random() - 0.5);
                    questionsToTest.push(...shuffledCategory.slice(0, count));
                }
            }
        }

        console.log("Total questions selected:", questionsToTest.length);

        shuffleArray(questionsToTest);
        currentQuestions = questionsToTest;
        incorrectQuestions = [];
        score = 0;

        progressBarContainer.innerHTML = '';
        questionContainer.innerHTML = '';

        currentQuestions.forEach((q, index) => {
            const progressBtn = document.createElement('button');
            progressBtn.classList.add('progress-btn');
            progressBtn.innerText = index + 1;
            progressBtn.addEventListener('click', () => {
                const questionEl = document.querySelectorAll('.question')[index];
                questionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            progressBarContainer.appendChild(progressBtn);

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

            const optionInputs = questionEl.querySelectorAll(`input[name="q${index}"]`);
            optionInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    const allOptions = e.target.closest('.question').querySelectorAll('.option');
                    allOptions.forEach(opt => opt.classList.remove('selected'));
                    if (e.target.checked) {
                        e.target.parentElement.classList.add('selected');
                        const questionIndex = e.target.name.replace('q', '');
                        const progressBtn = document.querySelectorAll('.progress-btn')[questionIndex];
                        if (progressBtn) {
                            progressBtn.classList.add('answered');
                        }
                    }
                });
            });
        });

        console.log("Switching to quiz screen");
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
                <p style="font-size: 0.8em; color: #666;">[來源: ${q.category} - 第${q.id}題]</p>
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
                firstOption.dispatchEvent(new Event('change'));
            }
        });
        submitTest();
    }

    function printMistakes() {
        reviewMistakes();
        printCounter++;
        const serial = String(printCounter).padStart(3, '0');
        document.title = `wronganswer_${serial}`;
        setTimeout(() => { window.print(); }, 100);
    }

    function restartTest() {
        showScreen('start');
    }

    // 5. Event Listeners
    window.addEventListener('afterprint', () => { document.title = originalTitle; });
    startBtn.addEventListener('click', () => startTest(questionBank));
    submitBtn.addEventListener('click', submitTest);
    reviewBtn.addEventListener('click', reviewMistakes);
    retestBtn.addEventListener('click', () => startTest(incorrectQuestions.map(q => { delete q.userAnswer; return q; })) );
    restartBtn.addEventListener('click', restartTest);
    globalRestartBtn.addEventListener('click', (e) => { e.preventDefault(); restartTest(); });
    printBtn.addEventListener('click', printMistakes);
    quickAnswerBtn.addEventListener('click', (e) => { e.preventDefault(); quickSubmit(); });
    window.onscroll = function() {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };
    backToTopBtn.addEventListener('click', () => { window.scrollTo({top: 0, behavior: 'smooth'}); });

    // Initial screen setup
    showScreen('start');
});