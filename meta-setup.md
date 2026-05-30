# Guía de Puesta en Marcha en Producción y Vinculación con Meta Webhooks 🚀

Esta guía detalla el proceso completo para llevar el chatbot de WhatsApp y su panel administrativo a un servidor en la nube con un dominio real, certificados SSL/TLS y conexión con la API de Meta.

---

## 📅 Paso 1: Configurar la App en Meta (Facebook Developers)

1. **Creación de Cuenta y App:**
   - Ve a [Meta for Developers](https://developers.facebook.com/) e inicia sesión.
   - Haz clic en **"My Apps"** -> **"Create App"**.
   - Elige el tipo de app **"Other"** -> Selecciona **"Business"** como caso de uso.
   - Asigna un nombre a la app y vincúlala a tu cuenta comercial de Meta Business Manager.

2. **Agregar el Producto de WhatsApp:**
   - En el panel de control de tu app, busca la sección **"Add products to your app"**.
   - Busca **"WhatsApp"** y haz clic en **"Set up"**.

3. **Obtención de Identificadores Iniciales:**
   - Dirígete a **WhatsApp** -> **API Setup**.
   - Aquí encontrarás:
     - **Phone Number ID:** Úsalo como valor para `WA_PHONE_NUMBER_ID`.
     - **Temporary Access Token:** Úsalo inicialmente como `WA_ACCESS_TOKEN`.
     - *Nota:* Para producción, genera un **System User Token** permanente en la configuración del Business Manager para evitar la expiración a las 24 horas.

4. **Obtención del App Secret (Firma HMAC):**
   - Ve a **App settings** -> **Basic**.
   - Copia el campo **App Secret** (haz clic en *Show*). Úsalo como `APP_SECRET` para habilitar la validación segura de firmas timing-safe.

---

## 🔒 Paso 2: Adquisición de Certificados SSL/TLS Reales (HTTPS)

Meta exige estrictamente que la URL de tu webhook utilice el protocolo seguro **HTTPS** con un certificado SSL válido.

### Método Recomendado: Let's Encrypt (Certbot) en tu Servidor VPS (Ubuntu/Debian)

1. **Instalar Certbot y Nginx localmente en el Host:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Obtener el certificado SSL:**
   Reemplaza `tu-dominio.com` por tu dominio público apuntado a la IP del VPS:
   ```bash
   sudo certbot certonly --standalone -d tu-dominio.com
   ```
   *Esto generará tus archivos en:* `/etc/letsencrypt/live/tu-dominio.com/`

3. **Configurar la Auto-Renovación automática:**
   Los certificados de Let's Encrypt duran 90 días. Verifica el cron de renovación:
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 🐳 Paso 3: Configurar Nginx Docker para Servir SSL

1. **Editar `docker-compose.yml` para producción:**
   Descomenta el montaje del volumen de certificados en el servicio de Nginx para que el contenedor pueda leer las claves generadas por Certbot:
   ```yaml
   nginx:
     ...
     volumes:
       - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
       - /etc/letsencrypt:/etc/letsencrypt:ro # Descomentado
   ```

2. **Habilitar Servidor SSL en `nginx/nginx.conf`:**
   Edita `./nginx/nginx.conf` y descomenta el bloque `server` que escucha en el puerto `443 ssl`. Asegúrate de reemplazar `tu-dominio.com` con tu nombre de dominio real.

---

## 🌐 Paso 4: Levantar la Infraestructura y Vincular en Meta

1. **Inicializar los contenedores en producción:**
   ```bash
   docker-compose up -d --build
   ```

2. **Comprobar conectividad:**
   - Tu Dashboard debe cargar de forma segura en: `https://tu-dominio.com`
   - Tu API de salud debe responder en: `https://tu-dominio.com/health`

3. **Vincular el Webhook en la Consola de Meta:**
   - Regresa a la consola de desarrolladores de Meta.
   - Ve a **WhatsApp** -> **Configuration**.
   - En **Webhook URL**, haz clic en **"Edit"**.
   - Configura:
     - **Callback URL:** `https://tu-dominio.com/api/webhook` (o `/webhook`)
     - **Verify Token:** El valor secreto que definiste en la variable `VERIFY_TOKEN` en tu `.env`.
   - Haz clic en **"Verify and save"**. Meta enviará una petición de handshake que tu backend validará y responderá de inmediato.

4. **Suscribirse a los Eventos de Mensajería:**
   - En la sección **Webhook fields**, haz clic en **"Manage"**.
   - Busca el campo **"messages"** y haz clic en **"Subscribe"**.
   - ¡Listo! Ahora, cualquier mensaje enviado al número de tu chatbot activará el flujo FSM, registrará el cliente dinámicamente y disparará las alertas correspondientes.
