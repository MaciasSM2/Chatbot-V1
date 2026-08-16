/**
 * @file exportTestLogs.js
 * @description Genera un reporte descargable del escenario y la conversación.
 */

export const exportTestLogs = (messages: any[] = [], config: any = {}) => {
  const report = {
    testDate: new Date().toISOString(),
    configUsed: config,
    metrics: {
      totalMessages: messages.length,
      userMessages: messages.filter((m: any) => m.sender === 'user').length,
      botMessages: messages.filter((m: any) => m.sender === 'bot').length
    },
    conversation: messages.map((m: any) => ({
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
