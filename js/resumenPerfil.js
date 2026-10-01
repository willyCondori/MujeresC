/*
 * Modulo:  Resumen de tu perfil (pages/personalidad15.html)
 * Descripcion:
 * Lee la respuesta de "¿Cuánto tiempo estás dispuesta a conseguir tus
 * objetivos?" (pages/personalidad14.html), que backNavigation.js ya guarda
 * en sessionStorage, y la muestra en el texto de información del resumen.
 * Si no hay respuesta guardada, se conserva el texto por defecto del HTML.
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'personalityAnswers';
    var TIME_PAGE = 'personalidad14.html';

    function readTimeAnswer() {
        try {
            var data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
            var answers = data[TIME_PAGE];

            return answers && answers.length ? answers[0] : null;
        } catch (error) {
            console.error('No se pudo leer el tiempo elegido:', error);

            return null;
        }
    }

    /*
     * Convierte "5 Min/día" en "5 minutos diarios" y
     * "Más de 20 Min/día" en "más de 20 minutos diarios".
     */
    function formatMinutes(text) {
        var match = /(\d+)/.exec(text || '');

        if (!match) {
            return '';
        }

        var prefix = /^\s*más/i.test(text) ? 'más de ' : '';

        return prefix + match[1] + ' minutos diarios';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var target = document.querySelector('[data-resumen-tiempo]');
        var answer = readTimeAnswer();

        if (!target || !answer) {
            return;
        }

        var formatted = formatMinutes(answer.text);

        if (formatted) {
            target.textContent = formatted;
        }
    });
})();
