/*A
    Creado: Willy Condori
    Fecha: 26/08/2026
    Módulo: Cuestionario
    Descripción: En este archivo se gestionan las respuestas del cuestionario y el cálculo del puntaje final.
*/

(function () {
    'use strict';

    var storageKey = 'quizAnswers';
    var resultKey = 'quizResult';

    var questionNames = [
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
            var datosAlmacenados = sessionStorage.getItem(storageKey);

            return datosAlmacenados
                ? JSON.parse(datosAlmacenados)
                : {};
        } catch (error) {
            console.error(
                'No se pudieron cargar las respuestas:',
                error
            );

            return {};
        }
    }

    function saveAnswer(pName, pValue ) {
        try {
            var respuestas = loadAnswers();

            respuestas[pName] = pValue;

            sessionStorage.setItem(
                storageKey,
                JSON.stringify(respuestas)
            );
        } catch (error) {
            console.error(
                'No se pudo guardar la respuesta:',
                error
            );
        }
    }

    function captureQuestionAnswers() {
        for (
            var i = 0;
            i < questionNames.length;
            i++
        ) {
            var nombrePregunta = questionNames[i];

            var radios = document.querySelectorAll(
                'input[type="radio"][name="' + nombrePregunta + '"]'
            );

            if (!radios.length) {
                continue;
            }

            var radioSeleccionado = document.querySelector(
                'input[type="radio"][name="' + nombrePregunta + '"]:checked'
            );

            if (radioSeleccionado) {
                saveAnswer(
                    nombrePregunta,
                    radioSeleccionado.value
                );
            }

            for (
                var j = 0;
                j < radios.length;
                j++
            ) {
                radios[j].addEventListener(
                    'change',
                    function () {
                        if (this.checked) {
                            saveAnswer(
                                this.name,
                                this.value
                            );
                        }
                    }
                );
            }
        }
    }

    function getTotalScore() {
        var respuestas = loadAnswers();
        var puntuacionTotal = 0;

        for (
            var i = 0;
            i < questionNames.length;
            i++
        ) {
            var nombrePregunta = questionNames[i];

            var valorRespuesta = parseInt(
                respuestas[nombrePregunta],
                10
            );

            if (!isNaN(valorRespuesta)) {
                puntuacionTotal += valorRespuesta;
            }
        }

        return puntuacionTotal;
    }

    function saveFinalResult() {
        var puntuacionTotal = getTotalScore();
        var puntuacionMaxima = questionNames.length * 4;
        var porcentaje = 0;

        if (puntuacionMaxima > 0) {
            porcentaje = (
                puntuacionTotal /
                puntuacionMaxima
            ) * 100;
        }

        var resultado = {
            score: puntuacionTotal,
            maxScore: puntuacionMaxima,
            percentage: porcentaje,
            completedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(
                resultKey,
                JSON.stringify(resultado)
            );
        } catch (error) {
            console.error(
                'No se pudo guardar el resultado final:',
                error
            );
        }

        return resultado;
    }

    function getFinalResult() {
        try {
            var datosAlmacenados = localStorage.getItem(resultKey);

            return datosAlmacenados
                ? JSON.parse(datosAlmacenados)
                : null;
        } catch (error) {
            console.error(
                'No se pudo obtener el resultado final:',
                error
            );

            return null;
        }
    }

    window.QuizScore = {
        getTotal: getTotalScore,
        saveFinalResult: saveFinalResult,
        getFinalResult: getFinalResult,
        minScore: questionNames.length * 1,
        maxScore: questionNames.length * 4
    };

    captureQuestionAnswers();
})();