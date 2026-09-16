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

    console.log(`[quizNavigation] Encontrados ${radios.length} radios y ${checkboxes.length} checkboxes.`);

    // Selección única: avanzar automáticamente
    if (radios.length) {
        optionsList.addEventListener('change', (e) => {
            if (e.target.matches('input[type="radio"]') && e.target.checked) {
                console.log('[quizNavigation] Radio seleccionado, avanzando...');
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
            console.log('[quizNavigation] Bloqueado: sin selección.');
            e.preventDefault();
            e.stopPropagation();
        }
    });
});