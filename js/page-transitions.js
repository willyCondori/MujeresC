(function () {
    'use strict';

    var STORAGE_KEY = 'pageTransitionType';
    var DEFAULT_TRANSITION = 'left';

    function prefersReducedMotion() {
        return window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function getTransitionType() {
        var type = DEFAULT_TRANSITION;

        try {
            var stored = sessionStorage.getItem(STORAGE_KEY);

            if (stored === 'left' || stored === 'up') {
                type = stored;
            }

            sessionStorage.removeItem(STORAGE_KEY);
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
            sessionStorage.setItem(STORAGE_KEY, type);
        } catch (error) {}

        window.location.href = anchor.href;
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
            type = DEFAULT_TRANSITION;
        }

        event.preventDefault();

        navigate(anchor, type);
    }

    applyPageAnimation();

    document.addEventListener(
        'click',
        handleClick,
        true
    );

})();