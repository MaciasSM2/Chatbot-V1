/**
 * @file exportTestLogs.js
 * @description Genera un reporte descargable del escenario y la conversación.
 */

export const exportTestLogs = (messages = [], config = {}) => {
  const report = {
    testDate: new Date().toISOString(),
    configUsed: config, // El objeto del Wizard
    metrics: {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.sender === 'user').length,
      botMessages: messages.filter(m => m.sender === 'bot').length
    },
    conversation: messages.map(m => ({
      time: m.timestamp || new Date().toISOString(),
      from: m.sender,
      body: m.text
    }))
  };

  // Crear el archivo para descarga
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `test_log_${Date.now()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  console.log("✅ Log de test exportado con éxito.");
};
