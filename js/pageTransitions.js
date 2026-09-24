/*A
    Creado: Willy Condori
    Fecha: 26/08/2026
    Módulo: Transiciones de páginas
    Descripción: En este archivo se gestionan las transiciones de navegación entre las páginas del sistema.
*/
(function () {
    'use strict';

    var storageKey = 'pageTransitionType';
    var defaultTransition = 'left';

    function prefersReducedMotion() {
        return window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function getTransitionType() {
        var type = defaultTransition;

        try {
            var stored = sessionStorage.getItem(storageKey);

            if (stored === 'left' || stored === 'up') {
                type = stored;
            }

            sessionStorage.removeItem(storageKey);
        } catch (error) {}

        return type;
    }

    function applyPageAnimation() {
        var body = document.body;

        if (!body) {
            return;
        }

        if (!body.classList.contains('page-container')) {
            return;
        }

        if (prefersReducedMotion()) {
            return;
        }

        var type = getTransitionType();

        body.classList.remove(
            'page-enter-left',
            'page-enter-up'
        );

        void body.offsetWidth;

        body.classList.add(
            type === 'up'
                ? 'page-enter-up'
                : 'page-enter-left'
        );
    }

    function isLocalPageLink(anchor) {
        if (!anchor) {
            return false;
        }

        var href = anchor.getAttribute('href');

        if (!href || href.charAt(0) === '#') {
            return false;
        }

        if (anchor.target === '_blank') {
            return false;
        }

        if (anchor.hasAttribute('data-no-transition')) {
            return false;
        }

        try {
            var url = new URL(href, window.location.href);

            if (url.origin !== window.location.origin) {
                return false;
            }
        } catch (error) {
            return false;
        }

        return true;
    }

    function navigate(anchor, type) {
        try {
            sessionStorage.setItem(storageKey, type);
        } catch (error) {}

        var targetHref = anchor.href;

        // En "reduce motion" (o si algo falla) navegamos directo, sin animar.
        if (prefersReducedMotion()) {
            window.location.href = targetHref;
            return;
        }

        var body = document.body;

        if (!body || !body.classList.contains('page-container')) {
            window.location.href = targetHref;
            return;
        }

        var exitClass = type === 'up' ? 'page-exit-up' : 'page-exit-left';
        var fallbackDelay = 260; // red de seguridad si 'animationend' no dispara
        var hasNavigated = false;

        function go() {
            if (hasNavigated) {
                return;
            }

            hasNavigated = true;
            window.location.href = targetHref;
        }

        body.classList.add(exitClass);
        body.addEventListener('animationend', go, { once: true });
        window.setTimeout(go, fallbackDelay);
    }

    function handleClick(event) {
        if (event.defaultPrevented) {
            return;
        }

        if (event.button !== 0) {
            return;
        }

        if (
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        var anchor = event.target.closest('a');

        if (!isLocalPageLink(anchor)) {
            return;
        }

        var type = anchor.getAttribute('data-transition');

        if (type !== 'left' && type !== 'up') {
            type = defaultTransition;
        }

        event.preventDefault();

        navigate(anchor, type);
    }

    function enableTouchActiveStates() {
        // Safari en iOS solo aplica :active cuando hay un listener de
        // touchstart en el documento. Sin esto, el feedback al presionar
        // botones/tarjetas (transform: scale...) no se ve en iPhone.
        document.addEventListener('touchstart', function () {}, { passive: true });
    }

    applyPageAnimation();
    enableTouchActiveStates();

    document.addEventListener(
        'click',
        handleClick,
        true
    );

})();