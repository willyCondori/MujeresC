/*
 * Modulo:  Resumen de tu perfil (pages/personalidad15.html)
 * Descripcion:
 * Construye un resumen distinto para cada persona a partir de las
 * respuestas del cuestionario (personalidad1 a personalidad14), que
 * backNavigation.js ya guarda en sessionStorage ("personalityAnswers").
 *
 * Calcula:
 *   - Personalidad  (personalidad2)
 *   - Motivación    (tiempo diario, claridad del motivo, convicción)
 *   - Posibilidad   (tiempo diario, obstáculo principal, experiencia previa)
 *   - Un texto de información con sus rasgos, motivo, freno y compromiso.
 *
 * Si no hay respuestas guardadas, se conserva el contenido por defecto
 * del HTML. Si faltan algunas, se usa solo lo que hay.
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'personalityAnswers';

    /* =========================================================
       1. LECTURA DE RESPUESTAS
       ========================================================= */

    function normalize(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function readAll() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
        } catch (error) {
            console.error('No se pudieron leer las respuestas:', error);

            return {};
        }
    }

    /*
     * Devuelve la respuesta de una pregunta como texto normalizado,
     * o '' si no se contestó.
     */
    function answerOf(all, page) {
        var list = all['personalidad' + page + '.html'];

        return list && list.length ? normalize(list[0].text) : '';
    }

    /*
     * Busca en `table` la primera clave con la que empieza la respuesta
     * (las claves más largas se prueban primero: "no recuerdo" antes
     * que "no"). Devuelve el valor asociado o null.
     */
    function lookup(table, answer) {
        if (!answer) {
            return null;
        }

        var keys = Object.keys(table).sort(function (a, b) {
            return b.length - a.length;
        });

        for (var i = 0; i < keys.length; i++) {
            if (answer.indexOf(keys[i]) === 0) {
                return table[keys[i]];
            }
        }

        return null;
    }

    /* =========================================================
       2. TABLAS DE PUNTAJE Y FRASES (editar aquí)
       ========================================================= */

    // p2 - ¿Qué tipo de persona te consideras?
    var PERSONALITY = {
        'extrovertida': {
            label: 'Extrovertida',
            phrase: 'extrovertida'
        },
        'introvertida': {
            label: 'Introvertida',
            phrase: 'introvertida'
        },
        'ambos': {
            label: 'Ambivertida',
            phrase: 'con rasgos extrovertidos e introvertidos'
        }
    };

    // p3 - confianza al conocer gente (0-100)
    var CONFIDENCE_MEET = {
        'mucha confianza': 100,
        'algo de confianza': 55,
        'ninguna confianza': 15
    };

    // p4 - miedo a que otros la juzguen (0-100, más alto = menos miedo)
    var FEAR_JUDGED = {
        'casi nunca': 100,
        'a veces': 55,
        'casi siempre': 15
    };

    // p1 - en qué le gustaría mejorar
    var IMPROVE = {
        'sentirme mas segura': 'sentirse más segura',
        'conseguir una presencia': 'ganar una presencia más fuerte',
        'establecer mas relaciones': 'establecer más relaciones con otras personas'
    };

    // p9 - "si tuviera más confianza conseguiría más" (convicción)
    var CONVICTION = {
        'de acuerdo': 100,
        'algo de acuerdo': 75,
        'no estoy': 55,
        'en desacuerdo': 40
    };

    // p11 - ¿ha entrenado antes su comunicación?
    var TRAINED = {
        'si': { score: 90, text: 'yes' },
        'no recuerdo': { score: 70, text: null },
        'no': { score: 70, text: 'no' }
    };

    // p12 - qué le impide crecer (puntaje de posibilidad + frase)
    var OBSTACLE = {
        'no se por donde empezar': {
            score: 85,
            phrase: 'no saber por dónde empezar'
        },
        'pienso demasiado': {
            score: 65,
            phrase: 'pensar demasiado'
        },
        'me da miedo': {
            score: 60,
            phrase: 'el miedo a ser juzgada'
        },
        'postergar': {
            score: 45,
            phrase: 'la tendencia a postergar decisiones importantes'
        }
    };

    // p13 - motivo concreto (claridad del objetivo + frase)
    var MOTIVE = {
        'avanzar profesionalmente': {
            score: 100,
            phrase: 'avanzar profesionalmente'
        },
        'crear mi propia empresa': {
            score: 100,
            phrase: 'crear su propia empresa'
        },
        'ampliar mis propias oportunidades': {
            score: 100,
            phrase: 'ampliar sus oportunidades'
        },
        'bienestar mental': {
            score: 100,
            phrase: 'cuidar su bienestar mental y emocional'
        },
        'crear nuevas amistades': {
            score: 100,
            phrase: 'crear nuevas amistades'
        },
        'otros objetivos': {
            score: 70,
            phrase: 'alcanzar sus objetivos personales'
        }
    };

    // p14 - minutos diarios → [motivación, posibilidad]
    var TIME_SCORE = {
        5: [50, 40],
        10: [65, 60],
        15: [80, 78],
        20: [95, 92]
    };

    /* =========================================================
       3. CÁLCULO DEL PERFIL
       ========================================================= */

    function average(values) {
        var list = values.filter(function (v) {
            return typeof v === 'number';
        });

        if (!list.length) {
            return null;
        }

        return list.reduce(function (a, b) {
            return a + b;
        }, 0) / list.length;
    }

    /* Promedio ponderado usando solo los datos disponibles. */
    function weighted(items) {
        var total = 0;
        var weights = 0;

        items.forEach(function (item) {
            if (typeof item.value === 'number') {
                total += item.value * item.weight;
                weights += item.weight;
            }
        });

        return weights ? total / weights : null;
    }

    function level(score) {
        if (score >= 75) {
            return 'Alta';
        }

        return score >= 55 ? 'Media' : 'Baja';
    }

    function parseMinutes(text) {
        var match = /(\d+)/.exec(text || '');

        if (!match) {
            return null;
        }

        var minutes = parseInt(match[1], 10);

        return {
            minutes: minutes >= 20 ? 20 : minutes,
            more: /^\s*mas/.test(text)
        };
    }

    function minutesText(time) {
        return (time.more ? 'más de ' : '') + time.minutes + ' minutos diarios';
    }

    function buildProfile(all) {
        var a = {};

        for (var p = 1; p <= 14; p++) {
            a[p] = answerOf(all, p);
        }

        var time = parseMinutes(a[14]);
        var timeScore = time ? TIME_SCORE[time.minutes] : null;

        var motive = lookup(MOTIVE, a[13]);
        var obstacle = lookup(OBSTACLE, a[12]);
        var trained = lookup(TRAINED, a[11]);
        var personality = lookup(PERSONALITY, a[2]);

        var motivation = weighted([
            { value: timeScore ? timeScore[0] : null, weight: 0.5 },
            { value: motive ? motive.score : null, weight: 0.2 },
            { value: lookup(CONVICTION, a[9]), weight: 0.3 }
        ]);

        var possibility = weighted([
            { value: timeScore ? timeScore[1] : null, weight: 0.5 },
            { value: obstacle ? obstacle.score : null, weight: 0.3 },
            { value: trained ? trained.score : null, weight: 0.2 }
        ]);

        var confidence = average([
            lookup(CONFIDENCE_MEET, a[3]),
            lookup(FEAR_JUDGED, a[4])
        ]);

        return {
            hasData: Object.keys(a).some(function (k) {
                return a[k] !== '';
            }),
            personality: personality,
            motivation: motivation,
            possibility: possibility,
            confidence: confidence,
            improve: lookup(IMPROVE, a[1]),
            obstacle: obstacle,
            motive: motive,
            trained: trained,
            time: time
        };
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
            var amount = bold(minutesText(profile.time));

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
            value.textContent = level(score);
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
        var profile = buildProfile(readAll());

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
