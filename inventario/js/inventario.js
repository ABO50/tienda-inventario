// =====================================================
// Panel de inventario y ventas · Atelier Rosa
// Lee y escribe en Supabase (tablas: productos y ventas)
// =====================================================

// Con esta existencia o menos, el producto aparece como "Stock bajo"
const UMBRAL_STOCK_BAJO = 5;

// Lista de productos en memoria (se usa para buscar, filtrar y mostrar el resumen)
let todosLosProductos = [];

// ----- Elementos de la página -----
const rejilla = document.getElementById('rejilla-productos');
const campoBuscar = document.getElementById('buscar');
const filtroStock = document.getElementById('filtro-stock');
const formularioFiltros = document.getElementById('formulario-filtros');

const formularioProducto = document.getElementById('formulario-producto');
const tituloAdmin = document.getElementById('titulo-admin');
const mensajeProducto = document.getElementById('mensaje-producto');
const botonGuardar = document.getElementById('boton-guardar');
const botonCancelar = document.getElementById('boton-cancelar');

const formularioVenta = document.getElementById('formulario-venta');
const selectProducto = document.getElementById('producto');
const campoCantidad = document.getElementById('cantidad');
const campoCliente = document.getElementById('cliente-nombre');
const campoCorreoCliente = document.getElementById('cliente-correo');
const campoDireccion = document.getElementById('campo-direccion');
const inputDireccion = document.getElementById('direccion');
const resumenVenta = document.getElementById('resumen-venta');
const mensajeVenta = document.getElementById('mensaje-venta');
const botonVenta = document.getElementById('boton-venta');

const cuerpoVentas = document.getElementById('cuerpo-ventas');
const totalVendido = document.getElementById('total-vendido');


// =====================================================
// Funciones de apoyo
// =====================================================

// Evita que un texto raro de la base de datos rompa el HTML
function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[caracter]));
}

