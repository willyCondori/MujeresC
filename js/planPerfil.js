/*
 * Modulo:  Comparación de perfil (pages/plan.html)
 * Descripcion:
 * Completa la columna "Ahora" con el nivel de confianza y la capacidad
 * de comunicación de la persona, calculados con las respuestas del
 * cuestionario (js/perfilUsuario.js debe cargarse antes).
 * La columna "Tu objetivo" no cambia. Sin respuestas guardadas, se
 * conservan los valores por defecto del HTML.
 */

(function () {
    'use strict';

    var P = window.PerfilUsuario;

    if (!P) {
        console.error('Falta cargar js/perfilUsuario.js antes de planPerfil.js');

        return;
    }

    document.addEventListener('DOMContentLoaded', function () {
        var profile = P.build();

        if (!profile.hasData) {
            return;
        }

        var confidence = P.confidenceLabel(profile.confidence);
        var communication = P.communicationLabel(profile.communication);

        var confidenceEl = document.querySelector('[data-plan-ahora="confianza"]');
        var communicationEl = document.querySelector('[data-plan-ahora="comunicacion"]');

        if (confidenceEl && confidence) {
            confidenceEl.textContent = confidence;
        }

        if (communicationEl && communication) {
            communicationEl.textContent = communication;
        }
    });
})();
