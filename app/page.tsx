"use client";

import { useEffect, useState, type FormEvent } from "react";
import { productosApi, type Producto } from "./lib/productos";

const formatoPrecio = new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formularioVacio = { nombre: "", precio: "0", stock: "0" };
const mensajeError = (error: unknown) => error instanceof Error ? error.message : "Ocurrió un error inesperado.";

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<Producto | null>(null);
  const [formulario, setFormulario] = useState(formularioVacio);

  useEffect(() => {
    const controller = new AbortController();
    productosApi.listar(AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]))
      .then(setProductos)
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(mensajeError(error)); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  function limpiarFormulario() {
    setEditando(null);
    setFormulario(formularioVacio);
  }

  async function recargar() {
    setCargando(true);
    setError("");
    setMensaje("");
    try { setProductos(await productosApi.listar()); }
    catch (error) { setError(mensajeError(error)); }
    finally { setCargando(false); }
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const datos = { nombre: formulario.nombre.trim(), precio: Number(formulario.precio), stock: Number(formulario.stock) };
    if (!datos.nombre || datos.nombre.length > 100 || formulario.precio.trim() === "" || !Number.isFinite(datos.precio) || datos.precio < 0 || datos.precio > 99999999.99 || formulario.stock.trim() === "" || !Number.isInteger(datos.stock) || datos.stock < 0 || datos.stock > 2147483647) {
      setError("Revisa el nombre, el precio y el stock. Deben ser valores válidos y no negativos.");
      return;
    }
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const producto = editando === null ? await productosApi.crear(datos) : await productosApi.actualizar(editando, datos);
      setProductos((actuales) => editando === null ? [...actuales, producto] : actuales.map((actual) => actual.id === producto.id ? producto : actual));
      setDetalle((actual) => actual?.id === producto.id ? producto : actual);
      setMensaje(editando === null ? "Producto creado correctamente." : "Cambios guardados correctamente.");
      limpiarFormulario();
    } catch (error) { setError(mensajeError(error)); }
    finally { setOcupado(false); }
  }

  async function consultar(id: number, editar = false) {
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const producto = await productosApi.obtener(id);
      setDetalle(producto);
      if (editar) {
        setEditando(producto.id);
        setFormulario({ nombre: producto.nombre, precio: String(producto.precio), stock: String(producto.stock) });
        document.getElementById("nombre")?.focus();
      }
    } catch (error) { setError(mensajeError(error)); }
    finally { setOcupado(false); }
  }

  async function eliminar(producto: Producto) {
    if (!window.confirm(`¿Eliminar «${producto.nombre}»? Esta acción no se puede deshacer.`)) return;
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      await productosApi.eliminar(producto.id);
      setProductos((actuales) => actuales.filter((actual) => actual.id !== producto.id));
      if (detalle?.id === producto.id) setDetalle(null);
      if (editando === producto.id) limpiarFormulario();
      setMensaje("Producto eliminado correctamente.");
    } catch (error) { setError(mensajeError(error)); }
    finally { setOcupado(false); }
  }

  const bloqueado = cargando || ocupado;
  const visibles = productos.filter((producto) => producto.nombre.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es")) || String(producto.id) === busqueda.trim());

  return (
    <main className="dashboard">
      <nav className="nav" aria-label="Navegación principal">
        <a className="brand" href="#inicio"><span className="brand-mark">U</span>Tu inventario</a>
        <span className="nav-caption">UPB · Gestión de productos</span>
      </nav>

      <header className="page-header" id="inicio">
        <p className="eyebrow">Todo en su lugar</p>
        <h1>Tu inventario,<br /><span>sin complicaciones.</span></h1>
        <p className="intro">Consulta tus productos, actualiza sus datos y mantén el control de tus existencias.</p>
      </header>

      <section className="stats" aria-label="Resumen del inventario">
        <div><span>Productos</span><strong>{cargando ? "—" : productos.length}</strong></div>
        <div><span>Unidades en stock</span><strong>{cargando ? "—" : productos.reduce((total, producto) => total + producto.stock, 0)}</strong></div>
        <div><span>Sin existencias</span><strong>{cargando ? "—" : productos.filter((producto) => producto.stock === 0).length}</strong></div>
      </section>

      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      <p className="success-message" role="status">{mensaje}</p>

      <div className="workspace">
        <section className="panel inventory" aria-labelledby="listado-titulo" aria-busy={bloqueado}>
          <div className="panel-heading">
            <div><p className="eyebrow">Catálogo</p><h2 id="listado-titulo">Mis productos</h2></div>
            <button className="button secondary" onClick={recargar} disabled={bloqueado}>{cargando ? "Cargando…" : "Actualizar"}</button>
          </div>
          <label className="search-label" htmlFor="busqueda">Buscar por nombre o ID</label>
          <input id="busqueda" type="search" placeholder="Encuentra un producto…" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
          {cargando ? <p className="empty" role="status">Cargando productos… El backend puede tardar unos segundos en iniciar.</p> : visibles.length === 0 ? <p className="empty">{busqueda ? "No hay productos que coincidan con tu búsqueda." : error ? "No se pudo cargar el catálogo. Pulsa Actualizar para reintentar." : "Tu inventario empieza aquí. Añade tu primer producto con el formulario."}</p> : (
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Productos registrados en el inventario</caption>
                <thead><tr><th scope="col">Producto</th><th scope="col">Precio</th><th scope="col">Stock</th><th scope="col">Acciones</th></tr></thead>
                <tbody>{visibles.map((producto) => (
                  <tr key={producto.id}>
                    <td><strong>{producto.nombre}</strong><small>#{producto.id}</small></td>
                    <td className="number">{formatoPrecio.format(producto.precio)}</td>
                    <td><span className={`stock-badge ${producto.stock === 0 ? "out-of-stock" : ""}`}>{producto.stock}</span></td>
                    <td><div className="row-actions">
                      <button disabled={bloqueado} onClick={() => consultar(producto.id)} aria-label={`Ver ${producto.nombre}`}>Ver</button>
                      <button disabled={bloqueado} onClick={() => consultar(producto.id, true)} aria-label={`Editar ${producto.nombre}`}>Editar</button>
                      <button className="danger" disabled={bloqueado} onClick={() => eliminar(producto)} aria-label={`Eliminar ${producto.nombre}`}>Eliminar</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <p className="panel-note">{visibles.length} de {productos.length} productos · Datos guardados en el backend</p>
        </section>

        <aside className="side-column">
          <section className="panel form-panel" aria-labelledby="formulario-titulo">
            <p className="eyebrow">{editando === null ? "Un nuevo comienzo" : `Producto #${editando}`}</p>
            <h2 id="formulario-titulo">{editando === null ? "Añadir producto" : "Editar producto"}</h2>
            <form onSubmit={guardar}>
              <fieldset disabled={ocupado}>
                <label htmlFor="nombre">Nombre</label>
                <input id="nombre" name="nombre" required maxLength={100} placeholder="Ej. Cuaderno universitario" value={formulario.nombre} onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })} />
                <div className="form-row">
                  <div><label htmlFor="precio">Precio</label><input id="precio" name="precio" type="number" min="0" max="99999999.99" step="0.01" required value={formulario.precio} onChange={(event) => setFormulario({ ...formulario, precio: event.target.value })} /></div>
                  <div><label htmlFor="stock">Stock</label><input id="stock" name="stock" type="number" min="0" max="2147483647" step="1" required value={formulario.stock} onChange={(event) => setFormulario({ ...formulario, stock: event.target.value })} /></div>
                </div>
                <button className="button primary" type="submit" disabled={bloqueado}>{ocupado ? "Procesando…" : editando === null ? "Crear producto +" : "Guardar cambios"}</button>
                {editando !== null ? <button className="button secondary cancel" type="button" onClick={limpiarFormulario}>Cancelar edición</button> : null}
              </fieldset>
            </form>
          </section>

          {detalle ? <section className="panel detail-panel" aria-labelledby="detalle-titulo">
            <div className="panel-heading"><h2 id="detalle-titulo">Detalle #{detalle.id}</h2><button className="text-button" onClick={() => setDetalle(null)}>Cerrar</button></div>
            <dl><dt>Nombre</dt><dd>{detalle.nombre}</dd><dt>Precio</dt><dd>{formatoPrecio.format(detalle.precio)}</dd><dt>Stock</dt><dd>{detalle.stock} unidades</dd><dt>Fecha de creación</dt><dd>{new Date(detalle.createdAt).toLocaleString("es")}</dd></dl>
          </section> : null}
        </aside>
      </div>
      <footer><span>Tu inventario · Un lugar para cada producto.</span><span>Next.js + Express + PostgreSQL</span></footer>
    </main>
  );
}
