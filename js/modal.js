
document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       ELEMENTOS PRINCIPALES
    ===================================================== */

    const modal =
        document.getElementById('modalPago');

    const btnAbrir1 =
        document.getElementById('btnAbrirModal');

    const btnAbrir2 =
        document.getElementById('btnAbrirModalInferior');

    const btnCerrar =
        document.getElementById('btnCerrarModal');

    const modalPriceOld =
        document.getElementById('modalPriceOld');

    const modalPriceNew =
        document.getElementById('modalPriceNew');

    const btnPayFinal =
        document.getElementById('btnPayFinal');


    /* =====================================================
       CONTENEDORES DE PAGO
    ===================================================== */

    const paymentBolivia =
        document.getElementById('paymentBolivia');
    const paymentOptionsBolivia =
        paymentBolivia.querySelectorAll(
            '.payment-option'
        );
    const paymentOtro =
        document.getElementById('paymentOtro');


    /* =====================================================
       ACTUALIZAR PRECIOS
    ===================================================== */

    function actualizarPreciosModal() {

        const planSeleccionado =
            document.querySelector(
                'input[name="plan_selection"]:checked'
            );

        if (!planSeleccionado) {
            return;
        }

        modalPriceOld.textContent =
            planSeleccionado.dataset.priceOld;

        modalPriceNew.textContent =
            planSeleccionado.dataset.priceNew;

    }


    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    function abrirModal(e) {

        e.preventDefault();

        actualizarPreciosModal();

        modal.classList.add('is-open');

    }


    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    function cerrarModal() {

        modal.classList.remove('is-open');

    }


    btnAbrir1?.addEventListener(
        'click',
        abrirModal
    );

    btnAbrir2?.addEventListener(
        'click',
        abrirModal
    );

    btnCerrar?.addEventListener(
        'click',
        cerrarModal
    );


    /* =====================================================
       CERRAR AL HACER CLICK FUERA
    ===================================================== */

    window.addEventListener(
        'click',
        function (e) {

            if (e.target === modal) {

                cerrarModal();

            }

        }
    );


    /* =====================================================
       MÉTODOS DE PAGO DE OTROS PAÍSES
    ===================================================== */

    const paymentOptionsOtro =
        paymentOtro.querySelectorAll(
            '.payment-option'
        );

    paymentOptionsOtro.forEach(
        option => {

            option.addEventListener(
                'click',
                () => {
                    paymentOptionsOtro.forEach(
                        opt => {

                            opt.classList.remove(
                                'payment-option--selected'
                            );
                        }
                    );

                    option.classList.add(
                        'payment-option--selected'
                    );
                    const metodo =
                        option.dataset.method;
                    if (metodo === 'card') {

                        btnPayFinal.textContent =
                            'Pagar con Tarjeta';
                    } else {
                        btnPayFinal.textContent =
                            'Pagar con PayPal';
                    }
                }
            );
        }
    );

    /* =====================================================
       MÉTODO QR - BOLIVIA
    ===================================================== */
    paymentOptionsBolivia.forEach(
        option => {
            option.addEventListener(
                'click',
                () => {
                    /* Quitar selección anterior */
                    paymentOptionsBolivia.forEach(
                        opt => {
                            opt.classList.remove(
                                'payment-option--selected'
                            );
                        }
                    );

                    /* Seleccionar opción actual */
                    option.classList.add(
                        'payment-option--selected'
                    );

                    const metodo =
                        option.dataset.method;

                    /* Cambiar botón */
                    if (metodo === 'transferencia') {

                        btnPayFinal.textContent =
                            'Continuar con transferencia';

                    } else {

                        btnPayFinal.textContent =
                            'Continuar con pago QR';
                    }
                }
            );
        }
    );

    /* =====================================================
       SELECCIÓN DE PAÍS
    ===================================================== */

    const countryOptions =
        document.querySelectorAll(
            'input[name="payment_country"]'
        );

    const countryCards =
        document.querySelectorAll(
            '.country-option'
        );

    countryOptions.forEach(
        option => {
            option.addEventListener(
                'change',
                () => {

                    /* -------------------------------------
                       ACTUALIZAR ESTILO DEL PAÍS
                    ------------------------------------- */

                    countryCards.forEach(
                        card => {

                            card.classList.remove(
                                'country-option--selected'
                            );

                        }
                    );

                    option.closest(
                        '.country-option'
                    )?.classList.add(
                        'country-option--selected'
                    );

                    /* =====================================
                       BOLIVIA
                    ===================================== */

                    if (option.value === 'bolivia') {

                        paymentBolivia.style.display =
                            'block';

                        paymentOtro.style.display =
                            'none';


                        btnPayFinal.textContent =
                            'Continuar con pago QR';

                    }

                    /* =====================================
                       OTRO PAÍS
                    ===================================== */

                    else {
                        paymentBolivia.style.display =
                            'none';
                        paymentOtro.style.display =
                            'block';
                        /*
                         * Cada vez que se cambia a
                         * otro país, PayPal vuelve
                         * a ser la opción inicial.
                         */
                        paymentOptionsOtro.forEach(
                            opt => {

                                opt.classList.remove(
                                    'payment-option--selected'
                                );

                            }
                        );

                        const paypal =
                            paymentOtro.querySelector(
                                '[data-method="paypal"]'
                            );

                        paypal?.classList.add(
                            'payment-option--selected'
                        );

                        btnPayFinal.textContent =
                            'Pagar con PayPal';
                    }
                }
            );
        }
    );
    /* =====================================================
       GUARDAR PLAN SELECCIONADO
    ===================================================== */
    const planes =
        document.querySelectorAll(
            'input[name="plan_selection"]'
        );

    planes.forEach(
        plan => {

            plan.addEventListener(
                'change',
                () => {
                    /*
                     * Actualizamos el precio
                     * inmediatamente.
                     */
                    actualizarPreciosModal();
                }
            );
        }
    );
});