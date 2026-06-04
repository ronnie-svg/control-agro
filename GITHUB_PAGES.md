# Publicar la app en GitHub Pages

La app visual esta en esta carpeta. Los archivos que debe tener el repositorio de GitHub son:

- `index.html`
- `styles.css`
- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`
- `src/`

No subas como app principal los archivos de Apps Script. Apps Script se copia en Google.

## Estructura

`index.html` es solo la entrada de la app.

La logica esta separada en:

- `src/screens/`: pantallas de la app.
- `src/components/`: piezas reutilizables.
- `src/data/`: almacenamiento local y API.
- `src/utils/`: formato, importes y archivos.

## Pasos

1. Crea un repositorio nuevo en GitHub, por ejemplo `control-agro`.
2. Sube los archivos de la app.
3. En GitHub entra en `Settings` > `Pages`.
4. En `Build and deployment`, elige `Deploy from a branch`.
5. Rama: `main`.
6. Carpeta: `/root`.
7. Guarda.

GitHub te dara una URL parecida a:

`https://TU_USUARIO.github.io/control-agro/`

Esa es la URL que debes abrir en el movil.

## Instalar en movil

- Android: Chrome > menu > `Anadir a pantalla de inicio`.
- iPhone: Safari > compartir > `Anadir a pantalla de inicio`.
