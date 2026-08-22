# ⚖️ Guía Regulatoria SICE-TAC y Algoritmo de Liquidación de Fletes

> **Marco Normativo del Ministerio de Transporte de Colombia y Lógica de Cómputo**  
> *Versión 2.0.0 — Normativa Vigente (Resolución 20213040034345)*

---

## 📜 1. Marco Legal: ¿Qué es SICE-TAC?

El **SICE-TAC** (*Sistema de Información de Costos Eficientes para el Transporte Automotor de Carga*) es la herramienta oficial obligatoria expedida por el **Ministerio de Transporte de Colombia** y vigilada por la **Superintendencia de Transporte**.

### Objetivos del Marco Regulatorio:
1. **Piso Tarifario Mínimo**: Prohíbe pagar fletes por debajo de los costos operativos eficientes para proteger a los transportadores.
2. **Estructura Transparente de Costos**: Desglosa costos fijos (capital, seguros, salarios), variables (combustible, peajes, llantas, mantenimiento) y costos de cargue/descargue.
3. **Fiscalización y Control**: Las empresas de transporte están obligadas a registrar el manifiesto de carga electrónico con los valores liquidados bajo este estándar.

---

## 🧮 2. Modelo Matemático y Algoritmo de Liquidación

La plataforma implementa un motor determinista en TypeScript (`SiceTacLiquidationEngine`) que resuelve el costo de transporte en microsegundos:

$$\text{Costo Total} = \text{round}\Big( (\text{Costo Base Ruta} + (\text{Costo por Tonelada} \times \text{Peso})) \times \text{Multiplicador Vehicular} + (\text{Cantidad Peajes} \times \text{Tarifa Promedio Peaje}) \Big)$$

### Parámetros de la Fórmula:

| Variable | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `baseCost` | Fijo | Costo operativo base del corredor vial (distancia, tiempos de espera) | `$1,200,000 COP` |
| `costPerTon` | Variable | Tarifa incremental por cada tonelada de carga transportada | `$85,000 COP / Ton` |
| `weightTons` | Entrada | Peso neto de la mercancía en toneladas | `10 Toneladas` |
| `vehicleType` | Factor | Multiplicador de tracción y configuración de ejes | `TURBO (1.15x)`, `SENCILLO (1.30x)`, `MINI_VANS (0.90x)` |
| `peajesCount` | Regulado | Número de estaciones de peaje en la ruta oficial | `4 Peajes` |
| `peajePromedio` | Constante | Tarifa estándar de peaje para transporte de carga (2026) | `$14,500 COP` |

---

## 🚛 3. Tipologías Vehiculares Homologadas

```text
+-------------------+----------------------+--------------------------+
| Tipo de Vehículo  | Multiplicador Factor | Uso Típico en Colombia   |
+-------------------+----------------------+--------------------------+
| MINI_VANS         | 0.90x (-10%)         | Paquetería urbana express|
| TURBO (C2 Liviano)| 1.15x (+15%)         | Rutas de montaña (ejes)  |
| SENCILLO (C2/C3)  | 1.30x (+30%)         | Carga interdepartamental |
+-------------------+----------------------+--------------------------+
```

---

## 📅 4. Recargos por Días Festivos y Ley Emiliani (Algoritmo de Gauss)

El transporte de carga en Colombia experimenta restricciones de movilidad (decretadas por la Dirección de Tránsito y Transporte) y recargos laborales en días festivos.

La plataforma cuenta con un motor autónomo (`ColombiaHolidayProvider`):
1. **Festivos Fijos Nacionales**: 1 de Enero, 1 de Mayo, 20 de Julio, 7 de Agosto, 8 y 25 de Diciembre.
2. **Festivos Móviles (Ley Emiliani - Ley 51 de 1983)**: Reyes Magos, San José, San Pedro y San Pablo, Asunción, Día de la Raza, Todos los Santos, Independencia de Cartagena trasladados al lunes siguiente.
3. **Semana Santa (Cálculo Astronómico de Gauss)**:
   - Se computa el Domingo de Pascua mediante la fórmula de Gauss:
     $$a = \text{año} \pmod{19},\quad b = \text{año} \pmod{4},\quad c = \text{año} \pmod{7}$$
     $$d = (19a + M) \pmod{30},\quad e = (2b + 4c + 6d + N) \pmod{7}$$
   - Derivación automática de Jueves Santo, Viernes Santo, Ascensión del Señor, Corpus Christi y Sagrado Corazón.

---

## ⚡ 5. Estrategia de Caché Multinivel para Fricción Cero (0ms)

Para evitar la saturación de MariaDB cuando cientos de usuarios cotizan simultáneamente:

```text
  [ Petición de Cotización ]
               │
               ▼
   [ Capa 1: Memoria RAM LRU ]  <=== (Hit en 0ms - Rutas frecuentes)
               │ (Miss)
               ▼
   [ Capa 2: Redis Cluster ]    <=== (Hit en microsegundos - TTL 30m)
               │ (Miss)
               ▼
   [ Capa 3: MariaDB Tabla ]    <=== (Consulta SQL - Sincroniza L1 y L2)
```
