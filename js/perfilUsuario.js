/*
 * Modulo:  Perfil de usuario (motor compartido)
 * Descripcion:
 * Convierte las respuestas del cuestionario (personalidad1 a
 * personalidad14), que backNavigation.js guarda en sessionStorage
 * ("personalityAnswers"), en un perfil con puntajes e indicadores.
 *
 * Lo usan pages/personalidad15.html (resumen) y pages/plan.html
 * ("Ahora"). Expone window.PerfilUsuario.
 *
 * Todas las tablas de puntaje y frases están en la sección 2.
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

    // p5 - cómo valora su comunicación (0-100)
    var COMM_SELF = {
        'estoy segura': 100,
        'podrian ser mejores': 55,
        'me cuesta': 15
    };

    // p7 - nervios al negociar o hablar de algo importante (0-100)
    var NERVES = {
        'en desacuerdo': 100,
        'algo de acuerdo': 55,
        'no estoy': 50,
        'de acuerdo': 20
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

    /* Etiquetas en masculino para "Nivel de ..." / "Capacidad de ..." */
    function confidenceLabel(score) {
        if (score === null) {
            return null;
        }

        if (score >= 75) {
            return 'Alto';
        }

        return score >= 45 ? 'Medio' : 'Bajo';
    }

    function communicationLabel(score) {
        if (score === null) {
            return null;
        }

        if (score >= 70) {
            return 'Avanzado';
        }

        return score >= 45 ? 'Intermedio' : 'Principiante';
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

        var communication = average([
            lookup(COMM_SELF, a[5]),
            lookup(NERVES, a[7])
        ]);

        // haber entrenado antes suma un poco
        if (communication !== null && trained && trained.text === 'yes') {
            communication = Math.min(100, communication + 10);
        }

        return {
            hasData: Object.keys(a).some(function (k) {
                return a[k] !== '';
            }),
            personality: personality,
            motivation: motivation,
            possibility: possibility,
            confidence: confidence,
            communication: communication,
            improve: lookup(IMPROVE, a[1]),
            obstacle: obstacle,
            motive: motive,
            trained: trained,
            time: time
        };
    }

    window.PerfilUsuario = {
        build: function () {
            return buildProfile(readAll());
        },
        level: level,
        minutesText: minutesText,
        confidenceLabel: confidenceLabel,
        communicationLabel: communicationLabel
    };
})();
