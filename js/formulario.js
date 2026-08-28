/*
    Creado: Willy Condori
    Fecha: 28/08/2026
    Módulo: Navegación de cuestionarios y personalidad
    Descripción: Persistencia robusta de borrador con soporte para intl-tel-input y navegación hacia atrás.
*/
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('formPerfil');
    if (!form) return;

    const campos = form.querySelectorAll('input, select');
    const STORAGE_KEY = 'perfilUsuarioBorrador';

    const whatsappInput = document.getElementById('whatsapp');
    const paisInput = document.getElementById('pais');
    let iti = null;

    // ==========================================
    // GESTIÓN DE BORRADOR (LOCALSTORAGE)
    // ==========================================

    function obtenerValorCampo(nameOrId) {
        const el = form.querySelector(`[name="${nameOrId}"], #${nameOrId}`);
        return el ? el.value : '';
    }

    function guardarBorrador() {
        const datos = {
            nombre: obtenerValorCampo('nombre'),
            correo: obtenerValorCampo('correo'),
            whatsapp: whatsappInput ? whatsappInput.value : obtenerValorCampo('whatsapp'),
            ciudad: obtenerValorCampo('ciudad'),
            pais: paisInput ? paisInput.value : obtenerValorCampo('pais'),
            ocupacion: obtenerValorCampo('ocupacion')
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    }

    function restaurarBorrador() {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (!guardado) return;

        try {
            const datos = JSON.parse(guardado);

            Object.keys(datos).forEach((clave) => {
                const valor = datos[clave];
                if (!valor) return;

                const campo = form.querySelector(`[name="${clave}"], #${clave}`);
                if (campo) {
                    campo.value = valor;
                    campo.dispatchEvent(new Event('input', { bubbles: true }));
                    campo.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            // Sincronizar plugin de teléfono si ya fue inicializado
            if (datos.whatsapp && iti) {
                iti.setNumber(datos.whatsapp);
            }
            if (datos.pais && iti) {
                iti.setCountry(datos.pais.toLowerCase());
            }

        } catch (err) {
            console.error("Error al restaurar borrador:", err);
        }
    }

    // ==========================================
    // INICIALIZACIÓN TELÉFONO / PAÍS
    // ==========================================

    if (whatsappInput && window.intlTelInput) {
        const datosGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

        iti = window.intlTelInput(whatsappInput, {
            // Si ya hay un país guardado en el borrador, se usa directamente evitando la llamada fetch
            initialCountry: datosGuardados.pais ? datosGuardados.pais.toLowerCase() : "auto",
            geoIpLookup: function(success, failure) {
                fetch("https://ipapi.co/json/")
                    .then(res => res.json())
                    .then(data => success(data.country_code))
                    .catch(() => success("BO"));
            },
            preferredCountries: ['bo', 'ar', 'cl', 'co', 'mx', 'pe', 'es', 'us'],
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js"
        });

        const actualizarPais = () => {
            const countryData = iti.getSelectedCountryData();
            if (countryData && countryData.iso2 && paisInput) {
                paisInput.value = countryData.iso2.toUpperCase();
                guardarBorrador();
            }
        };

        whatsappInput.addEventListener('countrychange', actualizarPais);
    }

    // Restauración inmediata de inputs de texto y selects
    restaurarBorrador();

    // Guardar automáticamente en cualquier interacción
    form.addEventListener('input', guardarBorrador);
    form.addEventListener('change', guardarBorrador);

    // ==========================================
    // MENSAJES DE ERROR Y VALIDACIÓN
    // ==========================================

    const mensajesError = {
        nombre: 'Este campo es obligatorio.',
        correo: 'Ingresa un correo electrónico válido.',
        whatsapp: 'Ingresa un número de WhatsApp válido.',
        ciudad: 'Este campo es obligatorio.',
        pais: 'Selecciona tu país.',
        ocupacion: 'Selecciona una ocupación.'
    };

    function mostrarError(campo) {
        const contenedor = campo.closest('.form-field');
        if (!contenedor) return;

        contenedor.classList.add('has-error');
        if (contenedor.querySelector('.field-error')) return;

        const span = document.createElement('span');
        span.className = 'field-error';
        span.textContent = mensajesError[campo.name] || mensajesError[campo.id] || 'Este campo es obligatorio.';
        contenedor.appendChild(span);
    }

    function quitarError(campo) {
        const contenedor = campo.closest('.form-field');
        if (!contenedor) return;

        contenedor.classList.remove('has-error');
        const span = contenedor.querySelector('.field-error');
        if (span) span.remove();
    }

    function validarCampo(campo) {
        if (!campo.hasAttribute('required')) return true;

        if (campo.value.trim() === '') {
            mostrarError(campo);
            return false;
        }

        if ((campo.name === 'whatsapp' || campo.id === 'whatsapp') && iti) {
            if (!iti.isValidNumber()) {
                mostrarError(campo);
                return false;
            }
        } else if (!campo.checkValidity()) {
            mostrarError(campo);
            return false;
        }

        quitarError(campo);
        return true;
    }

    // ==========================================
    // NAVEGACIÓN Y ENVÍO
    // ==========================================

    // Soporte para BFCache cuando el usuario presiona el botón "Atrás" del navegador
    window.addEventListener('pageshow', () => {
        restaurarBorrador();
        campos.forEach((campo) => quitarError(campo));
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let formularioValido = true;
        let primerError = null;

        campos.forEach((campo) => {
            if (campo.hasAttribute('required')) {
                const valido = validarCampo(campo);
                if (!valido) {
                    formularioValido = false;
                    if (!primerError) primerError = campo;
                }
            }
        });

        if (!formularioValido) {
            primerError?.focus();
            return;
        }

        const datosFormulario = {
            nombre: obtenerValorCampo('nombre'),
            correo: obtenerValorCampo('correo'),
            whatsapp: iti ? iti.getNumber() : obtenerValorCampo('whatsapp'),
            ciudad: obtenerValorCampo('ciudad'),
            pais: paisInput ? paisInput.value : obtenerValorCampo('pais'),
            ocupacion: obtenerValorCampo('ocupacion')
        };

        // Guardar resultado final y mantener borrador sincronizado para permitir regreso libre
        localStorage.setItem('perfilUsuario', JSON.stringify(datosFormulario));
        guardarBorrador(); 

        window.location.href = 'personalidad17.html';
    });
});