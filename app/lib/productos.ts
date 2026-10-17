export type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  createdAt: string;
};

export type DatosProducto = Pick<Producto, "nombre" | "precio" | "stock">;

const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!baseUrl) throw new Error("Falta configurar NEXT_PUBLIC_API_URL en el frontend.");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/productos${path}`, {
      ...options,
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(60000),
      headers: { ...options.headers, ...(options.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("No se pudo contactar al backend. Revisa tu conexión e inténtalo de nuevo. Si estabas guardando o eliminando, actualiza la lista antes de repetir la operación.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.error === "string" ? body.error : `La solicitud falló (${response.status}).`);
  }
  // DELETE responde con 204, sin contenido JSON.
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const productosApi = {
  listar: (signal?: AbortSignal) => request<Producto[]>("", { signal }),
  obtener: (id: number) => request<Producto>(`/${id}`),
  crear: (datos: DatosProducto) => request<Producto>("", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: DatosProducto) => request<Producto>(`/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => request<void>(`/${id}`, { method: "DELETE" }),
};
