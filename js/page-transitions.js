/**
 * page-transitions.js
 * -------------------------------------------------------------
 * Simula transiciones tipo "app" entre páginas HTML separadas.
 *
 * Uso:
 *   1) Incluir este script en TODAS las páginas, justo antes de
 *      </body> (o con `defer`):
 *        <script src="js/page-transitions.js" defer></script>
 *        <script src="../js/page-transitions.js" defer></script>  (subcarpetas)
 *
 *   2) Por defecto, todo link interno hace la transición "left"
 *      (la página actual se va a la izquierda, la siguiente
 *      entra desde la derecha).
 *
 *   3) Para la transición especial "up" (ej. Bienvenida -> Edad),
 *      agregar el atributo data-transition="up" al <a>:
 *        <a href="pages/edad.html" class="btn-primary" data-transition="up">
 *
 *   4) Para excluir un link puntual de la transición (por ejemplo
 *      un link externo o que abre en pestaña nueva), no hace
 *      falta hacer nada: los links externos, con target="_blank",
 *      con "#" o con data-no-transition se ignoran solos.
 *
 * Nota sobre el "flash" de la página anterior:
 * navegamos recién cuando el navegador confirma con el evento
 * `animationend` que la animación de salida terminó de verdad,
 * en vez de esperar un `setTimeout` con una duración fija que
 * puede desincronizarse con lo que se está pintando en pantalla.
 * -------------------------------------------------------------
 */

(function () {
    var STORAGE_KEY = 'pageTransitionType';
    var DEFAULT_TRANSITION = 'left';
    var DURATION = { up: 450, left: 400 };
    var FALLBACK_BUFFER = 250; // margen extra por si animationend no dispara

    function prefersReducedMotion() {
        return window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function isLocalPageLink(anchor) {
        if (!anchor || !anchor.getAttribute) return false;

        var href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return false;
        if (anchor.target === '_blank') return false;
        if (anchor.hasAttribute('data-no-transition')) return false;
        if (anchor.origin !== window.location.origin) return false;

        return true;
    }

    function clearTransitionClasses() {
        document.body.classList.remove(
            'page-exit-up',
            'page-exit-left',
            'page-enter-up',
            'page-enter-left'
        );
    }

    // Si esta página se abrió como destino de una transición,
    // reproduce la animación de entrada correspondiente.
    function playEnterAnimation() {
        var type = sessionStorage.getItem(STORAGE_KEY);
        if (!type) return;

        sessionStorage.removeItem(STORAGE_KEY);
        if (prefersReducedMotion()) return;

        var enterClass = 'page-enter-' + type;
        document.body.classList.add(enterClass);

        document.body.addEventListener('animationend', function handler() {
            document.body.classList.remove(enterClass);
            document.body.removeEventListener('animationend', handler);
        });
    }

    // Intercepta clicks en links internos: espera a que la animación
    // de salida TERMINE DE VERDAD (animationend) antes de navegar,
    // para no navegar a mitad de camino y dejar ver la página vieja.
    function handleClick(e) {
        var anchor = e.target.closest('a');
        if (!isLocalPageLink(anchor)) return;

        e.preventDefault();

        var type = anchor.getAttribute('data-transition') || DEFAULT_TRANSITION;
        var destination = anchor.href;

        sessionStorage.setItem(STORAGE_KEY, type);

        var navigated = false;
        function goToDestination() {
            if (navigated) return;
            navigated = true;
            window.location.href = destination;
        }

        // Sin animación (reduced motion): navegar directo, no hay nada
        // que esperar y animationend nunca dispararía.
        if (prefersReducedMotion()) {
            goToDestination();
            return;
        }

        var exitClass = 'page-exit-' + type;
        document.body.classList.add(exitClass);

        document.body.addEventListener('animationend', function handler() {
            document.body.removeEventListener('animationend', handler);
            goToDestination();
        });

        // Red de seguridad: si por lo que sea animationend no dispara
        // (ej. la pestaña pasó a segundo plano y el navegador pausó la
        // animación), navegamos igual pasado un margen generoso.
        window.setTimeout(goToDestination, (DURATION[type] || DURATION.left) + FALLBACK_BUFFER);
    }

    // Si el navegador restaura la página desde bfcache (botón
    // atrás/adelante), evita que quede invisible a mitad de una
    // animación de salida y vuelve a mostrar la entrada.
    window.addEventListener('pageshow', function (e) {
        clearTransitionClasses();
        if (e.persisted) {
            playEnterAnimation();
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        playEnterAnimation();
        document.addEventListener('click', handleClick);
    });
})();