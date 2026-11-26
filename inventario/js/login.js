// Elementos de la página
const formulario = document.getElementById('formulario-login');
const campoCorreo = document.getElementById('correo');
const campoContrasena = document.getElementById('contrasena');
const mensaje = document.getElementById('mensaje');
const botonEnviar = document.getElementById('boton-enviar');
const botonCambiar = document.getElementById('boton-cambiar');
const botonOlvide = document.getElementById('boton-olvide');
const textoCambiar = document.getElementById('texto-cambiar');
const titulo = document.getElementById('titulo-login');
const subtitulo = document.getElementById('subtitulo-login');

// false = iniciar sesión, true = crear cuenta
let modoRegistro = false;

// Muestra un mensaje; tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = 'mensaje ' + tipo;
}

// Traduce los errores más comunes de Supabase
function traducirError(error) {
    const texto = (error.message || '').toLowerCase();
    if (texto.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (texto.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
    if (texto.includes('already registered')) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
    if (texto.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (texto.includes('rate limit')) return 'Se enviaron demasiados correos. Espera unos minutos e intenta de nuevo.';
    return 'No se pudo completar la acción. Intenta de nuevo.';
}

// Cambia entre "Iniciar sesión" y "Crear cuenta"
function cambiarModo() {
    modoRegistro = !modoRegistro;
    mostrarMensaje('', '');

    titulo.textContent = modoRegistro ? 'Crear cuenta' : 'Iniciar sesión';
    subtitulo.textContent = modoRegistro
        ? 'Regístrate para administrar tu inventario.'
        : 'Entra para administrar tu inventario.';
    botonEnviar.textContent = modoRegistro ? 'Crear cuenta' : 'Iniciar sesión';
    textoCambiar.textContent = modoRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?';
    botonCambiar.textContent = modoRegistro ? 'Iniciar sesión' : 'Crear cuenta';
    campoContrasena.autocomplete = modoRegistro ? 'new-password' : 'current-password';

    // El enlace de "olvidé mi contraseña" solo aparece al iniciar sesión
    botonOlvide.hidden = modoRegistro;
}

// Validaciones antes de hablar con Supabase
function validarCampos() {
    if (!campoCorreo.value.trim()) return 'Escribe tu correo electrónico.';
    if (!campoCorreo.checkValidity()) return 'El correo no tiene un formato válido.';
    if (!campoContrasena.value) return 'Escribe tu contraseña.';
    if (campoContrasena.value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return '';
}

// Envío del formulario
async function enviarFormulario(evento) {
    evento.preventDefault();

    const errorValidacion = validarCampos();
    if (errorValidacion) {
        mostrarMensaje(errorValidacion, 'error');
        return;
    }

    if (!supabaseConfigurado) {
        mostrarMensaje('Falta configurar Supabase en js/supabase.js.', 'error');
        return;
    }

    const correo = campoCorreo.value.trim();
    const contrasena = campoContrasena.value;

    botonEnviar.disabled = true;
    mostrarMensaje('Un momento...', 'exito');

    if (modoRegistro) {
        const { data, error } = await clienteSupabase.auth.signUp({ email: correo, password: contrasena });
        botonEnviar.disabled = false;

        if (error) {
            mostrarMensaje(traducirError(error), 'error');
        } else if (data.session) {
            window.location.href = 'index.html';
        } else {
            // Supabase pide confirmar el correo antes de entrar
            mostrarMensaje('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.', 'exito');
        }
    } else {
        const { error } = await clienteSupabase.auth.signInWithPassword({ email: correo, password: contrasena });
        botonEnviar.disabled = false;

        if (error) {
            mostrarMensaje(traducirError(error), 'error');
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Envía el correo para restablecer la contraseña
async function recuperarContrasena() {
    const correo = campoCorreo.value.trim();

    if (!correo || !campoCorreo.checkValidity()) {
        mostrarMensaje('Escribe tu correo arriba y vuelve a pulsar "¿Olvidaste tu contraseña?".', 'error');
        campoCorreo.focus();
        return;
    }

    if (!supabaseConfigurado) {
        mostrarMensaje('Falta configurar Supabase en js/supabase.js.', 'error');
        return;
    }

    botonOlvide.disabled = true;
    mostrarMensaje('Enviando correo...', 'exito');

    // redirectTo: a dónde llega la persona al pulsar el enlace del correo
    const { error } = await clienteSupabase.auth.resetPasswordForEmail(correo, {
        redirectTo: new URL('reset.html', window.location.href).href
    });

    botonOlvide.disabled = false;

    if (error) {
        mostrarMensaje(traducirError(error), 'error');
        return;
    }

    mostrarMensaje('Si ese correo tiene una cuenta, te llegará un enlace para restablecer la contraseña. Revisa también el spam.', 'exito');
}

// Si ya hay una sesión abierta, pasa directo al panel
async function revisarSesion() {
    if (!supabaseConfigurado) return;
    const { data } = await clienteSupabase.auth.getSession();
    if (data.session) window.location.href = 'index.html';
}

formulario.addEventListener('submit', enviarFormulario);
botonCambiar.addEventListener('click', cambiarModo);
botonOlvide.addEventListener('click', recuperarContrasena);
revisarSesion();