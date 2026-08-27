/*A
    Creado: Willy Condori
    Fecha: 27/08/2026
    Módulo: Navegación de cuestionarios y personalidad
    Descripción: Permite regresar a la página anterior y conservar las respuestas seleccionadas.
*/

(function () {
    'use strict';

    var quizStorageKey = 'quizAnswers';
    var personalityStorageKey = 'personalityAnswers';

    function getCurrentPage() {
        var path = window.location.pathname;
        var fileName = path.substring(path.lastIndexOf('/') + 1);

        return fileName.toLowerCase();
    }

    function getPageNumber(prefix) {
        var page = getCurrentPage();

        var match = page.match(
            new RegExp('^' + prefix + '(\\d+)\\.html$')
        );

        return match ? parseInt(match[1], 10) : null;
    }

    function loadStorage(key) {
        try {
            var data = sessionStorage.getItem(key);

            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error(
                'No se pudieron cargar los datos guardados:',
                error
            );

            return {};
        }
    }

    function saveStorage(key, data) {
        try {
            sessionStorage.setItem(
                key,
                JSON.stringify(data)
            );
        } catch (error) {
            console.error(
                'No se pudieron guardar los datos:',
                error
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * PERSONALIDAD
     * ---------------------------------------------------------
     */

    function savePersonalityAnswers() {
        var page = getCurrentPage();

        if (page.indexOf('personalidad') !== 0) {
            return;
        }

        var checkboxes = document.querySelectorAll(
            'input[type="checkbox"].option-checkbox'
        );

        if (!checkboxes.length) {
            return;
        }

        var answers = loadStorage(
            personalityStorageKey
        );

        var pageAnswers = [];

        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                pageAnswers.push({
                    value: checkboxes[i].value || '',
                    text: getOptionText(checkboxes[i])
                });
            }
        }

        answers[page] = pageAnswers;

        saveStorage(
            personalityStorageKey,
            answers
        );
    }

    function getOptionText(checkbox) {
        var label = checkbox.closest('label');

        if (!label) {
            return '';
        }

        var textElement = label.querySelector(
            '.option-text, .option-text-normal'
        );

        if (textElement) {
            return textElement.textContent.trim();
        }

        return label.textContent
            .replace(/\s+/g, ' ')
            .trim();
    }

    function restorePersonalityAnswers() {
        var page = getCurrentPage();

        if (page.indexOf('personalidad') !== 0) {
            return;
        }

        var answers = loadStorage(
            personalityStorageKey
        );

        var pageAnswers = answers[page];

        if (!pageAnswers) {
            return;
        }

        var checkboxes = document.querySelectorAll(
            'input[type="checkbox"].option-checkbox'
        );

        for (var i = 0; i < checkboxes.length; i++) {
            var checkbox = checkboxes[i];
            var value = checkbox.value || '';
            var text = getOptionText(checkbox);

            var shouldBeChecked = false;

            for (var j = 0; j < pageAnswers.length; j++) {
                var savedAnswer = pageAnswers[j];

                if (
                    (value && savedAnswer.value === value) ||
                    (!value && savedAnswer.text === text)
                ) {
                    shouldBeChecked = true;
                    break;
                }
            }

            checkbox.checked = shouldBeChecked;

            updateOptionCard(checkbox);
        }
    }

    function updateOptionCard(checkbox) {
        var label = checkbox.closest('label');

        if (!label) {
            return;
        }

        if (checkbox.checked) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    }

    function setupPersonalityListeners() {
        var checkboxes = document.querySelectorAll(
            'input[type="checkbox"].option-checkbox'
        );

        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].addEventListener(
                'change',
                function () {
                    updateOptionCard(this);
                    savePersonalityAnswers();
                }
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * INICIALIZACIÓN
     * ---------------------------------------------------------
     */

    function initialize() {
        restorePersonalityAnswers();
        setupPersonalityListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initialize
        );
    } else {
        initialize();
    }

})();