# 📲 Guía Oficial de Vinculación con Meta WhatsApp Cloud API

> **Configuración en Meta for Developers, Webhooks, Tokens Permanentes y Verificación HMAC**  
> *Versión 2.0.0 — Integración con Meta Graph API v21.0*

---

## 🛠️ Paso 1: Configurar la App en Meta for Developers

1. Ingrese a [Meta for Developers](https://developers.facebook.com/) con su cuenta comercial.
2. Haga clic en **"Mis Apps" (My Apps)** ➔ **"Crear App" (Create App)**.
3. Seleccione el tipo de aplicación: **"Otro" (Other)** ➔ Caso de uso: **"Negocios" (Business)**.
4. Asigne un nombre al proyecto y vincúlelo a su **Meta Business Manager**.

---

## 🔑 Paso 2: Configurar el Producto de WhatsApp y Credenciales

1. En el panel lateral, seleccione **"Agregar productos"** ➔ **WhatsApp** ➔ **"Configurar"**.
2. Diríjase a **WhatsApp** ➔ **API Setup** y obtenga:
   - **Phone Number ID**: Identificador numérico del teléfono (asignar a variable `WA_PHONE_NUMBER_ID`).
   - **WhatsApp Business Account ID (WABA ID)**: Identificador de la cuenta comercial.
   - **Temporary Access Token**: Token de prueba inicial.

> [!IMPORTANT]
> **Generar Token Permanente de Producción (System User Token)**:
> Para que el bot no se desconecte cada 24 horas:
> 1. Vaya a **Meta Business Manager** ➔ **Configuración del Negocio** ➔ **Usuarios del Sistema (System Users)**.
> 2. Cree un usuario con rol `Admin` y asigne el permiso `whatsapp_business_messaging`.
> 3. Genere el token permanente y guárdelo como `WA_ACCESS_TOKEN`.

---

## 🔒 Paso 3: Obtener el App Secret (Para Validación HMAC SHA-256)

1. Vaya a **Configuración de la App (App Settings)** ➔ **Básica (Basic)**.
2. Copie el campo **App Secret** (Clave secreta de la app).
3. Asígnelo en el backend como `APP_SECRET`. Esto permite al middleware `UnifiedSignatureValidator` autenticar que cada mensaje proviene genuinamente de los servidores de Meta.

---

## 🌐 Paso 4: Registrar y Suscribir el Webhook

1. En la consola de desarrolladores, vaya a **WhatsApp** ➔ **Configuration**.
2. En la sección **Webhook**, haga clic en **"Editar" (Edit)**:
   - **URL de Devolución de Llamada (Callback URL)**: `https://tu-dominio.com/webhook` (o `https://tu-dominio.com/api/webhook`).
   - **Token de Verificación (Verify Token)**: El mismo valor que definió en `META_VERIFY_TOKEN` en su archivo `.env`.
3. Haga clic en **"Verificar y Guardar"**. El backend de Express 5 responderá al handshake en < 5ms.
4. En **Webhook Fields**, haga clic en **"Administrar" (Manage)** y suscríbase al campo obligatorio:
   - `messages` (Recibe mensajes de texto, audios, imágenes y estados de entrega).

---

## 🧪 Paso 5: Prueba de Conectividad en Vivo

Envíe un mensaje de texto de prueba desde cualquier cuenta personal de WhatsApp hacia el número de teléfono configurado en Meta:
1. El backend registrará la petición en los logs: `[Webhook] Mensaje entrante autenticado con HMAC SHA-256`.
2. El bot responderá automáticamente iniciando el flujo FSM (Saludo y Registro).
3. El panel administrativo Next.js (`/admin/inicio`) reflejará la conversación en tiempo real mediante WebSockets.
