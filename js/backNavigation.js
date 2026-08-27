/*
    Creado: Willy Condori
    Fecha: 27/08/2026
    Módulo: Navegación de cuestionarios y personalidad
    Descripción: Permite regresar a la página anterior y conservar las respuestas seleccionadas.
*/

(function () {
    'use strict';

    var personalityStorageKey = 'personalityAnswers';

    function getCurrentPage() {
        var path = window.location.pathname;
        var fileName = path.substring(path.lastIndexOf('/') + 1);

        return fileName.toLowerCase();
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

    function savePersonalityAnswers() {
        var page = getCurrentPage();

        if (page.indexOf('personalidad') !== 0) {
            return;
        }

        var checkboxes = document.querySelectorAll(
            '.option-checkbox'
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
                // Verificamos si existe el atributo 'value' explícitamente en el HTML
                var rawValue = checkboxes[i].getAttribute('value');

                pageAnswers.push({
                    value: rawValue !== null ? rawValue : '',
                    text: getOptionText(checkboxes[i]),
                    index: i // Guardamos el índice como método de respaldo adicional
                });
            }
        }

        answers[page] = pageAnswers;

        saveStorage(
            personalityStorageKey,
            answers
        );
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

        if (!pageAnswers || !pageAnswers.length) {
            return;
        }

        var checkboxes = document.querySelectorAll(
            '.option-checkbox'
        );

        for (var i = 0; i < checkboxes.length; i++) {
            var checkbox = checkboxes[i];
            
            // Leemos el atributo directamente para evitar el valor 'on' por defecto
            var rawValue = checkbox.getAttribute('value');
            var text = getOptionText(checkbox);

            var shouldBeChecked = false;

            for (var j = 0; j < pageAnswers.length; j++) {
                var savedAnswer = pageAnswers[j];

                // 1. Compara por atributo value si existe
                // 2. Compara por texto si coincide
                // 3. Compara por índice de posición si el texto falla
                if (
                    (rawValue !== null && rawValue !== '' && savedAnswer.value === rawValue) ||
                    (savedAnswer.text && savedAnswer.text === text) ||
                    (savedAnswer.index === i)
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
            '.option-checkbox'
        );

        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].addEventListener(
                'change',
                function () {
                    if (this.type === 'radio' && this.name) {
                        var group = document.querySelectorAll(
                            'input[type="radio"][name="' +
                            this.name +
                            '"]'
                        );

                        for (var g = 0; g < group.length; g++) {
                            updateOptionCard(group[g]);
                        }
                    } else {
                        updateOptionCard(this);
                    }

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