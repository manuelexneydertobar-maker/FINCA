FINCA LA ESPERANZA — App de campo (demo funcional)
====================================================

Cómo abrirla
------------
1. Descomprime la carpeta.
2. Abre el archivo "index.html" en el navegador de tu celular o computador
   (haciendo doble clic, o "Abrir con > Navegador").
3. No necesita instalación ni internet: funciona directo desde el archivo.

Cómo entrar
------------
Escribe cualquier usuario y contraseña (por ejemplo: maria.rojas / 1234) y
toca "Ingresar". El acceso queda guardado en el dispositivo aunque no haya
señal, tal como se explica en la propuesta.

Qué puedes probar
------------------
- Panel principal: resumen de cosecha, insumos, trabajadores y pendientes.
- Cosechas: registrar una nueva cosecha (botón "+ Nueva cosecha").
- Inventario: ver y registrar insumos, con alerta de stock bajo.
- Trabajadores: ver el personal y marcar presente / ausente tocando la
  etiqueta de estado.
- Reportes: consolidado de cosecha, insumos y asistencia.
- Configuración: cuenta, cambios de sincronización y notificaciones.

Simular el campo sin internet
-------------------------------
Arriba a la derecha hay un botón "Sin señal / Señal satelital".
- Con la señal APAGADA, todo lo que registres queda como "Pendiente"
  (se guarda solo en este dispositivo, con LocalStorage).
- Al tocar el botón para ENCENDER la señal, la app avisa que detectó
  conexión satelital y sincroniza automáticamente los registros
  pendientes (si la opción "Sincronizar automáticamente" está activada
  en Configuración). También puedes sincronizar manualmente con el
  botón "Sincronizar ahora" que aparece en el Panel principal.

Restablecer los datos de ejemplo
----------------------------------
En Configuración > "Restablecer datos de ejemplo" puedes borrar todo lo
guardado en el navegador y volver a cargar los datos de muestra
(trabajadores, cosechas e insumos de ejemplo).

Tecnología usada
-----------------
HTML + CSS + JavaScript puro (sin librerías externas ni conexión a
internet), tal como se plantea en la propuesta técnica: una misma
aplicación que funciona igual en celular, tablet o computador desde
el navegador.

Grupo 6
