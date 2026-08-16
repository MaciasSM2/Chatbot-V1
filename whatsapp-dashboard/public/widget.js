/**
 * @file widget.js
 * @description Script cliente ultraliviano (Vanilla JS) que inicializa la ventana del chat.
 */

(function () {
  'use strict';

  // Extraer parámetros del atributo del script ejecutable
  const currentScript = document.currentScript;
  const tenantId = currentScript ? currentScript.getAttribute('data-tenant') : 'tenant-demo-01';
  const chatType = currentScript ? currentScript.getAttribute('data-chat-type') : 'HYBRID';
  const apiHost = currentScript ? currentScript.getAttribute('data-host') : window.location.origin;

  if (document.getElementById('prochat-widget-root')) return;

  // 1. Crear el contenedor anfitrión en el DOM principal
  const hostDiv = document.createElement('div');
  hostDiv.id = 'prochat-widget-root';
  document.body.appendChild(hostDiv);

  // 2. Crear el Shadow Root para aislamiento CSS absoluto
  const shadowRoot = hostDiv.attachShadow({ mode: 'open' });

  // 3. Estilos encapsulados dentro del Shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .widget-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: #10b981;
      color: #ffffff;
      border: none;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: transform 0.2s ease;
    }
    .widget-button:hover { transform: scale(1.08); }
    .widget-window {
      position: fixed;
      bottom: 86px;
      right: 20px;
      width: 360px;
      height: 480px;
      background-color: #141517;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      font-family: system-ui, sans-serif;
      color: #ffffff;
    }
    .widget-window.open { display: flex; }
    .widget-header {
      background-color: #1c1e21;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-weight: bold;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .widget-body {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .msg { max-width: 80%; padding: 8px 12px; border-radius: 12px; line-height: 1.4; }
    .msg.user { background-color: #064e3b; color: #ecfdf5; align-self: flex-end; }
    .msg.bot { background-color: #27272a; color: #f4f4f5; align-self: flex-start; }
    .widget-footer {
      padding: 8px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      gap: 6px;
    }
    .widget-input {
      flex: 1;
      background-color: #27272a;
      border: none;
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      outline: none;
    }
    .widget-send {
      background-color: #10b981;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
    }
  `;

  // 4. Estructura HTML interna
  const container = document.createElement('div');
  container.innerHTML = `
    <button class="widget-button" id="toggle-btn">💬</button>
    <div class="widget-window" id="window">
      <div class="widget-header">
        <span>Asistente Virtual ProChat</span>
        <span style="cursor:pointer;" id="close-btn">✕</span>
      </div>
      <div class="widget-body" id="messages">
        <div class="msg bot">¡Hola! ¿En qué puedo ayudarte el día de hoy?</div>
      </div>
      <div class="widget-footer">
        <input type="text" class="widget-input" id="input" placeholder="Escribe tu mensaje..." />
        <button class="widget-send" id="send-btn">Enviar</button>
      </div>
    </div>
  `;

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(container);

  // 5. Lógica de Interacción
  const toggleBtn = shadowRoot.getElementById('toggle-btn');
  const closeBtn = shadowRoot.getElementById('close-btn');
  const chatWindow = shadowRoot.getElementById('window');
  const input = shadowRoot.getElementById('input');
  const sendBtn = shadowRoot.getElementById('send-btn');
  const messagesBox = shadowRoot.getElementById('messages');

  function toggle() {
    chatWindow.classList.toggle('open');
  }

  toggleBtn.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.textContent = text;
    messagesBox.appendChild(userMsg);
    input.value = '';
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const response = await fetch(`${apiHost}/api/v2/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, chatType, text }),
      });

      const json = await response.json();
      const botMsg = document.createElement('div');
      botMsg.className = 'msg bot';

      if (json.success && json.data) {
        botMsg.textContent = json.data.responseText;
      } else {
        botMsg.textContent = 'Ocurrió un error al procesar la respuesta.';
      }

      messagesBox.appendChild(botMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'msg bot';
      errorMsg.textContent = 'Error de conexión con el servidor.';
      messagesBox.appendChild(errorMsg);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
