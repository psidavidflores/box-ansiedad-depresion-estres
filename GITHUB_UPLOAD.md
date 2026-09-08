# Cómo subir este Box a GitHub Pages

## Repositorio recomendado

Crear un repositorio público con este nombre exacto:

`box-ansiedad-depresion-estres`

Después, subir **el contenido de esta carpeta**. No subir la carpeta contenedora completa como una carpeta adicional.

## Configuración de la página

En GitHub abrir `Settings` → `Pages` y seleccionar:

- `Source`: `Deploy from a branch`
- `Branch`: `main`
- carpeta: `/docs`

Guardar y esperar a que GitHub publique la página en:

`https://psidavidflores.github.io/box-ansiedad-depresion-estres/`

## Recomendación para la primera carga

Este paquete pesa aproximadamente 569 MB. Para esta cantidad de material conviene usar GitHub Desktop o Git desde una carpeta local, no el botón de subida del navegador. La carga puede tardar mientras GitHub procesa los PDF y las vistas previas.

## Antes de publicar

Confirmar autorización de distribución para cada libro, manual, test, hoja de corrección, presentación y documento. La página está técnicamente preparada, pero la publicación pública requiere revisar derechos de autor y licencias.

## Actualizaciones posteriores

Para añadir material, copiarlo dentro de `docs/recursos/`, regenerar `docs/resources.json` y agregar la vista previa cuando corresponda. No cambiar la ruta del repositorio sin actualizar `docs/site-config.js` y el PDF de acceso.
