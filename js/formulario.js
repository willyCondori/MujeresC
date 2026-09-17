/*
 * Creado:  Willy Jonathan Condori Esteban
 * Fecha:   28/08/2026
 * Modulo:  Navegación de cuestionarios y personalidad
 * Descripcion:
 * Persistencia robusta del formulario con soporte para
 * intl-tel-input, selección dinámica de país,
 * departamento/estado/provincia y ciudad mediante
 * la API pública CountriesNow.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // FORMULARIO
    // ==========================================

    const form = document.getElementById('formPerfil');

    if (!form) return;

    const STORAGE_KEY = 'perfilUsuarioBorrador';

    // ==========================================
    // CAMPOS
    // ==========================================

    const whatsappInput =
        document.getElementById('whatsapp');

    const paisInput =
        document.getElementById('pais');

    const departamentoInput =
        document.getElementById('departamento');

    const ciudadInput =
        document.getElementById('ciudad');

    let iti = null;

    // ==========================================
    // API COUNTRIESNOW
    // ==========================================

    const API_URL =
        'https://countriesnow.space/api/v0.1/countries';

    // ==========================================
    // OBTENER VALOR
    // ==========================================

    function obtenerValorCampo(nombre) {

        const campo =
            form.querySelector(
                `[name="${nombre}"], #${nombre}`
            );

        return campo
            ? campo.value
            : '';
    }

    // ==========================================
    // OBTENER BORRADOR
    // ==========================================

    function obtenerBorrador() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                ) || '{}'
            );

        } catch (error) {

            console.error(
                'Error leyendo borrador:',
                error
            );

            return {};
        }
    }

    // ==========================================
    // GUARDAR BORRADOR
    // ==========================================

    function guardarBorrador() {

        const datos = {

            nombre:
                obtenerValorCampo('nombre'),

            correo:
                obtenerValorCampo('correo'),

            whatsapp:
                whatsappInput
                    ? whatsappInput.value
                    : '',

            pais:
                paisInput
                    ? paisInput.value
                    : '',

            departamento:
                departamentoInput
                    ? departamentoInput.value
                    : '',

            ciudad:
                ciudadInput
                    ? ciudadInput.value
                    : '',

            ocupacion:
                obtenerValorCampo('ocupacion')
        };

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(datos)
        );
    }

    // ==========================================
    // REINICIAR DEPARTAMENTO
    // ==========================================

    function reiniciarDepartamento() {

        if (!departamentoInput) return;

        departamentoInput.disabled = true;

        departamentoInput.innerHTML = `
            <option value="" selected disabled hidden>
                Cargando departamentos / estados...
            </option>
        `;
    }

    // ==========================================
    // REINICIAR CIUDAD
    // ==========================================

    function reiniciarCiudad() {

        if (!ciudadInput) return;

        ciudadInput.disabled = true;

        ciudadInput.innerHTML = `
            <option value="" selected disabled hidden>
                Selecciona primero un departamento...
            </option>
        `;
    }

    // ==========================================
    // CARGAR DEPARTAMENTOS
    // ==========================================

    async function cargarDepartamentos(
        nombrePais,
        departamentoGuardado = ''
    ) {

        if (!departamentoInput) return;

        reiniciarDepartamento();
        reiniciarCiudad();

        if (!nombrePais) {

            departamentoInput.innerHTML = `
                <option value="" selected disabled>
                    Selecciona un país primero...
                </option>
            `;

            return;
        }

        try {

            console.log(
                'Cargando departamentos de:',
                nombrePais
            );

            const response =
                await fetch(
                    `${API_URL}/states/q?country=${encodeURIComponent(
                        nombrePais
                    )}`
                );

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const resultado =
                await response.json();

            console.log(
                'Respuesta departamentos:',
                resultado
            );

            departamentoInput.innerHTML = `
                <option value="" selected disabled hidden>
                    Selecciona tu departamento / estado...
                </option>
            `;

            /*
             * CountriesNow devuelve:
             *
             * data: {
             *   name: "Bolivia",
             *   states: [...]
             * }
             */

            if (
                resultado.error ||
                !resultado.data ||
                !Array.isArray(
                    resultado.data.states
                ) ||
                resultado.data.states.length === 0
            ) {

                /*
                 * Si el país no tiene estados,
                 * habilitamos el campo para escribir.
                 */

                departamentoInput.innerHTML = `
                    <option value="">
                        No hay departamentos registrados
                    </option>
                `;

                /*
                 * No dejamos bloqueado el formulario.
                 */

                departamentoInput.disabled = false;

                ciudadInput.innerHTML = `
                    <option value="" selected disabled hidden>
                        Escribe o selecciona tu ciudad...
                    </option>
                `;

                ciudadInput.disabled = false;

                ciudadInput.dataset.manual = 'true';

                return;
            }

            // ==========================================
            // AGREGAR DEPARTAMENTOS
            // ==========================================

            resultado.data.states.forEach(
                (estado) => {

                    if (
                        !estado ||
                        !estado.name
                    ) {
                        return;
                    }

                    const option =
                        document.createElement(
                            'option'
                        );

                    option.value =
                        estado.name;

                    option.textContent =
                        estado.name;

                    departamentoInput.appendChild(
                        option
                    );
                }
            );

            // ==========================================
            // HABILITAR DEPARTAMENTO
            // ==========================================

            departamentoInput.disabled = false;

            // ==========================================
            // RESTAURAR DEPARTAMENTO
            // ==========================================

            if (departamentoGuardado) {

                const existe =
                    Array.from(
                        departamentoInput.options
                    ).some(
                        (option) =>
                            option.value ===
                            departamentoGuardado
                    );

                if (existe) {

                    departamentoInput.value =
                        departamentoGuardado;

                    await cargarCiudades(
                        nombrePais,
                        departamentoGuardado,
                        obtenerValorCampo(
                            'ciudad'
                        )
                    );
                }
            }

        } catch (error) {

            console.error(
                'Error cargando departamentos:',
                error
            );

            /*
             * No bloqueamos el formulario.
             */

            departamentoInput.innerHTML = `
                <option value="">
                    No se pudieron cargar los departamentos
                </option>
            `;

            departamentoInput.disabled = false;

            ciudadInput.innerHTML = `
                <option value="" selected disabled hidden>
                    No se pudieron cargar las ciudades
                </option>
            `;

            ciudadInput.disabled = false;

            ciudadInput.dataset.manual = 'true';
        }
    }

    // ==========================================
    // CARGAR CIUDADES
    // ==========================================

    async function cargarCiudades(
        nombrePais,
        departamento,
        ciudadGuardada = ''
    ) {

        if (!ciudadInput) return;

        if (
            !nombrePais ||
            !departamento
        ) {

            reiniciarCiudad();

            return;
        }

        ciudadInput.disabled = true;

        ciudadInput.innerHTML = `
            <option value="" selected disabled>
                Cargando ciudades...
            </option>
        `;

        ciudadInput.removeAttribute(
            'data-manual'
        );

        try {

            console.log(
                'Cargando ciudades:',
                nombrePais,
                departamento
            );

            const response =
                await fetch(
                    `${API_URL}/state/cities`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            country:
                                nombrePais,

                            state:
                                departamento
                        })
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const resultado =
                await response.json();

            console.log(
                'Respuesta ciudades:',
                resultado
            );

            ciudadInput.innerHTML = `
                <option value="" selected disabled hidden>
                    Selecciona tu ciudad...
                </option>
            `;

            if (
                resultado.error ||
                !Array.isArray(
                    resultado.data
                ) ||
                resultado.data.length === 0
            ) {

                /*
                 * No existen ciudades registradas.
                 */

                ciudadInput.innerHTML = `
                    <option value="" selected disabled>
                        No hay ciudades disponibles
                    </option>
                `;

                /*
                 * Permitimos continuar sin
                 * dejar el select bloqueado.
                 */

                ciudadInput.disabled = false;

                return;
            }

            // ==========================================
            // AGREGAR CIUDADES
            // ==========================================

            resultado.data.forEach(
                (ciudad) => {

                    if (!ciudad) return;

                    const option =
                        document.createElement(
                            'option'
                        );

                    option.value =
                        ciudad;

                    option.textContent =
                        ciudad;

                    ciudadInput.appendChild(
                        option
                    );
                }
            );

            // ==========================================
            // HABILITAR CIUDAD
            // ==========================================

            ciudadInput.disabled = false;

            // ==========================================
            // RESTAURAR CIUDAD
            // ==========================================

            if (ciudadGuardada) {

                const existe =
                    Array.from(
                        ciudadInput.options
                    ).some(
                        (option) =>
                            option.value ===
                            ciudadGuardada
                    );

                if (existe) {

                    ciudadInput.value =
                        ciudadGuardada;
                }
            }

        } catch (error) {

            console.error(
                'Error cargando ciudades:',
                error
            );

            /*
             * Si CountriesNow falla,
             * no bloqueamos al usuario.
             */

            ciudadInput.innerHTML = `
                <option value="">
                    No se pudieron cargar las ciudades
                </option>
            `;

            ciudadInput.disabled = false;

            ciudadInput.dataset.manual = 'true';
        }
    }

    // ==========================================
    // CAMBIO DE DEPARTAMENTO
    // ==========================================

    if (departamentoInput) {

        departamentoInput.addEventListener(
            'change',
            async () => {

                const pais =
                    paisInput
                        ? paisInput.value
                        : '';

                const departamento =
                    departamentoInput.value;

                if (
                    !pais ||
                    !departamento
                ) {
                    return;
                }

                await cargarCiudades(
                    obtenerNombrePaisSeleccionado(),
                    departamento
                );

                guardarBorrador();
            }
        );
    }

    // ==========================================
    // OBTENER NOMBRE DEL PAÍS SELECCIONADO
    // ==========================================

    function obtenerNombrePaisSeleccionado() {

        if (!iti) return '';

        const countryData =
            iti.getSelectedCountryData();

        /*
         * intl-tel-input proporciona el nombre
         * del país junto con ISO2.
         */

        if (
            countryData &&
            countryData.name
        ) {

            return countryData.name;
        }

        return '';
    }

    // ==========================================
    // CAMBIO DE PAÍS
    // ==========================================

    async function actualizarPais() {

        if (!iti) return;

        const countryData =
            iti.getSelectedCountryData();

        if (
            !countryData ||
            !countryData.iso2
        ) {
            return;
        }

        const codigoPais =
            countryData.iso2.toUpperCase();

        /*
         * Nombre que usaremos con CountriesNow.
         */

        const nombrePais =
            countryData.name || '';

        console.log(
            'País seleccionado:',
            nombrePais,
            codigoPais
        );

        // ==========================================
        // GUARDAR ISO2
        // ==========================================

        if (paisInput) {

            paisInput.value =
                codigoPais;
        }

        // ==========================================
        // REINICIAR UBICACIÓN
        // ==========================================

        reiniciarDepartamento();
        reiniciarCiudad();

        // ==========================================
        // CARGAR DEPARTAMENTOS
        // ==========================================

        if (nombrePais) {

            await cargarDepartamentos(
                nombrePais
            );
        }

        // ==========================================
        // GUARDAR
        // ==========================================

        guardarBorrador();
    }

    // ==========================================
    // INICIALIZAR INTL-TEL-INPUT
    // ==========================================

    if (
        whatsappInput &&
        window.intlTelInput
    ) {

        const datos =
            obtenerBorrador();

        iti =
            window.intlTelInput(
                whatsappInput,
                {

                    initialCountry:
                        datos.pais
                            ? datos.pais.toLowerCase()
                            : 'auto',

                    geoIpLookup:
                        function (success) {

                            fetch(
                                'https://ipapi.co/json/'
                            )
                                .then(
                                    (response) =>
                                        response.json()
                                )
                                .then(
                                    (data) => {

                                        if (
                                            data &&
                                            data.country_code
                                        ) {

                                            success(
                                                data.country_code
                                            );

                                        } else {

                                            success(
                                                'BO'
                                            );
                                        }
                                    }
                                )
                                .catch(
                                    () => {
                                        success(
                                            'BO'
                                        );
                                    }
                                );
                        },

                    preferredCountries: [
                        'bo',
                        'ar',
                        'cl',
                        'co',
                        'mx',
                        'pe',
                        'es',
                        'us'
                    ],

                    utilsScript:
                        'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
                }
            );

        // ==========================================
        // CAMBIO DE PAÍS
        // ==========================================

        whatsappInput.addEventListener(
            'countrychange',
            actualizarPais
        );
    }

    // ==========================================
    // RESTAURAR BORRADOR
    // ==========================================

    async function restaurarBorrador() {

        const datos =
            obtenerBorrador();

        if (!datos) return;

        try {

            // ==========================================
            // CAMPOS NORMALES
            // ==========================================

            [
                'nombre',
                'correo',
                'ocupacion'
            ].forEach(
                (nombre) => {

                    const campo =
                        form.querySelector(
                            `[name="${nombre}"]`
                        );

                    if (
                        campo &&
                        datos[nombre]
                    ) {

                        campo.value =
                            datos[nombre];
                    }
                }
            );

            // ==========================================
            // WHATSAPP
            // ==========================================

            if (
                datos.whatsapp &&
                iti
            ) {

                iti.setNumber(
                    datos.whatsapp
                );
            }

            // ==========================================
            // PAÍS
            // ==========================================

            if (
                datos.pais &&
                iti
            ) {

                iti.setCountry(
                    datos.pais.toLowerCase()
                );

                if (paisInput) {

                    paisInput.value =
                        datos.pais.toUpperCase();
                }

                /*
                 * Obtener el nombre real del país
                 * desde intl-tel-input.
                 */

                const nombrePais =
                    obtenerNombrePaisSeleccionado();

                if (nombrePais) {

                    await cargarDepartamentos(
                        nombrePais,
                        datos.departamento || ''
                    );
                }
            }

        } catch (error) {

            console.error(
                'Error restaurando formulario:',
                error
            );
        }
    }

    // ==========================================
    // INICIAR RESTAURACIÓN
    // ==========================================

    restaurarBorrador();

    // ==========================================
    // GUARDAR AUTOMÁTICAMENTE
    // ==========================================

    form.addEventListener(
        'input',
        guardarBorrador
    );

    form.addEventListener(
        'change',
        guardarBorrador
    );

    // ==========================================
    // MENSAJES DE ERROR
    // ==========================================

    const mensajesError = {

        nombre:
            'Este campo es obligatorio.',

        correo:
            'Ingresa un correo electrónico válido.',

        whatsapp:
            'Ingresa un número de WhatsApp válido.',

        pais:
            'Selecciona tu país.',

        departamento:
            'Selecciona tu departamento / estado.',

        ciudad:
            'Selecciona tu ciudad.',

        ocupacion:
            'Selecciona una ocupación.'
    };

    // ==========================================
    // MOSTRAR ERROR
    // ==========================================

    function mostrarError(campo) {

        const contenedor =
            campo.closest('.form-field');

        if (!contenedor) return;

        contenedor.classList.add(
            'has-error'
        );

        if (
            contenedor.querySelector(
                '.field-error'
            )
        ) {
            return;
        }

        const span =
            document.createElement(
                'span'
            );

        span.className =
            'field-error';

        span.textContent =
            mensajesError[
                campo.name
            ] ||
            mensajesError[
                campo.id
            ] ||
            'Este campo es obligatorio.';

        contenedor.appendChild(
            span
        );
    }

    // ==========================================
    // QUITAR ERROR
    // ==========================================

    function quitarError(campo) {

        const contenedor =
            campo.closest('.form-field');

        if (!contenedor) return;

        contenedor.classList.remove(
            'has-error'
        );

        const error =
            contenedor.querySelector(
                '.field-error'
            );

        if (error) {
            error.remove();
        }
    }

    // ==========================================
    // VALIDAR
    // ==========================================

    function validarCampo(campo) {

        if (
            !campo.hasAttribute(
                'required'
            )
        ) {
            return true;
        }

        /*
         * Departamento y ciudad deben estar
         * habilitados y tener un valor.
         */

        if (
            campo.id === 'departamento' ||
            campo.id === 'ciudad'
        ) {

            if (
                campo.disabled ||
                !campo.value.trim()
            ) {

                mostrarError(campo);

                return false;
            }
        }

        // ==========================================
        // WHATSAPP
        // ==========================================

        if (
            (
                campo.id === 'whatsapp' ||
                campo.name === 'whatsapp'
            ) &&
            iti
        ) {

            if (
                !iti.isValidNumber()
            ) {

                mostrarError(campo);

                return false;
            }
        }

        // ==========================================
        // VACÍO
        // ==========================================

        if (
            !campo.value.trim()
        ) {

            mostrarError(campo);

            return false;
        }

        // ==========================================
        // VALIDACIÓN HTML
        // ==========================================

        if (
            !campo.checkValidity()
        ) {

            mostrarError(campo);

            return false;
        }

        quitarError(campo);

        return true;
    }

    // ==========================================
    // PAGESHOW
    // ==========================================

    window.addEventListener(
        'pageshow',
        async () => {

            await restaurarBorrador();

            form.querySelectorAll(
                'input, select'
            ).forEach(
                (campo) => {
                    quitarError(campo);
                }
            );
        }
    );

    // ==========================================
    // ENVÍO
    // ==========================================

    form.addEventListener(
        'submit',
        (e) => {

            e.preventDefault();

            const campos =
                form.querySelectorAll(
                    'input, select'
                );

            let formularioValido =
                true;

            let primerError = null;

            campos.forEach(
                (campo) => {

                    if (
                        !campo.hasAttribute(
                            'required'
                        )
                    ) {
                        return;
                    }

                    const valido =
                        validarCampo(campo);

                    if (!valido) {

                        formularioValido =
                            false;

                        if (
                            !primerError
                        ) {

                            primerError =
                                campo;
                        }
                    }
                }
            );

            if (!formularioValido) {

                primerError?.focus();

                return;
            }

            // ==========================================
            // DATOS FINALES
            // ==========================================

            const datosFormulario = {

                nombre:
                    obtenerValorCampo(
                        'nombre'
                    ),

                correo:
                    obtenerValorCampo(
                        'correo'
                    ),

                whatsapp:
                    iti
                        ? iti.getNumber()
                        : obtenerValorCampo(
                            'whatsapp'
                        ),

                pais:
                    paisInput
                        ? paisInput.value
                        : '',

                departamento:
                    departamentoInput
                        ? departamentoInput.value
                        : '',

                ciudad:
                    ciudadInput
                        ? ciudadInput.value
                        : '',

                ocupacion:
                    obtenerValorCampo(
                        'ocupacion'
                    )
            };

            // ==========================================
            // GUARDAR
            // ==========================================

            localStorage.setItem(
                'perfilUsuario',
                JSON.stringify(
                    datosFormulario
                )
            );

            guardarBorrador();

            // ==========================================
            // CONTINUAR
            // ==========================================

            window.location.href =
                'personalidad17.html';
        }
    );

});
