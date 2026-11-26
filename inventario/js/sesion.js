// Este archivo protege el panel: si no hay sesión, manda al login.

const botonSalir = document.getElementById('boton-salir');
const correoUsuario = document.getElementById('correo-usuario');

async function protegerPagina() {
    // Mientras no configures Supabase, deja ver la página para poder trabajar en ella
    if (!supabaseConfigurado) {
        console.warn('Supabase no está configurado en js/supabase.js: la página no está protegida.');
        correoUsuario.textContent = 'Sin conexión a Supabase';
        return;
    }

    const { data } = await clienteSupabase.auth.getSession();

    if (!data.session) {
        window.location.href = 'login.html';
        return;
    }

    correoUsuario.textContent = data.session.user.email;
}

// Cerrar sesión
async function cerrarSesion() {
    if (supabaseConfigurado) {
        await clienteSupabase.auth.signOut();
    }
    window.location.href = 'login.html';
}

botonSalir.addEventListener('click', cerrarSesion);
protegerPagina();