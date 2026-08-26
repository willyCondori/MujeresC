/*A
    Creado: Willy Condori
    Fecha: 26/08/2026
    Módulo: Resultado final
    Descripción: En este archivo se muestra el puntaje final obtenido en el cuestionario.
*/

(function () {
    'use strict';

    try {
        var resultado = window.QuizScore.saveFinalResult();
        var puntuacionTotal = resultado.score;
        var puntuacionMaxima = resultado.maxScore;
        var porcentaje = 0;

        if (puntuacionMaxima > 0) {
            porcentaje = Math.max(
                0,
                Math.min(
                    100,
                    (puntuacionTotal / puntuacionMaxima) * 100
                )
            );
        }

        var etiquetaPuntuacion = document.getElementById(
            'score-current'
        );

        if (etiquetaPuntuacion) {
            etiquetaPuntuacion.textContent =
                'Tú (' + puntuacionTotal + ')';
        }

        var barraProgreso = document.querySelector(
            '.route-progress-fill'
        );

        if (barraProgreso) {
            barraProgreso.style.width = porcentaje + '%';
        }

        var puntoProgreso = document.querySelector(
            '.route-progress-dot'
        );

        if (puntoProgreso) {
            puntoProgreso.style.left = porcentaje + '%';
        }
    } catch (error) {
        console.error(
            'No se pudo mostrar el resultado final:',
            error
        );
    }
})();