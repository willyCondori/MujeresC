(function () {
    'use strict';

    var STORAGE_KEY = 'quizAnswers';
    var RESULT_KEY = 'quizResult';

    var QUESTION_NAMES = [
        'pregunta_autoestima',
        'pregunta_decisiones',
        'pregunta_espacios',
        'voz_1',
        'voz_2',
        'voz_3',
        'liderazgo_1',
        'liderazgo_2',
        'liderazgo_3',
        'proposito_1',
        'proposito_2',
        'proposito_3'
    ];

    function loadAnswers() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            return {};
        }
    }

    function saveAnswer(name, value) {
        try {
            var answers = loadAnswers();
            answers[name] = value;
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
        } catch (error) {}
    }

    function captureQuestionAnswers() {
        QUESTION_NAMES.forEach(function (name) {
            var radios = document.querySelectorAll(
                'input[type="radio"][name="' + name + '"]'
            );

            if (!radios.length) {
                return;
            }

            var checkedRadio = document.querySelector(
                'input[type="radio"][name="' + name + '"]:checked'
            );

            if (checkedRadio) {
                saveAnswer(name, checkedRadio.value);
            }

            radios.forEach(function (radio) {
                radio.addEventListener('change', function () {
                    if (radio.checked) {
                        saveAnswer(name, radio.value);
                    }
                });
            });
        });
    }

    function getTotalScore() {
        var answers = loadAnswers();
        var total = 0;

        QUESTION_NAMES.forEach(function (name) {
            var value = parseInt(answers[name], 10);

            if (!isNaN(value)) {
                total += value;
            }
        });

        return total;
    }

    function saveFinalResult() {
        var total = getTotalScore();
        var maxScore = QUESTION_NAMES.length * 4;
        var percentage = (total / maxScore) * 100;

        var result = {
            score: total,
            maxScore: maxScore,
            percentage: percentage,
            completedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(
                RESULT_KEY,
                JSON.stringify(result)
            );
        } catch (error) {
            console.error('No se pudo guardar el resultado final:', error);
        }

        return result;
    }

    function getFinalResult() {
        try {
            var raw = localStorage.getItem(RESULT_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    window.QuizScore = {
        getTotal: getTotalScore,
        saveFinalResult: saveFinalResult,
        getFinalResult: getFinalResult,
        minScore: QUESTION_NAMES.length * 1,
        maxScore: QUESTION_NAMES.length * 4
    };

    captureQuestionAnswers();

})();