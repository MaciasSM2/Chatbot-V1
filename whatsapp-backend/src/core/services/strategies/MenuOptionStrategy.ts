import { IBotStrategy } from "./BotStrategy.interface";

export class MenuOptionStrategy implements IBotStrategy {
  async execute(userId: string, messageBody: string): Promise<{ nextStep: string; responseMessage: string }> {
    const option = messageBody.trim().toLowerCase();

    if (option === "1" || option.includes("soporte")) {
      return { nextStep: "WELCOME", responseMessage: "Has seleccionado Soporte. En breve un agente te atenderá." };
    }
    if (option === "2" || option.includes("ventas")) {
      return { nextStep: "WELCOME", responseMessage: "Nuestro catálogo digital está disponible en: www.tienda.com" };
    }
    if (option === "3" || option.includes("horarios")) {
      return { nextStep: "WELCOME", responseMessage: "Atendemos de Lunes a Viernes de 8:00 AM a 6:00 PM." };
    }

    return { nextStep: "AWAITING_MENU_OPTION", responseMessage: "Opción inválida. Por favor, selecciona 1, 2 o 3." };
  }
}

