(function () {
    'use strict';

    var STORAGE_KEY = 'quizAnswers';

    // Los 12 grupos de preguntas con puntaje (1 = Nunca ... 4 = Siempre)
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

    // Si la página actual tiene alguno de los 12 grupos de preguntas,
    // guarda la respuesta seleccionada (incluyendo la marcada por defecto)
    // y actualiza el valor guardado cada vez que el usuario cambia su respuesta.
    function captureQuestionAnswers() {
        QUESTION_NAMES.forEach(function (name) {
            var radios = document.querySelectorAll('input[type="radio"][name="' + name + '"]');

            if (!radios.length) {
                return;
            }

            var checkedRadio = document.querySelector('input[type="radio"][name="' + name + '"]:checked');

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

    // Expone una API mínima para que otras páginas (ej. final.html)
    // puedan leer el puntaje total sin duplicar la lista de preguntas.
    window.QuizScore = {
        getTotal: getTotalScore,
        minScore: QUESTION_NAMES.length * 1,
        maxScore: QUESTION_NAMES.length * 4
    };

    captureQuestionAnswers();

})();
