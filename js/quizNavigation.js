// js/quizNavigation.js
document.addEventListener('DOMContentLoaded', () => {
    const optionsList = document.querySelector('.options-list');
    const btnSiguiente = document.querySelector('.form-footer .btn-primary');

    if (!optionsList || !btnSiguiente) {
        console.warn('[quizNavigation] No se encontró .options-list o .btn-primary en esta página.');
        return;
    }

    const radios = optionsList.querySelectorAll('input[type="radio"]');
    const checkboxes = optionsList.querySelectorAll('input[type="checkbox"]');
    const inputs = radios.length ? radios : checkboxes;

    // Selección única: avanzar automáticamente (incluso si se reselecciona la misma opción)
    if (radios.length) {
        optionsList.addEventListener('click', (e) => {
            const radio = e.target.closest('input[type="radio"]');
            if (radio && radio.checked) {
                btnSiguiente.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
            }
        });
    }

    // Bloquear avance sin selección (aplica a radios y checkboxes)
    btnSiguiente.addEventListener('click', (e) => {
        const haySeleccion = Array.from(inputs).some(input => input.checked);
        if (!haySeleccion) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
});