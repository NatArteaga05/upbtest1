import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(fs.readFileSync("app/lib/productos.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function cliente(fetch, url = "https://api.example.com/") {
  const context = { exports: {}, process: { env: { NEXT_PUBLIC_API_URL: url } }, fetch, AbortSignal };
  vm.runInNewContext(source, context);
  return context.exports.productosApi;
}

test("conecta los cinco endpoints y envía JSON numérico", async () => {
  const llamadas = [];
  const producto = { id: 7, nombre: "Cuaderno", precio: 12.5, stock: 3 };
  const api = cliente(async (url, options) => {
    llamadas.push({ url, options });
    if (options.method === "DELETE") return new Response(null, { status: 204 });
    return Response.json(url.endsWith("/7") || options.method ? producto : [producto]);
  });
  assert.deepEqual(await api.listar(), [producto]);
  assert.deepEqual(await api.obtener(7), producto);
  const datos = { nombre: "Cuaderno", precio: 12.5, stock: 3 };
  assert.deepEqual(await api.crear(datos), producto);
  assert.deepEqual(await api.actualizar(7, datos), producto);
  assert.equal(await api.eliminar(7), undefined);
  assert.deepEqual(llamadas.map(({ url, options }) => [url, options.method ?? "GET"]), [
    ["https://api.example.com/api/productos", "GET"],
    ["https://api.example.com/api/productos/7", "GET"],
    ["https://api.example.com/api/productos", "POST"],
    ["https://api.example.com/api/productos/7", "PUT"],
    ["https://api.example.com/api/productos/7", "DELETE"],
  ]);
  assert.deepEqual(JSON.parse(llamadas[2].options.body), datos);
  assert.equal(llamadas[2].options.headers["Content-Type"], "application/json");
  assert.equal(llamadas[0].options.cache, "no-store");
});

test("muestra los errores del backend y tolera errores no JSON", async () => {
  await assert.rejects(cliente(async () => Response.json({ error: "Producto no encontrado" }, { status: 404 })).obtener(7), /Producto no encontrado/);
  await assert.rejects(cliente(async () => new Response("Bad Gateway", { status: 502 })).listar(), /502/);
});

test("informa fallos de red y configuración ausente", async () => {
  await assert.rejects(cliente(async () => { throw new TypeError("Failed to fetch"); }).listar(), /No se pudo contactar al backend/);
  await assert.rejects(cliente(() => { throw new Error("No debe llamar fetch"); }, "").listar(), /NEXT_PUBLIC_API_URL/);
});

test("pasa la señal de cancelación a fetch", async () => {
  const controller = new AbortController();
  const api = cliente(async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    return Response.json([]);
  });
  await api.listar(controller.signal);
});
