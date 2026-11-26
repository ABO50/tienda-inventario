const formulario = document.getElementById('formulario-reset');
const mensaje = document.getElementById('mensaje');
const botonGuardar = document.getElementById('boton-guardar-contrasena');
const campoNueva = document.getElementById('nueva');
const campoConfirmar = document.getElementById('confirmar');

let enlaceValido = false;

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = 'mensaje ' + tipo;
}

function mostrarFormulario() {
    enlaceValido = true;
    formulario.hidden = false;
    mostrarMensaje('', '');
}

if (!supabaseConfigurado) {
    mostrarMensaje('Falta configurar Supabase en js/supabase.js.', 'error');
} else {
    // Supabase avisa con este evento cuando la persona llegó desde el enlace del correo
    clienteSupabase.auth.onAuthStateChange(evento => {
        if (evento === 'PASSWORD_RECOVERY') mostrarFormulario();
    });

    // Si en 3 segundos no llegó el evento, revisamos si hay una sesión abierta
    setTimeout(async () => {
        if (enlaceValido) return;

        const { data } = await clienteSupabase.auth.getSession();
        if (data.session) {
            mostrarFormulario();
        } else {
            mostrarMensaje('El enlace no es válido o ya caducó. Pide uno nuevo desde el inicio de sesión.', 'error');
        }
    }, 3000);
}

formulario.addEventListener('submit', async evento => {
    evento.preventDefault();

    if (campoNueva.value.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }
    if (campoNueva.value !== campoConfirmar.value) {
        mostrarMensaje('Las contraseñas no coinciden.', 'error');
        return;
    }

    botonGuardar.disabled = true;
    mostrarMensaje('Guardando...', 'exito');

    const { error } = await clienteSupabase.auth.updateUser({ password: campoNueva.value });

    botonGuardar.disabled = false;

    if (error) {
        const texto = (error.message || '').toLowerCase();
        mostrarMensaje(
            texto.includes('different')
                ? 'La nueva contraseña debe ser distinta a la anterior.'
                : 'No se pudo cambiar la contraseña. Intenta de nuevo.',
            'error'
        );
        return;
    }

    mostrarMensaje('Contraseña actualizada. Entrando...', 'exito');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
});