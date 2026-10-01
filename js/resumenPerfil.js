/*
 * Modulo:  Resumen de tu perfil (pages/personalidad15.html)
 * Descripcion:
 * Pinta el resumen de cada persona usando el perfil calculado por
 * js/perfilUsuario.js (que debe cargarse antes): indicadores de
 * Motivación, Posibilidad y Personalidad, y un texto con sus rasgos,
 * motivo, freno y compromiso de tiempo.
 *
 * Si no hay respuestas guardadas, se conserva el contenido por defecto
 * del HTML. Si faltan algunas, se usa solo lo que hay.
 */

(function () {
    'use strict';

    var P = window.PerfilUsuario;

    if (!P) {
        console.error('Falta cargar js/perfilUsuario.js antes de resumenPerfil.js');

        return;
    }

    /* =========================================================
       4. TEXTO DE INFORMACIÓN
       Cada frase es una lista de trozos: { t: texto, b: negrita }
       ========================================================= */

    function txt(t) {
        return { t: t, b: false };
    }

    function bold(t) {
        return { t: t, b: true };
    }

    function confidenceClause(score) {
        if (score === null) {
            return '';
        }

        if (score >= 75) {
            return 'que se siente segura al relacionarse con otras personas';
        }

        if (score >= 45) {
            return 'cuya confianza aún puede crecer';
        }

        return 'que todavía siente poca seguridad al relacionarse con otras personas';
    }

    function buildSentences(profile) {
        var sentences = [];

        // 1) Quién es: personalidad + confianza + motivo
        var traits = [];

        if (profile.personality) {
            traits.push(bold(profile.personality.phrase));
        }

        var conf = confidenceClause(profile.confidence);

        if (conf) {
            traits.push(txt(conf));
        }

        if (traits.length || profile.motive) {
            var first = [txt('Una mujer')];

            traits.forEach(function (piece) {
                first.push(txt(' '));
                first.push(piece);
            });

            if (profile.motive) {
                first.push(txt(', orientada a '));
                first.push(bold(profile.motive.phrase));
            }

            first.push(txt('.'));
            sentences.push(first);
        }

        // 2) Qué quiere mejorar y qué se lo impide
        if (profile.improve && profile.obstacle) {
            sentences.push([
                txt('Quiere ' + profile.improve + ' y su principal freno es '),
                bold(profile.obstacle.phrase),
                txt('.')
            ]);
        } else if (profile.improve) {
            sentences.push([txt('Quiere ' + profile.improve + '.')]);
        } else if (profile.obstacle) {
            sentences.push([
                txt('Su principal freno es '),
                bold(profile.obstacle.phrase),
                txt('.')
            ]);
        }

        // 3) Experiencia previa + compromiso de tiempo
        var experience = profile.trained ? profile.trained.text : null;

        if (profile.time) {
            var amount = bold(P.minutesText(profile.time));

            if (experience === 'yes') {
                sentences.push([
                    txt('Ya ha entrenado su comunicación antes y está dispuesta a dedicar '),
                    amount,
                    txt(' a seguir creciendo.')
                ]);
            } else if (experience === 'no') {
                sentences.push([
                    txt('Aún no ha entrenado su comunicación, pero está dispuesta a dedicar '),
                    amount,
                    txt(' para empezar a hacerlo.')
                ]);
            } else {
                sentences.push([
                    txt('Está dispuesta a dedicar '),
                    amount,
                    txt(' a su crecimiento.')
                ]);
            }
        } else if (experience === 'yes') {
            sentences.push([txt('Ya ha entrenado su comunicación antes.')]);
        } else if (experience === 'no') {
            sentences.push([txt('Aún no ha entrenado su comunicación.')]);
        }

        return sentences;
    }

    /* =========================================================
       5. PINTAR EN LA PÁGINA
       ========================================================= */

    function setLevel(name, score) {
        if (score === null) {
            return;
        }

        var value = document.querySelector('[data-perfil-valor="' + name + '"]');
        var bar = document.querySelector('[data-perfil-barra="' + name + '"]');

        if (value) {
            value.textContent = P.level(score);
        }

        if (bar) {
            bar.style.setProperty(
                '--level',
                Math.max(12, Math.round(score)) + '%'
            );
        }
    }

    function renderSummary(container, sentences) {
        if (!sentences.length) {
            return;
        }

        container.textContent = '';

        sentences.forEach(function (sentence, index) {
            if (index > 0) {
                container.appendChild(document.createTextNode(' '));
            }

            sentence.forEach(function (piece) {
                if (piece.b) {
                    var strong = document.createElement('strong');

                    strong.className = 'info-dato';
                    strong.textContent = piece.t;
                    container.appendChild(strong);
                } else {
                    container.appendChild(document.createTextNode(piece.t));
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var profile = P.build();

        if (!profile.hasData) {
            return; // sin respuestas: se queda el contenido por defecto
        }

        setLevel('motivacion', profile.motivation);
        setLevel('posibilidad', profile.possibility);

        var personalityValue = document.querySelector(
            '[data-perfil-valor="personalidad"]'
        );

        if (personalityValue && profile.personality) {
            personalityValue.textContent = profile.personality.label;
        }

        var summary = document.querySelector('[data-perfil="resumen"]');

        if (summary) {
            renderSummary(summary, buildSentences(profile));
        }
    });
})();