// Da formato de dinero: 1250 -> $1,250
function formatoMoneda(valor) {
    return '$' + Number(valor).toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

// Quita mayúsculas y acentos para que "panuelo" encuentre "Pañuelo"
function normalizar(texto) {
    return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Decide el estado del producto según su existencia
function obtenerEstado(existencia) {
    if (existencia === 0) return { clase: 'agotado', texto: 'Agotado' };
    if (existencia <= UMBRAL_STOCK_BAJO) return { clase: 'bajo', texto: 'Stock bajo' };
    return { clase: 'disponible', texto: 'Disponible' };
}

// Muestra un mensaje de éxito o error debajo de un formulario
function ponerMensaje(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = 'mensaje campo-ancho ' + tipo;
}


// =====================================================
// Inventario: mostrar productos
// =====================================================

// Crea el HTML de una tarjeta de producto
function crearTarjeta(producto) {
    const estado = obtenerEstado(producto.existencia);
    const id = escapar(producto.id);

    const imagen = producto.imagen_url
        ? `<img src="${escapar(producto.imagen_url)}" alt="${escapar(producto.nombre)}" class="imagen-producto">`
        : '<div class="imagen-producto sin-imagen">Sin imagen</div>';

    return `
        <article class="producto vidrio">
            ${imagen}
            <h3>${escapar(producto.nombre)}</h3>
            <p>Precio: ${formatoMoneda(producto.precio)}</p>
            <p>Existencia: ${producto.existencia} piezas</p>
            <span class="${estado.clase}">${estado.texto}</span>

            <div class="acciones-producto">
                <a href="#detalles-producto" class="boton-detalles" data-detalle="${id}">Ver detalles</a>
                <button type="button" class="boton-secundario" data-editar="${id}">Editar</button>
                <button type="button" class="boton-peligro" data-eliminar="${id}">Eliminar</button>
            </div>
        </article>
    `;
}

// Dibuja una lista de productos dentro de la rejilla
function mostrarProductos(lista) {
    if (lista.length === 0) {
        rejilla.innerHTML = todosLosProductos.length === 0
            ? '<p>Aún no tienes productos. Agrega el primero en la sección "Agregar producto".</p>'
            : '<p>No hay productos que coincidan con la búsqueda.</p>';
        return;
    }
    rejilla.innerHTML = lista.map(crearTarjeta).join('');
}

// Cuenta los productos por estado y calcula el valor del inventario
function actualizarResumen() {
    const conteo = { disponible: 0, bajo: 0, agotado: 0 };
    let valor = 0;

    todosLosProductos.forEach(producto => {
        conteo[obtenerEstado(producto.existencia).clase]++;
        valor += Number(producto.precio) * producto.existencia;
    });

    document.getElementById('resumen-total').textContent = todosLosProductos.length;
    document.getElementById('resumen-disponibles').textContent = conteo.disponible;
    document.getElementById('resumen-bajo').textContent = conteo.bajo;
    document.getElementById('resumen-agotados').textContent = conteo.agotado;
    document.getElementById('resumen-valor').textContent = formatoMoneda(valor);
}

// Muestra solo los productos que cumplen la búsqueda y el filtro
function filtrarProductos() {
    const texto = normalizar(campoBuscar.value.trim());
    const estado = filtroStock.value;

    const resultado = todosLosProductos.filter(producto => {
        const coincideNombre = normalizar(producto.nombre).includes(texto);
        const coincideEstado = estado === 'todos' || obtenerEstado(producto.existencia).clase === estado;
        return coincideNombre && coincideEstado;
    });

    mostrarProductos(resultado);
}

// Llena la ventana de "Ver detalles" con los datos del producto
function llenarDetalle(producto) {
    document.getElementById('detalle-nombre').textContent = producto.nombre;
    document.getElementById('detalle-precio').textContent = formatoMoneda(producto.precio);
    document.getElementById('detalle-existencia').textContent = producto.existencia;
    document.getElementById('detalle-descripcion').textContent = producto.descripcion || 'Sin descripción.';

    const imagen = document.getElementById('detalle-imagen');
    imagen.hidden = !producto.imagen_url;
    imagen.src = producto.imagen_url || '';
    imagen.alt = producto.nombre;
}

// Llena la lista de productos del formulario de venta (los agotados quedan desactivados)
function llenarSelectVenta() {
    const seleccionado = selectProducto.value;
    selectProducto.innerHTML = '<option value="">Elige una opción</option>';

    todosLosProductos.forEach(producto => {
        const opcion = document.createElement('option');
        opcion.value = producto.id;
        opcion.disabled = producto.existencia === 0;
        opcion.textContent = producto.existencia === 0
            ? producto.nombre + ' (agotado)'
            : producto.nombre + ' · ' + producto.existencia + ' disponibles';
        selectProducto.appendChild(opcion);
    });

    // Conserva el producto elegido si sigue disponible
    const sigueDisponible = todosLosProductos.some(p => p.id === seleccionado && p.existencia > 0);
    selectProducto.value = sigueDisponible ? seleccionado : '';
    ajustarCantidadMaxima();
    actualizarTotalVenta();
}

// Pide los productos a Supabase y actualiza toda la pantalla
async function cargarProductos() {
    const { data, error } = await clienteSupabase
        .from('productos')
        .select('*')
        .order('nombre');

    if (error) {
        rejilla.innerHTML = '<p>No se pudieron cargar los productos.</p>';
        console.error(error);
        return;
    }

    todosLosProductos = data;
    actualizarResumen();
    llenarSelectVenta();
    filtrarProductos();
}


// =====================================================
// Inventario: agregar, editar y eliminar (CRUD)
// =====================================================

// Deja el formulario listo para agregar un producto nuevo
function limpiarFormularioProducto() {
    formularioProducto.reset();
    document.getElementById('producto-id').value = '';
    tituloAdmin.textContent = 'Agregar producto';
    botonGuardar.textContent = 'Guardar producto';
    botonCancelar.hidden = true;
}

// Guardar: crea o actualiza según si hay un id cargado
async function guardarProducto(evento) {
    evento.preventDefault();

    const id = document.getElementById('producto-id').value;
    const datos = {
        nombre: document.getElementById('prod-nombre').value.trim(),
        descripcion: document.getElementById('prod-descripcion').value.trim() || null,
        precio: Number(document.getElementById('prod-precio').value),
        existencia: Number(document.getElementById('prod-existencia').value),
        imagen_url: document.getElementById('prod-imagen').value.trim() || null
    };

    // Validaciones
    if (!datos.nombre) {
        ponerMensaje(mensajeProducto, 'Escribe el nombre del producto.', 'error');
        return;
    }
    if (document.getElementById('prod-precio').value === '' || !(datos.precio >= 0)) {
        ponerMensaje(mensajeProducto, 'El precio debe ser un número mayor o igual a 0.', 'error');
        return;
    }
    if (!Number.isInteger(datos.existencia) || datos.existencia < 0) {
        ponerMensaje(mensajeProducto, 'La existencia debe ser un número entero, 0 o mayor.', 'error');
        return;
    }

    botonGuardar.disabled = true;

    const { error } = id
        ? await clienteSupabase.from('productos').update(datos).eq('id', id)
        : await clienteSupabase.from('productos').insert(datos);

    botonGuardar.disabled = false;

    if (error) {
        ponerMensaje(mensajeProducto, 'No se pudo guardar: ' + error.message, 'error');
        return;
    }

    ponerMensaje(mensajeProducto, id ? 'Producto actualizado.' : 'Producto agregado.', 'exito');
    limpiarFormularioProducto();
    cargarProductos();
}

// Carga un producto en el formulario para editarlo
function editarProducto(producto) {
    document.getElementById('producto-id').value = producto.id;
    document.getElementById('prod-nombre').value = producto.nombre;
    document.getElementById('prod-precio').value = producto.precio;
    document.getElementById('prod-existencia').value = producto.existencia;
    document.getElementById('prod-imagen').value = producto.imagen_url ?? '';
    document.getElementById('prod-descripcion').value = producto.descripcion ?? '';

    tituloAdmin.textContent = 'Editar producto';
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.hidden = false;
    ponerMensaje(mensajeProducto, '', '');
    formularioProducto.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Elimina un producto después de pedir confirmación
async function eliminarProducto(producto) {
    if (!confirm('¿Eliminar "' + producto.nombre + '"? Esta acción no se puede deshacer.')) return;

    const { error } = await clienteSupabase.from('productos').delete().eq('id', producto.id);

    if (error) {
        // 23503 = el producto tiene ventas ligadas (on delete restrict)
        if (error.code === '23503') {
            alert('No puedes eliminar este producto porque ya tiene ventas registradas.');
        } else {
            alert('No se pudo eliminar: ' + error.message);
        }
        return;
    }

    cargarProductos();
}

// Un solo "escucha" para los botones de todas las tarjetas.
// Las tarjetas se crean con JavaScript, así que no se les puede poner un clic una por una.
rejilla.addEventListener('click', evento => {
    const botonDetalle = evento.target.closest('[data-detalle]');
    const botonEditar = evento.target.closest('[data-editar]');
    const botonEliminar = evento.target.closest('[data-eliminar]');

    const id = (botonDetalle || botonEditar || botonEliminar)?.dataset;
    if (!id) return;

    const producto = todosLosProductos.find(p =>
        p.id === (id.detalle || id.editar || id.eliminar)
    );
    if (!producto) return;

    if (botonDetalle) llenarDetalle(producto);
    if (botonEditar) editarProducto(producto);
    if (botonEliminar) eliminarProducto(producto);
});

formularioProducto.addEventListener('submit', guardarProducto);

botonCancelar.addEventListener('click', () => {
    limpiarFormularioProducto();
    ponerMensaje(mensajeProducto, '', '');
});

// Búsqueda y filtro: se aplican mientras escribes o cambias el menú
campoBuscar.addEventListener('input', filtrarProductos);
filtroStock.addEventListener('change', filtrarProductos);
formularioFiltros.addEventListener('submit', evento => {
    evento.preventDefault();
    filtrarProductos();
});


// =====================================================
// Ventas: registrar una venta
// =====================================================

// La cantidad máxima depende de las existencias del producto elegido
function ajustarCantidadMaxima() {
    const producto = todosLosProductos.find(p => p.id === selectProducto.value);
    campoCantidad.max = producto ? producto.existencia : '';

    if (producto && Number(campoCantidad.value) > producto.existencia) {
        campoCantidad.value = producto.existencia;
    }
}

// Muestra el total estimado antes de enviar (el total real lo calcula la base de datos)
function actualizarTotalVenta() {
    const producto = todosLosProductos.find(p => p.id === selectProducto.value);
    if (!producto) {
        resumenVenta.textContent = '';
        return;
    }
    const total = Number(producto.precio) * Number(campoCantidad.value || 0);
    resumenVenta.textContent = `Precio: ${formatoMoneda(producto.precio)} · Total: ${formatoMoneda(total)}`;
}

// La dirección solo se pide si la entrega es a domicilio
function actualizarEntrega() {
    const esDomicilio = formularioVenta.querySelector('input[name="entrega"]:checked').value === 'domicilio';
    campoDireccion.hidden = !esDomicilio;
    if (!esDomicilio) inputDireccion.value = '';
}

async function registrarVenta(evento) {
    evento.preventDefault();

    const producto = todosLosProductos.find(p => p.id === selectProducto.value);
    const cantidad = Number(campoCantidad.value);
    const nombre = campoCliente.value.trim();
    const correo = campoCorreoCliente.value.trim();
    const entrega = formularioVenta.querySelector('input[name="entrega"]:checked').value;
    const direccion = inputDireccion.value.trim();

    // Validaciones
    if (!producto) {
        ponerMensaje(mensajeVenta, 'Elige un producto.', 'error');
        return;
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
        ponerMensaje(mensajeVenta, 'La cantidad debe ser un número entero de 1 o más.', 'error');
        return;
    }
    if (cantidad > producto.existencia) {
        ponerMensaje(mensajeVenta, 'Solo hay ' + producto.existencia + ' pieza(s) de ' + producto.nombre + '.', 'error');
        return;
    }
    if (!nombre) {
        ponerMensaje(mensajeVenta, 'Escribe el nombre del cliente.', 'error');
        return;
    }
    if (correo && !campoCorreoCliente.checkValidity()) {
        ponerMensaje(mensajeVenta, 'El correo del cliente no tiene un formato válido.', 'error');
        return;
    }
    if (entrega === 'domicilio' && !direccion) {
        ponerMensaje(mensajeVenta, 'Escribe la dirección de entrega.', 'error');
        return;
    }

    botonVenta.disabled = true;
    ponerMensaje(mensajeVenta, 'Registrando venta...', 'exito');

    // Guardamos la venta. user_id, fecha, precio y total los llena Supabase.
    const { data, error } = await clienteSupabase
        .from('ventas')
        .insert({
            producto_id: producto.id,
            cantidad: cantidad,
            cliente_nombre: nombre,
            cliente_correo: correo || null,
            tipo_entrega: entrega,
            direccion: direccion || null,
            comentarios: document.getElementById('comentarios').value.trim() || null
        })
        .select()
        .single();

    botonVenta.disabled = false;

    if (error) {
        // Si no alcanza el stock, aquí llega el mensaje del trigger
        ponerMensaje(mensajeVenta, error.message, 'error');
        return;
    }

    ponerMensaje(mensajeVenta, 'Venta registrada. Total: ' + formatoMoneda(data.total), 'exito');
    formularioVenta.reset();
    actualizarEntrega();
    actualizarTotalVenta();

    // Volvemos a pedir los datos para ver las existencias y el historial nuevos
    cargarProductos();
    cargarVentas();
}

selectProducto.addEventListener('change', () => {
    ajustarCantidadMaxima();
    actualizarTotalVenta();
});
campoCantidad.addEventListener('input', actualizarTotalVenta);
formularioVenta.querySelectorAll('input[name="entrega"]')
    .forEach(radio => radio.addEventListener('change', actualizarEntrega));
formularioVenta.addEventListener('submit', registrarVenta);


// =====================================================
// Ventas: historial
// =====================================================

async function cargarVentas() {
    // "productos(nombre)" trae el nombre del producto gracias a la relación entre tablas
    const { data, error } = await clienteSupabase
        .from('ventas')
        .select('*, productos(nombre)')
        .order('fecha', { ascending: false });

    if (error) {
        cuerpoVentas.innerHTML = '<tr><td colspan="6" class="sin-ventas">No se pudieron cargar las ventas.</td></tr>';
        console.error(error);
        return;
    }

    if (data.length === 0) {
        cuerpoVentas.innerHTML = '<tr><td colspan="6" class="sin-ventas">Aún no hay ventas registradas.</td></tr>';
        totalVendido.textContent = '';
        return;
    }

    cuerpoVentas.innerHTML = data.map(venta => {
        const fecha = new Date(venta.fecha).toLocaleString('es-MX', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
        const entrega = venta.tipo_entrega === 'domicilio'
            ? 'A domicilio' + (venta.direccion ? ': ' + venta.direccion : '')
            : 'En tienda';

        return `
            <tr>
                <td>${escapar(fecha)}</td>
                <td>${escapar(venta.productos?.nombre)}</td>
                <td>${venta.cantidad}</td>
                <td>${formatoMoneda(venta.total)}</td>
                <td>${escapar(venta.cliente_nombre)}</td>
                <td>${escapar(entrega)}</td>
            </tr>
        `;
    }).join('');

    // Suma de todos los totales
    const suma = data.reduce((acumulado, venta) => acumulado + Number(venta.total), 0);
    totalVendido.textContent = 'Total vendido: ' + formatoMoneda(suma) + ' en ' + data.length + ' venta(s)';
}


// =====================================================
// Inicio
// =====================================================
actualizarEntrega();

if (supabaseConfigurado) {
    cargarProductos();
    cargarVentas();
} else {
    rejilla.innerHTML = '<p>Falta configurar Supabase en js/supabase.js.</p>';
}