/*
 * Creado:  Willy Jonathan Condori Esteban
 * Fecha:   28/08/2026
 * Modulo:  Navegación de cuestionarios y personalidad
 * Descripcion:
 * Persistencia robusta del formulario con soporte para
 * intl-tel-input y Select2 (combos con buscador) para país,
 * departamento/estado/provincia, ciudad y ocupación.
 * Los datos de ubicación vienen de la API pública CountriesNow.
 * El país del select y la bandera del teléfono se sincronizan.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // FORMULARIO Y DEPENDENCIAS
    // ==========================================

    const form = document.getElementById('formPerfil');
    if (!form) return;

    const $ = window.jQuery;

    if (!$ || !$.fn || !$.fn.select2) {
        console.error('jQuery / Select2 no están cargados. Revisa el <head> del HTML.');
        return;
    }

    const STORAGE_KEY = 'perfilUsuarioBorrador';
    const API_URL = 'https://countriesnow.space/api/v0.1/countries';

    // ==========================================
    // CAMPOS
    // ==========================================

    const whatsappInput = document.getElementById('whatsapp');

    const $pais = $('#pais');
    const $departamento = $('#departamento');
    const $ciudad = $('#ciudad');
    const $ocupacion = $('#ocupacion');

    let iti = null;

    // Evita guardar el borrador mientras se está restaurando
    let restaurando = false;

    // Tokens para descartar respuestas viejas de la API
    let tokenDepartamentos = 0;
    let tokenCiudades = 0;

    // ==========================================
    // HELPERS GENERALES
    // ==========================================

    function obtenerValorCampo(nombre) {
        const campo = form.querySelector(`[name="${nombre}"]`);
        return campo ? campo.value : '';
    }

    function obtenerBorrador() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (error) {
            console.error('Error leyendo borrador:', error);
            return {};
        }
    }

    function guardarBorrador() {
        if (restaurando) return;

        const datos = {
            nombre: obtenerValorCampo('nombre'),
            correo: obtenerValorCampo('correo'),
            whatsapp: whatsappInput ? whatsappInput.value : '',
            pais: $pais.val() || '',
            departamento: $departamento.val() || '',
            ciudad: $ciudad.val() || '',
            ocupacion: $ocupacion.val() || ''
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        } catch (error) {
            console.error('No se pudo guardar el borrador:', error);
        }
    }

    // ==========================================
    // SELECT2: HELPERS
    // ==========================================

    function crearTag(params) {
        const texto = $.trim(params.term);
        if (!texto) return null;
        return { id: texto, text: texto, newTag: true };
    }

    /*
     * Inicializa (o re-inicializa) Select2 sobre un select.
     * Requiere que el select tenga una primera <option></option> vacía.
     */
    function iniciarSelect2($select, placeholder, opciones = {}) {
        if ($select.hasClass('select2-hidden-accessible')) {
            $select.select2('destroy');
        }

        $select.select2(Object.assign({
            width: '100%',
            language: 'es',
            placeholder: placeholder,
            minimumResultsForSearch: 0   // el buscador se muestra siempre
        }, opciones));
    }

    /*
     * Rellena un select y lo re-inicializa con su placeholder.
     * items: [{ value, text }]
     */
    function poblarSelect($select, { placeholder, items = [], deshabilitado = false, manual = false }) {
        $select.empty().append(new Option('', '', true, true));

        items.forEach((item) => {
            $select.append(new Option(item.text, item.value));
        });

        if (manual) {
            $select.attr('data-manual', 'true');
        } else {
            $select.removeAttr('data-manual');
        }

        $select.prop('disabled', deshabilitado);
        $select.val('');

        iniciarSelect2(
            $select,
            placeholder,
            manual ? { tags: true, createTag: crearTag } : {}
        );
    }

    /*
     * Asigna un valor al select (solo refresca la UI, no dispara handlers).
     * Si permitirNuevo es true y el valor no existe, lo agrega.
     */
    function asignarValor($select, valor, permitirNuevo = false) {
        if (!valor) return false;

        const existe = $select.find('option').toArray().some((o) => o.value === valor);

        if (!existe) {
            if (!permitirNuevo) return false;
            $select.append(new Option(valor, valor));
        }

        $select.val(valor).trigger('change.select2');
        return true;
    }

    // Fix: con jQuery >= 3.6 Select2 4.0.13 no enfoca el buscador al abrir
    $(document).on('select2:open', () => {
        const buscador = document.querySelector(
            '.select2-container--open .select2-search__field'
        );
        if (buscador) buscador.focus();
    });

    // ==========================================
    // PAÍSES (desde los datos de intl-tel-input)
    // ==========================================

    const nombreApiPorIso = {};   // ISO2 (mayúscula) -> nombre en inglés para CountriesNow

    const traductorRegiones =
        (typeof Intl !== 'undefined' && Intl.DisplayNames)
            ? new Intl.DisplayNames(['es'], { type: 'region' })
            : null;

    function limpiarNombre(nombre) {
        // Quita nombres locales tipo "Afghanistan (افغانستان)" si vinieran en los datos
        return String(nombre)
            .replace(/\s*\([^)]*[^\x00-\x7F][^)]*\)\s*$/, '')
            .trim();
    }

    function nombreEnEspanol(iso2, respaldo) {
        try {
            return (traductorRegiones && traductorRegiones.of(iso2.toUpperCase())) || respaldo;
        } catch (e) {
            return respaldo;
        }
    }

    const datosPaises = window.intlTelInputGlobals
        ? window.intlTelInputGlobals.getCountryData()
        : [];

    const listaPaises = datosPaises
        .map((pais) => {
            const iso = pais.iso2.toUpperCase();
            const nombreApi = limpiarNombre(pais.name);
            nombreApiPorIso[iso] = nombreApi;

            return { value: iso, text: nombreEnEspanol(iso, nombreApi) };
        })
        .sort((a, b) => a.text.localeCompare(b.text, 'es'));

    // ==========================================
    // ESTADO INICIAL DE LOS COMBOS
    // ==========================================

    poblarSelect($pais, {
        placeholder: 'Selecciona tu país...',
        items: listaPaises
    });

    poblarSelect($departamento, {
        placeholder: 'Selecciona un país primero...',
        deshabilitado: true
    });

    poblarSelect($ciudad, {
        placeholder: 'Selecciona primero un departamento...',
        deshabilitado: true
    });

    iniciarSelect2($ocupacion, 'Selecciona tu ocupación...');

    // ==========================================
    // MODO MANUAL (si la API no tiene datos o falla)
    // ==========================================

    function activarCiudadManual(ciudadGuardada = '') {
        poblarSelect($ciudad, {
            placeholder: 'Escribe tu ciudad...',
            manual: true
        });

        if (ciudadGuardada) {
            asignarValor($ciudad, ciudadGuardada, true);
        }
    }

    function activarModoManual(guardados = {}) {
        poblarSelect($departamento, {
            placeholder: 'Escribe tu departamento / estado...',
            manual: true
        });

        if (guardados.departamento) {
            asignarValor($departamento, guardados.departamento, true);
        }

        activarCiudadManual(guardados.ciudad || '');
    }

    // ==========================================
    // CARGAR DEPARTAMENTOS
    // ==========================================

    async function cargarDepartamentos(iso, guardados = {}) {

        const miToken = ++tokenDepartamentos;
        tokenCiudades++;   // invalida cualquier carga de ciudades en curso

        if (!iso) {
            poblarSelect($departamento, {
                placeholder: 'Selecciona un país primero...',
                deshabilitado: true
            });
            poblarSelect($ciudad, {
                placeholder: 'Selecciona primero un departamento...',
                deshabilitado: true
            });
            return;
        }

        poblarSelect($departamento, {
            placeholder: 'Cargando departamentos / estados...',
            deshabilitado: true
        });
        poblarSelect($ciudad, {
            placeholder: 'Selecciona primero un departamento...',
            deshabilitado: true
        });

        const nombrePais = nombreApiPorIso[iso];

        try {

            const response = await fetch(
                `${API_URL}/states/q?country=${encodeURIComponent(nombrePais)}`
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const resultado = await response.json();

            if (miToken !== tokenDepartamentos) return;   // respuesta vieja

            const estados = resultado && resultado.data && resultado.data.states;

            if (resultado.error || !Array.isArray(estados) || estados.length === 0) {
                activarModoManual(guardados);
                return;
            }

            const items = estados
                .filter((estado) => estado && estado.name)
                .map((estado) => ({ value: estado.name, text: estado.name }));

            poblarSelect($departamento, {
                placeholder: 'Selecciona tu departamento / estado...',
                items
            });

            // Restaurar departamento (y su ciudad) guardados
            if (guardados.departamento && asignarValor($departamento, guardados.departamento)) {
                await cargarCiudades(iso, guardados.departamento, guardados.ciudad || '');
            }

        } catch (error) {

            console.error('Error cargando departamentos:', error);

            if (miToken !== tokenDepartamentos) return;

            activarModoManual(guardados);
        }
    }

    // ==========================================
    // CARGAR CIUDADES
    // ==========================================

    async function cargarCiudades(iso, departamento, ciudadGuardada = '') {

        const miToken = ++tokenCiudades;

        if (!iso || !departamento) {
            poblarSelect($ciudad, {
                placeholder: 'Selecciona primero un departamento...',
                deshabilitado: true
            });
            return;
        }

        poblarSelect($ciudad, {
            placeholder: 'Cargando ciudades...',
            deshabilitado: true
        });

        try {

            const response = await fetch(`${API_URL}/state/cities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: nombreApiPorIso[iso],
                    state: departamento
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const resultado = await response.json();

            if (miToken !== tokenCiudades) return;   // respuesta vieja

            if (resultado.error || !Array.isArray(resultado.data) || resultado.data.length === 0) {
                activarCiudadManual(ciudadGuardada);
                return;
            }

            const items = [...new Set(resultado.data.filter(Boolean))]
                .map((ciudad) => ({ value: ciudad, text: ciudad }));

            poblarSelect($ciudad, {
                placeholder: 'Selecciona tu ciudad...',
                items
            });

            if (ciudadGuardada) {
                asignarValor($ciudad, ciudadGuardada);
            }

        } catch (error) {

            console.error('Error cargando ciudades:', error);

            if (miToken !== tokenCiudades) return;

            activarCiudadManual(ciudadGuardada);
        }
    }

    // ==========================================
    // MENSAJES DE ERROR
    // ==========================================

    const mensajesError = {
        nombre: 'Este campo es obligatorio.',
        correo: 'Ingresa un correo electrónico válido.',
        whatsapp: 'Ingresa un número de WhatsApp válido.',
        pais: 'Selecciona tu país.',
        departamento: 'Selecciona tu departamento / estado.',
        ciudad: 'Selecciona tu ciudad.',
        ocupacion: 'Selecciona una ocupación.'
    };

    function mostrarError(campo) {
        const contenedor = campo.closest('.form-field');
        if (!contenedor) return;

        contenedor.classList.add('has-error');

        if (contenedor.querySelector('.field-error')) return;

        const span = document.createElement('span');
        span.className = 'field-error';
        span.textContent =
            mensajesError[campo.name] ||
            mensajesError[campo.id] ||
            'Este campo es obligatorio.';

        contenedor.appendChild(span);
    }

    function quitarError(campo) {
        if (!campo || !campo.closest) return;

        const contenedor = campo.closest('.form-field');
        if (!contenedor) return;

        contenedor.classList.remove('has-error');

        const error = contenedor.querySelector('.field-error');
        if (error) error.remove();
    }

    // ==========================================
    // EVENTOS DE LOS COMBOS (jQuery, por Select2)
    // ==========================================

    // País (select) -> sincroniza teléfono y carga departamentos
    $pais.on('change', function () {

        quitarError(this);

        const iso = this.value;

        if (
            iti && iso &&
            iti.getSelectedCountryData().iso2 !== iso.toLowerCase()
        ) {
            iti.setCountry(iso.toLowerCase());
        }

        cargarDepartamentos(iso);
        guardarBorrador();
    });

    // Departamento -> carga ciudades
    $departamento.on('change', function () {

        quitarError(this);

        const iso = $pais.val();
        const departamento = this.value;
        const esManual = $departamento.attr('data-manual') === 'true';

        // En modo manual la ciudad también es manual: no se consulta la API
        if (!esManual && iso && departamento) {
            cargarCiudades(iso, departamento);
        }

        guardarBorrador();
    });

    // Ciudad y ocupación
    $ciudad.add($ocupacion).on('change', function () {
        quitarError(this);
        guardarBorrador();
    });

    // ==========================================
    // INTL-TEL-INPUT
    // ==========================================

    // Si el select de país está vacío, toma el país de la bandera del teléfono
    function sincronizarPaisDesdeTelefono(forzar = false) {

        if (!iti || restaurando) return;

        const data = iti.getSelectedCountryData();
        if (!data || !data.iso2) return;

        const iso = data.iso2.toUpperCase();
        const actual = $pais.val();

        if (actual === iso) return;
        if (actual && !forzar) return;

        $pais.val(iso).trigger('change.select2');
        quitarError($pais[0]);

        cargarDepartamentos(iso);
        guardarBorrador();
    }

    if (whatsappInput && window.intlTelInput) {

        // Fix: intl-tel-input usa setSelectionRange, que falla si el input es type="number"
        whatsappInput.type = 'tel';

        const setSelectionRangeOriginal = whatsappInput.setSelectionRange.bind(whatsappInput);

        whatsappInput.setSelectionRange = function (...args) {
            try {
                return setSelectionRangeOriginal(...args);
            } catch (error) {
                if (error.name !== 'InvalidStateError') throw error;
                // Ignorado: el input no soporta selección de cursor
            }
        };

        const datos = obtenerBorrador();

        iti = window.intlTelInput(whatsappInput, {
            initialCountry: datos.pais ? datos.pais.toLowerCase() : 'auto',

            geoIpLookup: function (success) {
                fetch('https://ipapi.co/json/')
                    .then((response) => response.json())
                    .then((data) => {
                        success(data && data.country_code ? data.country_code : 'BO');
                    })
                    .catch(() => success('BO'));
            },

            preferredCountries: ['bo', 'ar', 'cl', 'co', 'mx', 'pe', 'es', 'us'],

            utilsScript:
                'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
        });

        // Cambio de bandera -> actualiza el select de país
        whatsappInput.addEventListener('countrychange', () => {
            sincronizarPaisDesdeTelefono(true);
        });

        // Cuando termina la detección automática, completa el país si sigue vacío
        if (iti.promise && typeof iti.promise.then === 'function') {
            iti.promise.then(() => sincronizarPaisDesdeTelefono(false)).catch(() => { });
        }

        setTimeout(() => sincronizarPaisDesdeTelefono(false), 0);
    }

    // ==========================================
    // RESTAURAR BORRADOR
    // ==========================================

    async function restaurarBorrador() {

        const datos = obtenerBorrador();

        if (!datos || Object.keys(datos).length === 0) return;

        restaurando = true;

        try {

            // Campos normales
            ['nombre', 'correo'].forEach((nombre) => {
                const campo = form.querySelector(`[name="${nombre}"]`);
                if (campo && datos[nombre]) campo.value = datos[nombre];
            });

            // Ocupación (Select2)
            if (datos.ocupacion) {
                asignarValor($ocupacion, datos.ocupacion);
            }

            // WhatsApp
            if (datos.whatsapp && iti) {
                iti.setNumber(datos.whatsapp);
            }

            // País, departamento y ciudad
            if (datos.pais) {

                const iso = datos.pais.toUpperCase();

                if (iti && iti.getSelectedCountryData().iso2 !== iso.toLowerCase()) {
                    iti.setCountry(iso.toLowerCase());
                }

                $pais.val(iso).trigger('change.select2');

                await cargarDepartamentos(iso, {
                    departamento: datos.departamento || '',
                    ciudad: datos.ciudad || ''
                });
            }

        } catch (error) {

            console.error('Error restaurando formulario:', error);

        } finally {

            restaurando = false;
        }
    }

    restaurarBorrador();

    // ==========================================
    // GUARDAR AUTOMÁTICAMENTE (inputs normales)
    // ==========================================

    form.addEventListener('input', (e) => {
        quitarError(e.target);
        guardarBorrador();
    });

    // ==========================================
    // VALIDAR
    // ==========================================

    function validarCampo(campo) {

        if (!campo.hasAttribute('required')) return true;

        // Departamento y ciudad no pueden estar deshabilitados
        if (
            (campo.id === 'departamento' || campo.id === 'ciudad') &&
            campo.disabled
        ) {
            mostrarError(campo);
            return false;
        }

        // WhatsApp
        if (campo.id === 'whatsapp' && iti && !iti.isValidNumber()) {
            mostrarError(campo);
            return false;
        }

        // Vacío o inválido según HTML
        if (!campo.value.trim() || !campo.checkValidity()) {
            mostrarError(campo);
            return false;
        }

        quitarError(campo);
        return true;
    }

    function enfocarCampo(campo) {

        // Los select con Select2 están ocultos: se lleva la vista a su contenedor
        if ($(campo).hasClass('select2-hidden-accessible')) {

            const contenedor = $(campo).next('.select2-container')[0];

            if (contenedor) {
                contenedor.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return;
        }

        campo.focus();
    }

    // ==========================================
    // PAGESHOW (al volver con el botón "atrás")
    // ==========================================

    window.addEventListener('pageshow', async (event) => {

        if (event.persisted) {
            await restaurarBorrador();
        }

        form.querySelectorAll('input, select').forEach(quitarError);
    });

    // ==========================================
    // ENVÍO
    // ==========================================

    form.addEventListener('submit', (e) => {

        e.preventDefault();

        let formularioValido = true;
        let primerError = null;

        form.querySelectorAll('input, select').forEach((campo) => {

            if (!campo.hasAttribute('required')) return;

            if (!validarCampo(campo)) {

                formularioValido = false;

                if (!primerError) primerError = campo;
            }
        });

        if (!formularioValido) {
            if (primerError) enfocarCampo(primerError);
            return;
        }

        // ==========================================
        // DATOS FINALES
        // ==========================================

        const datosFormulario = {
            nombre: obtenerValorCampo('nombre'),
            correo: obtenerValorCampo('correo'),
            whatsapp: iti ? iti.getNumber() : obtenerValorCampo('whatsapp'),
            pais: $pais.val() || '',
            departamento: $departamento.val() || '',
            ciudad: $ciudad.val() || '',
            ocupacion: $ocupacion.val() || ''
        };

        localStorage.setItem('perfilUsuario', JSON.stringify(datosFormulario));

        guardarBorrador();

        window.location.href = 'personalidad17.html';
    });

});