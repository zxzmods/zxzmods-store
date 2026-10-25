const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_CEDULA_JURIDICA = "3-101-436132";

const legalDocuments = [
  {
    id: "terminos-condiciones",
    slug: "terminos-condiciones",
    order: 1,
    category: "GENERAL",
    titleEs: "Términos y Condiciones Generales de Uso de Plataforma y Venta",
    titleEn: "General Platform Terms & Conditions of Use and Sale",
    badgeEs: "Marco Legal & Contrato General",
    badgeEn: "Legal Framework & General Agreement",
    summaryEs:
      "Regulación contractual del acceso a la plataforma web de ZxZ Mods (Cédula Jurídica 3-101-436132), registro de usuarios, pedidos de compra, propiedad intelectual y competencia legal en Costa Rica bajo la Ley N° 7472.",
    summaryEn:
      "Contractual regulation governing access to the ZxZ Mods web platform (Corporate ID 3-101-436132), user registration, purchase orders, intellectual property, and legal jurisdiction in Costa Rica under Law No. 7472.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Ley N° 7472 de Promoción de la Competencia y Defensa Efectiva del Consumidor",
      "Código de Comercio de la República de Costa Rica (Ley N° 3284)",
      "Código Civil de Costa Rica",
    ]),
    contentEs: `## Cláusula 1: Identificación y Aceptación Contractual

El presente contrato regula los términos y condiciones de uso, acceso y contratación de servicios a través de la plataforma web oficial de **ZxZ Mods** (operada legalmente bajo la razón social **Tecnicas de Redes Y Sistemas A&V / ZxZ Mods Costa Rica S.A.**, Cédula Jurídica **3-101-436132**, en adelante "La Empresa"), con domicilio legal y sede operativa principal situada en Calle 34, Pozos, Santa Ana, San José, Costa Rica.

Al acceder, navegar, registrar una cuenta, agregar vehículos a la herramienta de Garaje Virtual, cotizar o realizar cualquier compra de piezas, combos o servicios de taller mecánico, el usuario (en adelante "El Cliente") declara ser mayor de edad, contar con capacidad legal plena para obligarse y aceptar de manera incondicional, expresa y sin reservas los presentes Términos y Condiciones. Si El Cliente no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar el sitio web y sus servicios asociados.

---

## Cláusula 2: Objeto y Naturaleza de las Operaciones

ZxZ Mods es una empresa costarricense especializada y dedicada a:
1. La venta y comercialización de repuestos de alto rendimiento, accesorios técnicos y componentes mecánicos para vehículos todo terreno (UTV, ATV, Side-by-Side) de marcas líderes mundiales (incluyendo CFMOTO, Can-Am, Polaris, Yamaha, Honda y Segway).
2. La importación directa bajo demanda y por encargo de repuestos y accesorios desde distribuidores autorizados y fabricantes en los Estados Unidos de América.
3. Servicios mecánicos especializados de taller físico, instalación a domicilio en territorio costarricense y calibración / reprogramación electrónica de computadoras de motor (ECU Tuning).

Las partes reconocen que la relación comercial se rige por la legislación mercantil y de protección al consumidor de la República de Costa Rica, particularmente la **Ley N° 7472** (Ley de Promoción de la Competencia y Defensa Efectiva del Consumidor) y su respectivo Reglamento Ejecutivo.

---

## Cláusula 3: Registro de Cuentas, Credenciales y Garaje Virtual

1. **Autenticación Segura:** El acceso a ciertas funcionalidades del sitio web (como el seguimiento de órdenes en tiempo real, cotización avanzada y vinculación del vehículo en el Garaje Virtual) requiere autenticación. La Empresa implementa protocolos de autenticación basados en Firebase Auth (Google OAuth, Facebook Login y códigos de verificación únicos enviados por correo electrónico).
2. **Custodia de Credenciales:** El Cliente es el único responsable de mantener la confidencialidad de su sesión y de sus dispositivos de acceso. Toda acción, pedido o confirmación realizada bajo su cuenta verificada se presumirá legalmente ejecutada por El Cliente.
3. **Ficha Técnica en Garaje Virtual:** El registro de un vehículo en el Garaje Virtual (Año, Marca, Modelo o YMM) constituye una herramienta orientativa para facilitar el filtrado de compatibilidad ("fitment"). El Cliente garantiza que los datos suministrados sobre su vehículo corresponden fielmente a la realidad técnica de la máquina.

---

## Cláusula 4: Formación del Pedido y Consentimiento Comercial

1. **Generación de Órdenes:** Las órdenes de compra generadas a través del sitio web no constituyen una venta final hasta tanto no se verifique el cumplimiento íntegro del procedimiento de pago estipulado en los **Acuerdos y Condiciones de Pago** de La Empresa.
2. **Disponibilidad y Tiempos de Suministro:** Debido a la naturaleza técnica y de alta especialización de los componentes, los inventarios pueden estar sujetos a rotación en bodegas internacionales (EE.UU.). Al colocar una orden, El Cliente acepta los plazos de importación y tránsito estipulados en la cláusula correspondiente.
3. **Precios y Moneda:** Todos los precios se muestran en Colones costarricenses (CRC) y Dólares de los Estados Unidos (USD). Las cotizaciones y montos pagaderos en colones emplean la tasa de venta de divisas de referencia calculada según la normativa del Banco Central de Costa Rica (BCCR).
4. **Plazos de Entrega como Estimaciones (No Garantías):** El plazo estándar de importación y entrega en Costa Rica comprende una ventana con un **mínimo de siete (7) días hábiles y un máximo de veintiún (21) días hábiles** contados tras la confirmación efectiva del pago. El Cliente acepta y comprende de manera expresa que **dichos plazos de entrega son estimaciones operativas y NO constituyen una garantía contractual de fecha fija**, encontrándose sujetos a inspecciones físicas o trámites de aduana (aforos fiscales en Costa Rica), demoras de transporte aéreo internacional y disponibilidad de inventario del fabricante. Por consiguiente, las variaciones en el tiempo estimado de entrega no constituirán causal de rescisión unilateral ni indemnización.

---

## Cláusula 5: Propiedad Intelectual e Industrial

Todos los logotipos, diseños, código fuente, interfaces visuales, gráficos, esquemas de compatibilidad, imágenes producidas por ZxZ Mods y textos contenidos en este sitio web son propiedad exclusiva de ZxZ Mods Costa Rica S.A. (Cédula Jurídica 3-101-436132) o se utilizan bajo licencia y autorización legal. Queda estrictamente prohibida su copia, reproducción, ingeniería inversa, extracción automatizada ("scraping") o distribución comercial sin consentimiento previo por escrito.

Las marcas comerciales de fabricantes de vehículos o accesorios (tales como Can-Am, Polaris, CFMOTO, Dynojet, SuperATV, Warn, etc.) se mencionan únicamente con carácter descriptivo e informativo para identificar la compatibilidad técnica de los repuestos, perteneciendo sus derechos a sus legítimos titulares.

---

## Cláusula 6: Modificaciones de los Términos

ZxZ Mods se reserva el derecho de actualizar, modificar o reemplazar cualquier sección de estos Términos y Condiciones en cualquier momento para ajustarse a cambios normativos o mejoras operativas. Las modificaciones entrarán en vigencia inmediatamente tras su publicación en esta pantalla oficial con su respectiva indicación de última actualización. El uso continuado del sitio web después de tales cambios constituirá la aceptación tácita de los mismos.

---

## Cláusula 7: Jurisdicción Territorial y Ley Aplicable

Para la resolución de cualquier controversia, litigio, interpretación o reclamación derivada de la validez, ejecución o terminación de estos términos o de las transacciones comerciales efectuadas en el sitio web, las partes renuncian expresamente a cualquier otro fuero que pudiera corresponderles y se someten de manera formal y exclusiva a la jurisdicción de los Tribunales Ordinarios de Justicia de San José, República de Costa Rica.`,
    contentEn: `## Clause 1: Corporate Identification and Contractual Acceptance

This agreement governs the terms and conditions of use, access, and contracting of services through the official web platform of **ZxZ Mods** (legally operated under **Tecnicas de Redes Y Sistemas A&V / ZxZ Mods Costa Rica S.A.**, Corporate Legal ID **3-101-436132**, hereinafter "The Company"), with registered legal domicile and main headquarters located at Calle 34, Pozos, Santa Ana, San José, Costa Rica.

By accessing, browsing, registering an account, adding vehicles to the Virtual Garage tool, requesting quotes, or purchasing any parts, combos, or mechanical workshop services, the user (hereinafter "The Client") declares to be of legal age, to possess full legal capacity to enter into binding contracts, and to unconditionally, expressly, and unreservedly accept these Terms and Conditions. If The Client does not agree with any provision set forth herein, they must refrain from using this website and its associated services.

---

## Clause 2: Scope and Nature of Operations

ZxZ Mods is a specialized Costa Rican company dedicated to:
1. The sale and distribution of high-performance aftermarket parts, technical accessories, and mechanical components for off-road powersports vehicles (UTV, ATV, Side-by-Side) from leading global manufacturers (including CFMOTO, Can-Am, Polaris, Yamaha, Honda, and Segway).
2. Direct on-demand importation of replacement parts and performance accessories from authorized distributors and manufacturers in the United States of America.
3. Specialized mechanical workshop services, mobile on-site installation across Costa Rica, and electronic engine control unit calibration/remapping (ECU Tuning).

Both parties acknowledge that their commercial relationship is governed by the commercial and consumer protection laws of the Republic of Costa Rica, specifically **Law No. 7472** (*Consumer Protection and Promotion of Competition Act*) and its Executive Regulations.

---

## Clause 3: Account Registration, Credentials, and Virtual Garage

1. **Secure Authentication:** Access to specific features of the website (such as real-time order tracking, advanced quoting, and linking vehicles in the Virtual Garage) requires authentication. The Company implements authentication protocols powered by Firebase Auth (Google OAuth, Facebook Login, and single-use verification codes sent via email).
2. **Safeguarding Credentials:** The Client is solely responsible for maintaining the confidentiality of their session and access devices. Any action, order, or confirmation executed under a verified account shall be legally presumed to have been performed by The Client.
3. **Virtual Garage Fitment Tool:** Registering a vehicle in the Virtual Garage (Year, Make, Model / YMM) serves as an orientation tool to streamline compatibility filtering ("fitment"). The Client warrants that all vehicle specifications entered accurately reflect the true mechanical configuration of their machine.

---

## Clause 4: Order Formation and Commercial Consent

1. **Order Generation:** Purchase orders generated through the website do not constitute a final binding sale until full compliance with the payment verification procedure set forth in The Company's **Payment Agreements & Bank Transfer Terms** has been confirmed.
2. **Availability and Lead Times:** Due to the specialized nature of high-performance powersports components, inventory levels rotate across international warehouses (USA). By placing an order, The Client accepts the import and transit lead times established in the corresponding policy.
3. **Pricing and Currency:** All prices are displayed in Costa Rican Colones (CRC) and United States Dollars (USD). Quotes and amounts payable in Colones apply the official reference exchange sell rate published by the Central Bank of Costa Rica (BCCR).
4. **Delivery Timeframes as Estimates (Not Fixed Guarantees):** The standard import and delivery window in Costa Rica spans a **minimum of seven (7) business days and a maximum of twenty-one (21) business days** following effective payment confirmation. The Client expressly understands and agrees that **these delivery timeframes are operational estimates and DO NOT constitute a fixed-date contractual guarantee**, as shipments are subject to Costa Rican Customs physical inspections, international air freight schedules, and manufacturer inventory availability. Variations in estimated transit times shall not constitute grounds for unilateral cancellation or compensation.

---

## Clause 5: Intellectual and Industrial Property

All logos, designs, source code, visual interfaces, graphics, compatibility charts, images produced by ZxZ Mods, and written content on this website are the exclusive property of ZxZ Mods Costa Rica S.A. (Corporate ID 3-101-436132) or are used under valid license. Any reproduction, reverse engineering, automated scraping, or commercial distribution without prior written consent is strictly prohibited.

Vehicle and aftermarket brand names (such as Can-Am, Polaris, CFMOTO, Dynojet, SuperATV, Warn, etc.) are referenced strictly for descriptive compatibility identification and remain the property of their respective trademark owners.

---

## Clause 6: Amendments to Terms

ZxZ Mods reserves the right to update, amend, or replace any section of these Terms and Conditions at any time to comply with regulatory changes or operational improvements. Amendments take effect immediately upon publication on this official page. Continued use of the platform constitutes acceptance of the updated terms.

---

## Clause 7: Territorial Jurisdiction and Governing Law

For the resolution of any dispute, claim, or legal interpretation arising from these terms or transactions conducted on the platform, both parties expressly waive any other venue and submit exclusively to the jurisdiction of the Ordinary Courts of Justice of San José, Republic of Costa Rica.`,
  },
  {
    id: "acuerdos-pago",
    slug: "acuerdos-pago",
    order: 2,
    category: "PAYMENTS",
    titleEs: "Acuerdos y Condiciones de Pago y Transferencias Bancarias",
    titleEn: "Payment Agreements & Official Bank Transfer Terms",
    badgeEs: "Pagos Exclusivos por Transferencia Bancaria",
    badgeEn: "Strictly Bank Transfers Only • No SINPE Móvil",
    summaryEs:
      "Condiciones contractuales obligatorias para la liquidación de órdenes mediante transferencia bancaria oficial IBAN en CRC y USD. Sin SINPE Móvil. Exención total de responsabilidad por errores del cliente.",
    summaryEn:
      "Mandatory contractual terms for settling orders exclusively via official IBAN bank transfers in CRC and USD. Strictly NO SINPE Móvil accepted. Full liability waiver for client transfer errors.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código de Comercio de Costa Rica (Normativa de Transferencias y Depósitos Bancarios)",
      "Código Penal de Costa Rica (Delitos de Estafa Informática y Falsificación de Documento)",
      "Reglamento del Sistema de Pagos del Banco Central de Costa Rica",
    ]),
    contentEs: `## Cláusula 1: Modalidad Exclusiva de Pago

En ZxZ Mods Costa Rica S.A. (Cédula Jurídica **3-101-436132**), por estrictas políticas de control fiscal, trazabilidad financiera y seguridad corporativa, **NO SE ACEPTA SINPE MÓVIL NI PAGOS INFORMALES EN EFECTIVO SIN REGISTRO**. 

Todas las transacciones, compras de productos, adelantos de importación y liquidaciones de servicios mecánicos deben realizarse **ÚNICA Y EXCLUSIVAMENTE mediante transferencia bancaria formal a las cuentas corrientes / IBAN oficiales de la empresa** en las entidades bancarias legalmente autorizadas en Costa Rica (tales como BAC Credomatic o Banco Nacional de Costa Rica), tanto en Colones (CRC) como en Dólares (USD), según se listen en el checkout oficial.

---

## Cláusula 2: Cuentas Oficiales y Validación de Fondos

1. **Cuentas Habilitadas:** Las únicas cuentas bancarias autorizadas para recibir fondos son aquellas provistas y desplegadas explícitamente dentro del flujo de compra (Checkout) de este sitio web oficial. Cualquier instrucción recibida por canales no verificados, llamadas no autorizadas o perfiles de terceros carece de toda validez legal.
2. **Acreditación Efectiva de Fondos:** Ninguna orden de compra será procesada, ningún repuesto será ordenado al distribuidor en Estados Unidos y ninguna cita de instalación en taller o a domicilio será confirmada hasta tanto los fondos transferidos se encuentren **100% acreditados, compensados e inspeccionados** en las cuentas de ZxZ Mods Costa Rica S.A. por parte de nuestro departamento contable.
3. **Transferencias Interbancarias:** En transferencias realizadas desde bancos distintos al banco de destino de La Empresa, El Cliente asume que el periodo de compensación del Sistema Nacional de Pagos Electrónicos (SINPE interbancario estándar) puede demorar entre 2 y 24 horas hábiles. La fecha oficial de inicio de procesamiento de la orden será aquella en la que los fondos queden acreditados en firme.

---

## Cláusula 3: Exención Total de Responsabilidad por Errores de Transferencia

1. **Responsabilidad Exclusiva de El Cliente:** El Cliente es el único y exclusivo responsable de digitar con total exactitud los números de cuenta IBAN, la moneda correspondiente (CRC o USD) y el monto total exacto liquidado.
2. **Depósitos en Cuentas Equivocadas:** ZxZ Mods Costa Rica S.A. **NO se hace responsable bajo ninguna circunstancia por dineros o fondos transferidos por El Cliente a cuentas bancarias erróneas, números de cuenta digitados equivocadamente o cuentas pertenecientes a terceras personas**. La Empresa no tiene la facultad legal ni la obligación de tramitar la recuperación de fondos enviados a terceros ajenos a la razón social.
3. **Montos Incompletos:** Si El Cliente transfiere un monto menor al total de la orden generada, la orden permanecerá en estado retenido ("En Espera de Pago Completo") y no se iniciará la importación de piezas hasta la liquidación de la diferencia restante.

---

## Cláusula 4: Comprobantes de Pago y Cero Tolerancia al Fraude

1. **Carga Obligatoria de Comprobante:** Para someter una orden a revisión contable, El Cliente debe adjuntar una copia digital legible, íntegra y oficial del comprobante emitido por la plataforma bancaria (JPG, PNG o PDF), donde conste claramente:
   - Número de referencia de la transferencia bancaria.
   - Cuenta de origen y cuenta IBAN de destino oficial de ZxZ Mods.
   - Monto y moneda transferida.
   - Fecha y hora exacta de la transacción.
2. **Falsificación o Alteración:** El envío, carga o presentación de comprobantes de pago falsos, editados, reutilizados, simulados o no respaldados por débitos bancarios reales constituirá causal inmediata de anulación irrevocable de la orden y el bloqueo permanente de la cuenta del usuario.
3. **Acciones Penales:** ZxZ Mods Costa Rica S.A. se reserva el derecho expreso de interponer de inmediato la correspondiente **denuncia penal ante el Organismo de Investigación Judicial (OIJ) y el Ministerio Público de Costa Rica** por los presuntos delitos de Estafa Informática, Falsificación de Documentos Privados y Tentativa de Fraude (Artículos 216, 217 bis y concordantes del Código Penal de Costa Rica).

---

## Cláusula 5: Moneda y Tipo de Cambio Aplicable

1. **Doble Denominación:** Los precios se publican en Colones (CRC) y Dólares de los Estados Unidos de América (USD).
2. **Tipo de Cambio Oficial:** En caso de que El Cliente decida liquidar en Colones una orden cuyo valor base esté presupuestado en Dólares (o viceversa), se aplicará estrictamente el tipo de cambio de venta de divisas de referencia publicado por el Banco Central de Costa Rica (BCCR) correspondiente al día en que se efectúe la liquidación.`,
    contentEn: `## Clause 1: Exclusive Payment Method (Bank Transfers Only)

At ZxZ Mods Costa Rica S.A. (Corporate Legal ID **3-101-436132**), due to strict tax compliance, financial traceability, and corporate security policies, **SINPE MÓVIL AND UNREGISTERED INFORMAL CASH PAYMENTS ARE NOT ACCEPTED UNDER ANY CIRCUMSTANCE**.

All transactions, product purchases, import orders, and mechanical service settlements must be completed **EXCLUSIVELY via formal bank wire/transfer to The Company's official IBAN corporate bank accounts** at authorized financial institutions in Costa Rica (such as BAC Credomatic or Banco Nacional de Costa Rica), in either Costa Rican Colones (CRC) or US Dollars (USD), as displayed during official Checkout.

---

## Clause 2: Official Bank Accounts and Clearing of Funds

1. **Authorized Accounts:** The only bank accounts authorized to receive payments are those explicitly displayed within the official Checkout workflow of this website. Any payment instruction received through unverified channels, unauthorized phone calls, or third-party profiles has zero legal validity.
2. **Effective Clearing of Funds:** No purchase order will be processed, no parts will be ordered from US distributors, and no workshop or mobile installation appointment will be confirmed until transferred funds are **100% credited, cleared, and verified** in the corporate bank accounts of ZxZ Mods Costa Rica S.A. by our accounting department.
3. **Interbank Transfers:** For transfers initiated from banks different from The Company's receiving bank, The Client acknowledges that standard interbank clearing (SINPE interbank EFT) may take between 2 and 24 business hours. Order processing officially begins only when funds are firmly credited.

---

## Clause 3: Full Liability Waiver for Client Transfer Errors

1. **Sole Responsibility of The Client:** The Client is solely and exclusively responsible for accurately entering the IBAN account numbers, selecting the matching currency (CRC or USD), and transferring the exact order total.
2. **Transfers to Incorrect Accounts:** ZxZ Mods Costa Rica S.A. **assumes ZERO liability under any circumstance for funds transferred by The Client to wrong bank accounts, mistyped IBAN numbers, or accounts belonging to third parties**. The Company has neither the legal authority nor the obligation to recover funds sent to external third-party accounts.
3. **Partial or Incomplete Payments:** If The Client transfers an amount lower than the invoiced order total, the order will remain on hold ("Awaiting Full Payment") and part importation will not commence until the remaining balance is settled in full.

---

## Clause 4: Payment Receipts and Zero-Tolerance Anti-Fraud Policy

1. **Mandatory Receipt Upload:** To submit an order for accounting verification, The Client must upload a clear, unaltered digital copy of the official bank transfer receipt (JPG, PNG, or PDF) clearly displaying:
   - Official bank transfer reference/confirmation number.
   - Source account and destination ZxZ Mods IBAN account.
   - Exact amount and currency transferred.
   - Date and timestamp of the transaction.
2. **Forgery or Tampering:** Uploading or submitting falsified, edited, reused, or simulated payment receipts not backed by actual bank settlements will result in immediate, irrevocable order cancellation and permanent account termination.
3. **Criminal Prosecution:** ZxZ Mods Costa Rica S.A. expressly reserves the right to immediately file a **formal criminal complaint before the Judicial Investigation Department (OIJ) and the Public Prosecutor's Office of Costa Rica** for Computer Fraud, Forgery of Private Documents, and Attempted Fraud (Articles 216, 217 bis, and related provisions of the Costa Rican Penal Code).

---

## Clause 5: Currency and Applicable Exchange Rate

1. **Dual Currency Display:** Prices are published in Costa Rican Colones (CRC) and United States Dollars (USD).
2. **Official Exchange Rate:** Whenever an order priced in USD is settled in CRC (or vice versa), the official reference USD sell rate published by the Central Bank of Costa Rica (BCCR) on the date of payment shall strictly apply.`,
  },
  {
    id: "poliza-garantia",
    slug: "poliza-garantia",
    order: 3,
    category: "WARRANTIES",
    titleEs: "Póliza Oficial de Garantía y Defectos de Fábrica",
    titleEn: "Official Warranty Policy & Factory Manufacturing Defects",
    badgeEs: "60 Días Taller • 90 Días Bolt-On • Cero Devoluciones",
    badgeEn: "60-Day Labor • 90-Day Bolt-On • Zero Returns Policy",
    summaryEs:
      "Términos oficiales de garantía por escrito: 60 días en mano de obra técnica, 90 días en piezas mecánicas bolt-on y calibración ECU de por vida. Política estricta: NO se aceptan devoluciones de ningún tipo, únicamente fallos de fábrica comprobados.",
    summaryEn:
      "Written warranty terms: 60 days on technical labor, 90 days on bolt-on mechanical parts, and lifetime ECU software file coverage. Strict policy: NO returns or refunds of any kind are accepted—ONLY proven factory manufacturing defects.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Artículo 43 y concordantes de la Ley N° 7472 de Protección al Consumidor",
      "Reglamento Ejecutivo N° 37899-MEIC a la Ley de Defensa del Consumidor",
      "Código Civil de Costa Rica (Régimen de Vicios Ocultos)",
    ]),
    contentEs: `## Cláusula 1: Principio Fundamental de Cero Devoluciones

**EN ZXZ MODS COSTA RICA S.A. (CÉDULA JURÍDICA 3-101-436132) NO SE ACEPTA NINGÚN TIPO DE DEVOLUCIÓN NI REEMBOLSO BAJO NINGUNA CIRCUNSTANCIA, EXCEPTO ÚNICA Y EXCLUSIVAMENTE POR FALLOS O DEFECTOS DE FÁBRICA COMPROBADOS MEDIANTE INSPECCIÓN TÉCNICA OFICIAL.**

Debido a que nuestros repuestos son componentes especializados de alto rendimiento automotriz importados expresamente desde los Estados Unidos de América para configuraciones específicas de vehículos (Año, Marca, Modelo), **no se aceptan devoluciones por:**
- Arrepentimiento de compra o cambio de opinión del cliente.
- Compra errónea de repuestos realizada por El Cliente sin haber solicitado asesoría técnica escrita de compatibilidad a nuestro equipo.
- Incompatibilidad generada por modificaciones mecánicas o estructurales no originales que el cliente haya realizado previamente a su vehículo en otros talleres.
- Retrasos atribuibles a trámites de aduana o inspecciones del Ministerio de Hacienda de Costa Rica.

Toda adquisición es definitiva. La única vía de reclamo reconocida legalmente es el procedimiento formal de garantía por vicios o defectos de fabricación.

---

## Cláusula 2: Coberturas Escritas de Garantía

De conformidad con el Artículo 43 de la **Ley N° 7472**, ZxZ Mods otorga garantías expresas por escrito en las siguientes condiciones:

### a) Garantía de Mano de Obra en Taller e Instalaciones (60 Días Naturales)
- **Periodo:** Sesenta (60) días naturales a partir de la fecha de entrega del vehículo o finalización del servicio en taller físico o instalación móvil a domicilio.
- **Alcance de Cobertura:** Cubre exclusivamente fallas originadas directamente por el ensamble técnico realizado por nuestros mecánicos, incluyendo:
  - Verificación y reapriete de pares de torque especificados por el fabricante.
  - Conexiones y aislamientos eléctricos contra humedad y vibración en cableados instalados por ZxZ Mods.
  - Purga y calibración de sistemas hidráulicos de frenos.
  - Ajuste de sistemas de embrague (clutching) y alineación de bandas según especificaciones pactadas.
- **Subsanación:** La garantía comprende la corrección de la mano de obra sin costo adicional en nuestras instalaciones o mediante reenvío del técnico autorizado.

### b) Garantía de Piezas y Componentes Mecánicos Bolt-On (90 Días Naturales)
- **Periodo:** Noventa (90) días naturales a partir de la entrega del producto o instalación del componente.
- **Alcance:** Aplica contra fallos de fábrica estructurales o materiales en:
  - Brazos de suspensión reforzados, rótulas (ball joints), barras estabilizadoras y terminales de dirección.
  - Flechas de tracción reforzadas (axles) y juntas homocinéticas por rotura de material no asociada a vuelco o ángulo excesivo no calibrado.
  - Sistemas de iluminación LED de alto rendimiento y arneses auxiliares contra fallo interno de diodos o filtración por defecto de sello hermético de fábrica.
  - Cabrestantes (winches) mecánicos y sistemas de anclaje de defensa.
- **Subsanación:** En caso de comprobarse fallo de fábrica, La Empresa gestionará el reemplazo de la pieza defectuosa o el suministro del repuesto correspondiente provisto por la marca.

### c) Garantía Original de Fabricantes de EE.UU.
- Para piezas y marcas internacionales cuyos términos de fábrica estipulen periodos superiores (por ejemplo, amortiguadores Elka, Walker Evans, escapes Yoshimura, etc.), ZxZ Mods gestionará directamente como distribuidor el trámite de garantía con el fabricante en Estados Unidos en nombre del cliente.

### d) Garantía de Archivo de Reprogramación de ECU (De por Vida / Lifetime File)
- **Cobertura:** Si por cualquier motivo el concesionario oficial de la marca o un mantenimiento de rutina sobreescribe o restablece la computadora del vehículo a los parámetros de fábrica, ZxZ Mods reinstalará el archivo de calibración y reprogramación de rendimiento adquirido **de por vida y sin costo del software**.
- **Exclusión Radical:** Esta garantía ampara única y exclusivamente el archivo digital de calibración de software; **bajo ninguna circunstancia ampara componentes mecánicos internos del motor (pistones, bielas, turbocompresores, válvulas)** que sufran averías derivadas de uso severo, combustible de bajo octanaje o sobrecalentamiento.

---

## Cláusula 3: Exclusiones Absolutas de la Garantía

La garantía quedará automáticamente anulada, extinguida y sin efecto legal alguno en los siguientes casos:
1. **Uso en Competición o Carreras:** Utilización del vehículo en carreras profesionales o clandestinas, competencias de piques, rallies o eventos de fango extremo ("mud bogs") sin previa inspección y homologación técnica por parte de ZxZ Mods.
2. **Inmersión en Agua y Barro sin Snorkel Certificado:** Daños o gripado de componentes por ingreso de agua o lodo en tomas de aire, motor, transmisión, diferencial o sistema de embrague (CVT) cuando el vehículo carezca de sistema de snorkel certificado y debidamente sellado.
3. **Mantenimiento Negligente:** Operación del vehículo con niveles inadecuados de aceite, lubricantes de transmisión degradados, filtros de aire saturados o falta de grasa en puntos de engrase.
4. **Intervención de Terceros:** Manipulación, desarme, alteración, modificación o intento de reparación de las piezas o instalaciones realizado por talleres ajenos, mecánicos particulares o el propio cliente sin previa autorización escrita de La Empresa.
5. **Impacto, Vuelco o Accidente:** Daños cosméticos, deformaciones de chasis o roturas causadas por golpes contra rocas, árboles, volcamientos o choques.

---

## Cláusula 4: Procedimiento Oficial de Reclamación

1. **Notificación Formal:** Para iniciar un reclamo de garantía por presunto fallo de fábrica, El Cliente debe comunicarse dentro del periodo de vigencia a nuestro canal oficial de soporte técnico vía WhatsApp (+506 7033-2560) o correo electrónico a \`ventas@zxzmods.com\`, adjuntando:
   - Número de orden o comprobante de compra.
   - Descripción detallada del síntoma o fallo observado.
   - Fotografías y vídeos claros en alta resolución que muestren la pieza instalada en el vehículo y el defecto alegado.
2. **Inspección Técnica Obligatoria:** ZxZ Mods requerirá la presentación de la pieza física o el ingreso del vehículo a nuestro taller central en Santa Ana, San José, para que nuestros mecánicos certificados dictaminen si la falla obedece a un defecto de manufactura o a un uso indebido/accidente.
3. **Plazo de Resolución:** De conformidad con la Ley N° 7472, La Empresa emitirá su informe técnico y resolución en un plazo no mayor a diez (10) días hábiles posteriores a la recepción física del componente para evaluación.`,
    contentEn: `## Clause 1: Fundamental Zero-Return and Zero-Refund Policy

**AT ZXZ MODS COSTA RICA S.A. (CORPORATE LEGAL ID 3-101-436132), NO RETURNS OR REFUNDS OF ANY KIND ARE ACCEPTED UNDER ANY CIRCUMSTANCE, EXCEPT SOLELY AND EXCLUSIVELY FOR PROVEN FACTORY MANUFACTURING DEFECTS VERIFIED THROUGH OFFICIAL TECHNICAL INSPECTION.**

Because our products are specialized high-performance powersports components custom-imported from the United States for specific vehicle configurations (Year, Make, Model), **no returns or refunds are accepted for:**
- Buyer's remorse or change of mind by The Client.
- Incorrect part selection ordered by The Client without prior written fitment confirmation from our technical team.
- Incompatibility caused by non-OEM structural or mechanical modifications previously performed on the vehicle by third-party shops.
- Transit variations resulting from Costa Rican Customs inspections or Ministry of Finance clearance procedures.

All sales are final. The sole legally recognized remedy is our formal warranty claim procedure for verified manufacturing defects.

---

## Clause 2: Written Warranty Coverage Tiers

In accordance with Article 43 of Costa Rican **Law No. 7472**, ZxZ Mods grants express written warranties under the following terms:

### a) Workshop & Mobile Installation Labor Warranty (60 Calendar Days)
- **Term:** Sixty (60) calendar days from the date of vehicle delivery or completion of installation at our Santa Ana facility or mobile on-site service.
- **Coverage Scope:** Strictly covers workmanship issues directly attributable to mechanical assembly performed by our technicians, including:
  - Verification and re-torquing of manufacturer-specified fastener torque values.
  - Electrical connectors and moisture/vibration sealing on wiring harnesses installed by ZxZ Mods.
  - Hydraulic brake bleeding and pressure calibration.
  - Clutching alignment and belt spacing adjustments per agreed specifications.
- **Remedy:** Free labor correction at our central workshop or via authorized technician dispatch.

### b) Bolt-On Mechanical & Electrical Parts Warranty (90 Calendar Days)
- **Term:** Ninety (90) calendar days from product delivery or installation.
- **Coverage Scope:** Protects against structural or material factory defects in:
  - Heavy-duty suspension control arms, ball joints, sway bars, and tie rods.
  - Heavy-duty axles and CV joints against material fracture not caused by rollovers, impacts, or uncalibrated lift angles.
  - High-output LED lighting systems and auxiliary harnesses against internal diode failure or factory seal moisture ingress.
  - Winches and structural bumper mounting systems.
- **Remedy:** Upon verification of a factory defect, The Company will process replacement of the defective unit or supply the corresponding manufacturer replacement component.

### c) Direct US Manufacturer OEM Warranties
- For international brands offering extended factory warranties in the United States, ZxZ Mods directly processes warranty claims with the US manufacturer on behalf of The Client.

### d) ECU Remapping Software Warranty (Lifetime File Guarantee)
- **Coverage:** If an official dealership service or routine maintenance overwrites or resets the vehicle's ECU back to factory stock settings, ZxZ Mods will re-flash the purchased performance calibration file **for life at zero software cost**.
- **Strict Mechanical Exclusion:** This warranty covers solely and exclusively the digital software calibration file; **under no circumstance does it cover internal mechanical engine or drivetrain components (pistons, rods, turbochargers, valves, belts)** damaged by severe use, low-octane fuel, or overheating.

---

## Clause 3: Absolute Warranty Exclusions

All warranty coverage is immediately voided and terminated in the following cases:
1. **Racing or Extreme Competition:** Use of the vehicle in sanctioned or unsanctioned races, drag events, rallies, or extreme mud bogs without prior technical inspection and written homologation by ZxZ Mods.
2. **Water or Mud Submersion Without Certified Snorkel:** Component damage or seizure caused by water or mud ingress into air intakes, engine, transmission, differentials, or CVT clutch housings when the vehicle lacks a properly sealed, certified snorkel system.
3. **Negligent Maintenance:** Operating the vehicle with improper oil levels, degraded transmission fluids, clogged air filters, or ungreased suspension fittings.
4. **Third-Party Tampering:** Disassembly, alteration, modification, or repair attempts performed on parts or installations by external workshops, unauthorized mechanics, or The Client without prior written authorization from The Company.
5. **Impact, Rollover, or Collision:** Cosmetic damage, bent frames/chassis, or fractures caused by striking rocks, trees, rollovers, or collisions.

---

## Clause 4: Official Warranty Claim Procedure

1. **Formal Notification:** To initiate a warranty claim for a suspected factory defect, The Client must contact our official technical support channel within the warranty period via WhatsApp (+506 7033-2560) or email at \`ventas@zxzmods.com\`, providing:
   - Order number or official purchase receipt.
   - Detailed description of the symptom or defect observed.
   - Clear high-resolution photos and videos showing the part installed on the vehicle and the alleged defect.
2. **Mandatory Technical Inspection:** ZxZ Mods requires physical presentation of the part or delivery of the vehicle to our central workshop in Santa Ana, San José, so our certified technicians can determine whether the failure stems from a manufacturing defect or external impact/misuse.
3. **Resolution Timeframe:** Pursuant to Law No. 7472, The Company will issue its technical report and warranty resolution within ten (10) business days following physical receipt of the component.`,
  },
  {
    id: "privacidad-datos",
    slug: "privacidad-datos",
    order: 4,
    category: "PRIVACY",
    titleEs: "Política de Privacidad y Tratamiento de Datos Personales (Ley N° 8968)",
    titleEn: "Privacy Policy & Personal Data Protection (Law No. 8968)",
    badgeEs: "Protección PRODHAB • Derechos ARCO",
    badgeEn: "PRODHAB Compliance • ARCO Privacy Rights",
    summaryEs:
      "Cumplimiento legal estricto de la Ley N° 8968 de Costa Rica. Protección de datos de usuarios, almacenamiento seguro en Firebase, finalidades legítimas y procedimiento para ejercicio de derechos ARCO.",
    summaryEn:
      "Strict compliance with Costa Rican Law No. 8968. User data protection, encrypted cloud storage, legitimate processing purposes, and formal procedure to exercise ARCO privacy rights.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Ley N° 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica",
      "Reglamento a la Ley N° 8968 (Decreto Ejecutivo N° 37554-JP)",
      "Normativa de la Agencia de Protección de Datos de los Habitantes (PRODHAB)",
    ]),
    contentEs: `## Cláusula 1: Responsable del Tratamiento y Marco Normativo

En cumplimiento estricto de la **Ley N° 8968** (*Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales* de la República de Costa Rica) y su respectivo Reglamento Ejecutivo, se informa a los usuarios que los datos de carácter personal recolectados a través de esta plataforma son tratados por **ZxZ Mods Costa Rica S.A.** (Cédula Jurídica **3-101-436132**, en adelante "La Empresa"), con domicilio en Calle 34, Pozos, Santa Ana, San José, Costa Rica, actuando como titular y responsable de las bases de datos automatizadas.

La Empresa respeta el derecho fundamental a la autodeterminación informativa de todos sus clientes y garantiza la aplicación de estrictas medidas de seguridad técnicas y organizativas para salvaguardar la confidencialidad, integridad y disponibilidad de la información.

---

## Cláusula 2: Datos Personales Recopilados

La Empresa recopila únicamente los datos estrictamente necesarios para la consecución de sus fines comerciales y de servicio técnico especializado:
1. **Datos de Identificación y Contacto:** Nombre completo, dirección de correo electrónico, número de teléfono móvil / WhatsApp y dirección física para entregas o visitas de taller a domicilio.
2. **Datos del Vehículo (Garaje Virtual):** Marca, modelo, año de fabricación (YMM), categoría (UTV/ATV/SSV), número de chasis o VIN (cuando sea necesario para garantizar la compatibilidad exacta de piezas críticas de motor y suspensión), y fotografías del vehículo cargadas voluntariamente por el usuario.
3. **Datos de Transacción y Pagos:** Copia digital de comprobantes bancarios oficiales aportados por El Cliente para liquidar compras. ZxZ Mods **no almacena ni procesa números de tarjetas de crédito o claves bancarias privadas**.
4. **Datos de Navegación Técnica:** Direcciones IP, registros de sesión y cookies técnicas indispensables para la navegación y mantenimiento del carrito de compras.

---

## Cláusula 3: Finalidad del Tratamiento de Datos

Los datos personales recabados serán tratados con las siguientes finalidades legítimas:
1. Tramitación, facturación, despacho y seguimiento logístico de repuestos y combos adquiridos.
2. Coordinación de citas de servicio técnico, taller móvil e instalación de accesorios a domicilio.
3. Verificación técnica de compatibilidad de piezas respecto a los vehículos registrados en el Garaje Virtual.
4. Comunicación directa e individualizada sobre el estado de órdenes o alertas de seguridad del fabricante.
5. Cumplimiento de obligaciones legales, fiscales y contables ante las autoridades tributarias y judiciales de Costa Rica.

**Bajo ninguna circunstancia ZxZ Mods venderá, comercializará, alquilará ni cederá las bases de datos de sus clientes a terceras empresas o agencias publicitarias externas.**

---

## Cláusula 4: Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)

De conformidad con los artículos 5, 6, 7 y concordantes de la Ley N° 8968, El Cliente tiene derecho a:
- **Acceso:** Conocer qué datos personales suyos constan en las bases de datos de La Empresa y la finalidad de su uso.
- **Rectificación:** Solicitar la corrección, actualización o modificación de datos inexactos o incompletos.
- **Cancelación:** Solicitar la eliminación total de sus datos personales cuando hayan dejado de ser necesarios para la relación contractual o comercial.
- **Oposición:** Oponerse al tratamiento de sus datos para determinados fines no esenciales.

Para ejercer cualquiera de estos derechos, El Cliente podrá remitir una solicitud formal por escrito al correo electrónico **info@zxzmods.com** o **ventas@zxzmods.com**, indicando su nombre completo, copia de su documento de identidad y el derecho específico que desea hacer valer. La Empresa responderá a la solicitud dentro del plazo máximo fijado por la ley costarricense.

---

## Cláusula 5: Seguridad y Conservación de la Información

La información se almacena en infraestructuras seguras que emplean cifrado SSL/TLS para la transmisión de datos, firewalls perimetrales y mecanismos de autenticación mediante Firebase Auth. Los datos se conservarán durante el tiempo que subsista la relación comercial con el cliente y, posteriormente, durante los plazos legalmente exigidos por la legislación mercantil y tributaria costarricense para la prescripción de responsabilidades.`,
    contentEn: `## Clause 1: Data Controller and Regulatory Framework

In strict compliance with Costa Rican **Law No. 8968** (*Law on the Protection of Persons Regarding the Processing of their Personal Data*) and its Executive Regulations (Decree No. 37554-JP), users are informed that personal data collected through this platform is processed by **ZxZ Mods Costa Rica S.A.** (Corporate Legal ID **3-101-436132**, hereinafter "The Company"), domiciled at Calle 34, Pozos, Santa Ana, San José, Costa Rica, acting as the responsible controller of its automated databases.

The Company upholds the fundamental right to informational self-determination of all clients and enforces strict technical and organizational security safeguards to protect data confidentiality, integrity, and availability.

---

## Clause 2: Personal Data Collected

The Company collects only the data strictly required to fulfill its commercial and specialized mechanical service operations:
1. **Identification and Contact Data:** Full name, email address, mobile/WhatsApp phone number, and physical address for deliveries or mobile workshop visits (plus electronic invoicing tax details when requested).
2. **Vehicle Data (Virtual Garage):** Make, model, model year (YMM), category (UTV/ATV/SSV), VIN/chassis number (when required to verify exact fitment of critical engine or suspension parts), and vehicle photos voluntarily uploaded by the user.
3. **Transaction and Payment Data:** Digital copies of official bank transfer receipts uploaded by The Client to verify order payments. ZxZ Mods **never stores or processes credit card numbers or private banking credentials**.
4. **Technical Session Data:** IP addresses, security audit logs, and essential session cookies required to maintain authentication and shopping cart state.

---

## Clause 3: Legitimate Purposes of Data Processing

Personal data collected is processed exclusively for the following legitimate purposes:
1. Order processing, electronic invoicing, dispatch, and logistics tracking of purchased parts and combos.
2. Scheduling workshop appointments, mobile technician dispatches, and UTV flatbed transport.
3. Technical fitment verification matching ordered components against vehicles saved in the Virtual Garage.
4. Direct notifications regarding order status updates or manufacturer safety bulletins.
5. Compliance with legal, tax, and accounting obligations before Costa Rican tax and judicial authorities.

**Under no circumstance will ZxZ Mods sell, trade, rent, or transfer client databases to third-party marketers or external advertising agencies.**

---

## Clause 4: Exercising ARCO Privacy Rights (Access, Rectification, Cancellation, and Opposition)

Pursuant to Articles 5, 6, and 7 of Law No. 8968, The Client has the right to:
- **Access:** Obtain confirmation of what personal data is held in The Company's databases and how it is used.
- **Rectification:** Request correction or updating of inaccurate or incomplete personal information.
- **Cancellation (Deletion):** Request deletion of personal data when it is no longer required for contractual or legal obligations.
- **Opposition:** Object to the processing of personal data for non-essential purposes.

To exercise any of these rights, The Client may submit a written request to **info@zxzmods.com** or **ventas@zxzmods.com**, including their full name, identification copy, and the specific right invoked. The Company will respond within the statutory timeframe established by Costa Rican law.

---

## Clause 5: Information Security and Data Retention

All data is stored on encrypted cloud infrastructure utilizing SSL/TLS transport encryption, perimeter firewalls, and Firebase/cryptographic session authentication. Data is retained for the duration of the commercial relationship and thereafter for the statutory periods mandated by Costa Rican commercial and tax regulations.`,
  },
  {
    id: "importacion-aduanas",
    slug: "importacion-aduanas",
    order: 5,
    category: "LOGISTICS",
    titleEs: "Políticas de Importación, Envíos y Logística Aduanera desde EE.UU.",
    titleEn: "US Direct Import, Shipping & Customs Logistics Policy",
    badgeEs: "Envíos Directos USA • 7-21 Días Hábiles • Desalmacenaje",
    badgeEn: "Direct US Imports • 7-21 Business Days • Customs Clearance",
    summaryEs:
      "Regulación de los plazos de importación de repuestos de alto rendimiento desde Estados Unidos (mínimo 7 a máximo 21 días hábiles como estimación), trámites aduaneros en Costa Rica y cláusulas de fuerza mayor.",
    summaryEn:
      "Regulation of import lead times for high-performance parts from the United States (estimated 7 to 21 business days), Costa Rican customs clearance procedures, and force majeure provisions.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Ley General de Aduanas de la República de Costa Rica (Ley N° 7557)",
      "Reglamento a la Ley General de Aduanas",
      "Código de Comercio de Costa Rica (Contratos de Transporte y Flete)",
    ]),
    contentEs: `## Cláusula 1: Procedencia de los Componentes y Cadena Logística

La mayoría de los componentes mecánicos, piezas de suspensión reforzada, embragues de alto rendimiento, sistemas de escape y accesorios distribuidos por ZxZ Mods provienen directamente de bodegas de fabricantes autorizados y distribuidores especializados ubicados en los Estados Unidos de América.

Una vez que la orden de compra ha sido validada contablemente mediante la confirmación efectiva de la transferencia bancaria oficial en Costa Rica, La Empresa activa de inmediato la orden de compra y el flete internacional hacia nuestro centro de consolidación aduanera en San José.

---

## Cláusula 2: Plazos Estimados de Entrega (Estimaciones, No Garantías)

1. **Ventana de Entrega Estándar:** El tiempo regular y estimado de tránsito, importación aérea y desalmacenaje aduanero comprende una ventana con un **mínimo de siete (7) días hábiles y un máximo de veintiún (21) días hábiles** contados a partir del siguiente día hábil en que se verificó la acreditación de la transferencia bancaria.
2. **Carácter Estimativo:** Se estipula de forma expresa que todos los plazos de entrega indicados en la plataforma constituyen estimaciones orientativas calculadas bajo condiciones normales de despacho y transporte internacional. **No constituyen una garantía de entrega en fecha fija**, pudiendo variar por retrasos logísticos del transportista o aforos aduaneros.
3. **Productos en Inventario Local Inmediato:** Aquellos artículos señalados explícitamente en el catálogo con la etiqueta "En Stock Costa Rica" se encuentran físicamente en nuestro taller de Santa Ana y estarán disponibles para retiro o despacho en un plazo de 24 a 48 horas hábiles.
4. **Días No Hábiles:** No computan dentro del plazo de importación los días sábados, domingos, feriados oficiales por ley en Costa Rica ni feriados federales en los Estados Unidos que suspendan las operaciones del transporte de carga aéreo o del Servicio Aduanero costarricense.

---

## Cláusula 3: Gestión Aduanera, Tributos y Legalización

ZxZ Mods Costa Rica S.A. (Cédula Jurídica **3-101-436132**) asume la gestión integral de la logística de importación, incluyendo la contratación del flete internacional, la declaración aduanera (DUA), el pago de los correspondientes Derechos Arancelarios a la Importación (DAI), el Impuesto sobre el Valor Agregado (IVA) y las tasas de desalmacenaje fiscal.

Todos los productos comercializados en nuestra plataforma se entregan **100% legalizados, nacionalizados y amparados a facturación electrónica oficial en Costa Rica**, eximiendo a El Cliente de cualquier trámite o gestión personal ante la Dirección General de Aduanas del Ministerio de Hacienda.

---

## Cláusula 4: Eventos de Fuerza Mayor y Retenciones de Aduana

El Cliente reconoce y acepta que los plazos de entrega son estimaciones profesionales basadas en flujos regulares de comercio exterior. ZxZ Mods queda formalmente exonerada de responsabilidad legal o indemnizatoria por demoras atribuibles a:
1. **Inspecciones Físicas Aduaneras ("Semáforo Rojo / Amarillo"):** Revisiones aleatorias, aforos físicos o solicitudes de verificación de valor ordenadas unilateralmente por la aduana costarricense en ejercicio de sus potestades soberanas.
2. **Contingencias Aéreas o Meteorológicas:** Cancelación o retraso de vuelos de carga internacional por tormentas, huracanes, cierres de espacio aéreo o huelgas aeroportuarias internacionales.
3. **Rupturas de Stock del Fabricante Original:** Desabastecimiento inesperado del fabricante en EE.UU., ante lo cual La Empresa notificará de inmediato al cliente para brindarle las alternativas disponibles.

Bajo ninguna circunstancia una demora derivada de revisiones aduaneras imprevistas constituirá causal de anulación de la orden o devolución dineraria (conforme a la política de cero devoluciones pactada).

---

## Cláusula 5: Recepción e Inspección por Parte de El Cliente

Al recibir el paquete o retirar el repuesto en nuestro taller:
1. El Cliente (o la persona designada para recibir) deberá verificar que el empaque exterior no presente roturas evidentes atribuibles a un maltrato severo del transportista interno.
2. El Cliente cuenta con un plazo perentorio de **cuarenta y ocho (48) horas naturales** para reportar cualquier faltante o daño cosmético exterior visible mediante fotografías remitidas a nuestros canales oficiales de soporte.`,
    contentEn: `## Clause 1: Origin of Components and Logistics Chain

The majority of mechanical components, heavy-duty suspension kits, performance clutches, exhaust systems, and accessories distributed by ZxZ Mods are sourced directly from authorized manufacturer warehouses and specialized distributors in the United States of America.

Once a purchase order has been verified by our accounting department through confirmed clearing of an official bank transfer in Costa Rica, The Company immediately dispatches the supplier order and international air freight to our customs consolidation hub in San José.

---

## Clause 2: Estimated Delivery Timeframes (Estimates, Not Fixed Guarantees)

1. **Standard Delivery Window:** Regular estimated transit, air importation, and customs clearance takes between a **minimum of seven (7) business days and a maximum of twenty-one (21) business days**, counted from the first business day following confirmed bank transfer clearing.
2. **Estimative Nature:** All delivery timeframes displayed on the platform are operational estimates calculated under normal international freight and customs conditions. **They do not constitute a guaranteed fixed delivery date**, as shipments may experience carrier scheduling adjustments or customs inspections.
3. **Local Costa Rica Inventory:** Items explicitly badged in the catalog as "In Stock Costa Rica" are physically located at our Santa Ana facility and are ready for pickup or local dispatch within 24 to 48 business hours.
4. **Non-Business Days:** Saturdays, Sundays, official Costa Rican holidays, and US federal holidays that suspend air cargo or customs operations are excluded from business day calculations.

---

## Clause 3: Customs Brokerage, Duties, and Legal Nationalization

ZxZ Mods Costa Rica S.A. (Corporate Legal ID **3-101-436132**) handles the entire import logistics chain, including international freight, Single Customs Declarations (DUA), Import Tariff Duties (DAI), Value Added Tax (13% IVA), and bonded warehouse clearance fees.

Every product sold on our platform is delivered **100% legally nationalized and backed by official Costa Rican electronic invoicing**, freeing The Client from any personal customs paperwork before the Ministry of Finance.

---

## Clause 4: Force Majeure and Customs Holds

The Client acknowledges and accepts that delivery windows are good-faith estimates based on standard international trade flows. ZxZ Mods is expressly exempt from liability or penalty for delays caused by:
1. **Physical Customs Inspections ("Red / Yellow Channel"):** Random physical inspections, valuation audits, or tariff verifications unilaterally ordered by Costa Rican Customs authorities.
2. **Weather or Aviation Contingencies:** Flight cancellations or cargo delays resulting from storms, hurricanes, airspace restrictions, or international port strikes.
3. **Manufacturer Backorders:** Unexpected stock depletion at the US manufacturer level, in which case The Company will promptly notify The Client to coordinate available alternatives.

Under no circumstance shall a delay caused by customs inspections constitute grounds for order cancellation or refund (in accordance with our strict zero-return policy).

---

## Clause 5: Package Receipt and Inspection by The Client

Upon receiving a shipment or picking up parts at our workshop:
1. The Client (or designated recipient) must inspect the outer packaging for any obvious transit damage.
2. The Client has a strict window of **forty-eight (48) calendar hours** from delivery to report any missing items or visible exterior shipping damage by submitting high-resolution photos to our official support channels.`,
  },
  {
    id: "descargo-responsabilidad",
    slug: "descargo-responsabilidad",
    order: 6,
    category: "SAFETY",
    titleEs: "Descargo de Responsabilidad para Vehículos Deportivos, Modificaciones Extremas y Carreras",
    titleEn: "Powersports Modifications, Dealership Warranty & Off-Road Liability Waiver",
    badgeEs: "Aviso de Garantía de Fábrica • Asunción de Riesgo Off-Road",
    badgeEn: "OEM Warranty Notice • Off-Road Risk Assumption",
    summaryEs:
      "Advertencia legal y exención de responsabilidad para vehículos modificados de alto rendimiento. Consecuencias sobre garantías de agencia de fábrica, asunción voluntaria de riesgo off-road y equipos de seguridad obligatorios.",
    summaryEn:
      "Binding legal notice and liability waiver for modified high-performance powersports vehicles. Impact on OEM dealership warranties, voluntary assumption of off-road risks, and mandatory safety gear.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código Civil de Costa Rica (Régimen de Responsabilidad Extracontractual y Asunción del Riesgo)",
      "Ley de Tránsito por Vías Públicas Terrestres y Seguridad Vial de Costa Rica (Ley N° 9078)",
      "Ley N° 7472 (Obligación de Advertencia de Riesgos en Productos de Uso Peligroso)",
    ]),
    contentEs: `## Cláusula 1: Naturaleza Extrema de los Deportes Todo Terreno (Powersports)

El uso, conducción y operación de vehículos todo terreno tipo UTV (Side-by-Side), ATV (Cuadraciclos) y vehículos recreativos deportivos modificados para alto desempeño son actividades inherentemente peligrosas que conllevan riesgos graves e inevitables de accidentes, volcamientos, colisiones, daños materiales severos, lesiones corporales permanentes e incluso la muerte.

El Cliente y los operadores del vehículo declaran tener pleno conocimiento de la naturaleza de estas actividades y asumen de manera libre, consciente, voluntaria y exclusiva todos y cada uno de los riesgos directos e indirectos derivados de la conducción en terrenos agrestes, barro profundo, ríos, dunas, pendientes pronunciadas y pistas de obstáculos.

---

## Cláusula 2: Aviso Crítico sobre Garantías de Fábrica de Concesionarios (Agencias)

**AVISO VINCULANTE:** El Cliente reconoce y acepta de forma informada que la instalación de repuestos de alto rendimiento no provistos por la agencia original del vehículo, la modificación de la suspensión (lift kits, long travel), el cambio de dimensiones de neumáticos, el reemplazo de componentes del tren motriz y la reprogramación o flasheo electrónico de la computadora del motor (ECU) **PUEDEN ANULAR, RESTRINGIR O INVALIDAR TOTAL O PARCIALMENTE LA GARANTÍA ORIGINAL OTORGADA POR EL FABRICANTE O LA AGENCIA DISTRIBUIDORA DEL VEHÍCULO EN COSTA RICA** (tales como agencias oficiales de Can-Am, Polaris, CFMOTO, Yamaha, Honda, etc.).

ZxZ Mods Costa Rica S.A. (Cédula Jurídica **3-101-436132**) no se hace responsable por reclamos, rechazos de garantía o cancelaciones de pólizas de mantenimiento que la agencia oficial aplique sobre el vehículo a raíz de las modificaciones contratadas por El Cliente.

---

## Cláusula 3: Exención Total de Responsabilidad por Accidentes y Daños

En la máxima medida permitida por la legislación costarricense, **ZxZ Mods Costa Rica S.A., sus accionistas, directores, técnicos y colaboradores quedan expresamente exonerados de toda responsabilidad civil, penal o patrimonial** por:
1. Accidentes de tránsito, volcamientos, pérdidas totales o daños vehiculares ocurridos fuera de las instalaciones del taller durante la conducción del vehículo por parte de El Cliente o terceros.
2. Daños a propiedades privadas ajenas o a bienes públicos provocados durante la operación del vehículo modificado.
3. Lesiones corporales sufridas por el piloto, copiloto o pasajeros, quienes deberán contar con sus correspondientes pólizas de accidentes y seguro obligatorio de automóviles del INS si transitan en rutas autorizadas.
4. Desgaste prematuro o rotura de componentes originales del vehículo que no hayan sido sustituidos ni reforzados (por ejemplo, diferenciales originales sometidos a estrés extremo por llantas sobredimensionadas).

---

## Cláusula 4: Obligación de Uso de Equipamiento de Seguridad

ZxZ Mods exige e instruye expresamente a todos sus clientes a respetar las normas universales de seguridad en deportes de motor:
- Utilizar en todo momento casco protector certificado (DOT / ECE / Snell).
- Utilizar arneses de seguridad de 4 o 5 puntos debidamente anclados a la jaula antivuelco.
- Mantener en perfecto estado la jaula de protección (roll cage) y las redes o puertas laterales.
- Contar con extintor de incendios recargado y botiquín de primeros auxilios a bordo del vehículo.
- Abstenerse terminantemente de conducir bajo los efectos del alcohol, drogas o medicamentos que alteren los reflejos.`,
    contentEn: `## Clause 1: Inherent Risks of Off-Road Powersports Activities

Operating UTV (Side-by-Side), ATV, and recreational off-road vehicles modified for high performance is an inherently hazardous activity involving severe and unavoidable risks of rollovers, collisions, property damage, permanent bodily injury, or death.

The Client and all vehicle operators declare full awareness of these hazards and freely, consciously, voluntarily, and exclusively assume all direct and indirect risks arising from operating the vehicle across rugged trails, deep mud, river crossings, dunes, steep grades, and off-road courses.

---

## Clause 2: Critical Notice Regarding Dealership / OEM Factory Warranties

**BINDING NOTICE:** The Client expressly acknowledges and accepts that installing aftermarket high-performance parts, modifying suspension geometry (lift kits, long-travel kits), increasing tire sizes, upgrading drivetrain components, or flashing/remapping the engine control unit (ECU) **MAY VOID, RESTRICT, OR INVALIDATE IN WHOLE OR IN PART THE ORIGINAL FACTORY WARRANTY GRANTED BY THE VEHICLE MANUFACTURER OR AUTHORIZED DEALERSHIP IN COSTA RICA** (including official dealerships for CFMOTO, Can-Am, Polaris, Yamaha, Honda, etc.).

ZxZ Mods Costa Rica S.A. (Corporate Legal ID **3-101-436132**) assumes zero liability for warranty denials or service policy cancellations enforced by the official vehicle dealership as a result of aftermarket modifications requested by The Client.

---

## Clause 3: Release and Waiver of Liability for Accidents and Damages

To the fullest extent permitted by Costa Rican law, **ZxZ Mods Costa Rica S.A., its shareholders, directors, technicians, and staff are expressly released and held harmless from any civil, criminal, or financial liability** arising from:
1. Traffic accidents, rollovers, total losses, or vehicle damage occurring outside our workshop facilities while the vehicle is operated by The Client or third parties.
2. Damage to private third-party property or public infrastructure caused during operation of the modified vehicle.
3. Bodily injury sustained by the driver, co-driver, or passengers, who are responsible for maintaining appropriate personal accident and mandatory vehicle insurance coverage.
4. Premature wear or failure of stock OEM components that were not upgraded or reinforced to handle increased power or tire mass (e.g., stock differentials stressed by oversized mud tires).

---

## Clause 4: Mandatory Safety Equipment Requirements

ZxZ Mods strictly instructs all clients to abide by universal motorsport safety standards at all times:
- Wear a certified protective helmet (DOT / ECE / Snell) and eye protection at all times.
- Use properly anchored 4-point or 5-point racing harnesses secured to the roll cage.
- Maintain the roll cage, side doors, and safety nets in sound structural condition.
- Carry a charged fire extinguisher and first-aid kit aboard the vehicle.
- Never operate the vehicle under the influence of alcohol, drugs, or impairing medications.`,
  },
  {
    id: "taller-domicilio-remolque",
    slug: "taller-domicilio-remolque",
    order: 7,
    category: "LOGISTICS",
    titleEs: "Términos del Servicio de Taller Móvil a Domicilio y Transporte en Remolque",
    titleEn: "Mobile On-Site Workshop & Flatbed Trailer Transport Terms",
    badgeEs: "Instalación en Sitio • Plataforma Asegurada • Inspección 360°",
    badgeEn: "On-Site Installation • Secured Flatbed • 360° Inspection",
    summaryEs:
      "Requisitos de seguridad en la propiedad del cliente para servicio técnico a domicilio. Protocolo obligatorio de inspección fotográfica 360° de daños preexistentes para traslado en plataforma.",
    summaryEn:
      "Site safety requirements at the client's property for mobile workshop service, plus our mandatory 360° pre-transport photographic inspection protocol for flatbed UTV towing.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código Civil de Costa Rica (Obligaciones de Custodia y Depósito)",
      "Ley de Tránsito por Vías Públicas Terrestres de Costa Rica",
      "Ley N° 7472 (Condiciones de Seguridad en la Prestación de Servicios)",
    ]),
    contentEs: `## Cláusula 1: Condiciones del Servicio de Taller Móvil a Domicilio

ZxZ Mods ofrece el servicio de desplazamiento técnico y taller móvil directamente a la residencia, finca o propiedad designada por El Cliente en territorio costarricense. Para que nuestro personal técnico pueda ejecutar de forma segura y eficiente la instalación de piezas o mantenimiento programado, El Cliente se obliga a suministrar obligatoriamente las siguientes condiciones en el sitio:

1. **Superficie Adecuada:** Área de trabajo techada (o protegida contra la lluvia), en terreno completamente plano, firme y estable (piso de concreto, asfalto o tierra compactada; bajo ninguna circunstancia lodo, pendientes pronunciadas o superficies irregulares que pongan en peligro la estabilidad de los gatos hidráulicos o soportes).
2. **Suministro Eléctrico:** Acceso a toma de corriente eléctrica funcional de 110V para herramientas neumáticas o eléctricas de precisión.
3. **Resguardo de Animales:** El Cliente se compromete a mantener a perros y cualquier otro animal doméstico o de granja debidamente asegurados o alejados del área de trabajo durante toda la estadía de los mecánicos.
4. **Presencia de Representante:** El propietario del vehículo o un adulto debidamente autorizado debe encontrarse presente al inicio de la jornada para la entrega de la máquina y al finalizar para la prueba técnica y firma del recibido conforme.

Si al arribar la unidad móvil técnica al sitio, las condiciones físicas del terreno no son seguras o no cumplen con los requerimientos técnicos mínimos, el personal de ZxZ Mods suspenderá el servicio por motivos de seguridad industrial, debiendo El Cliente reprogramar la visita y asumir el costo del nuevo desplazamiento logístico.

---

## Cláusula 2: Servicio de Transporte y Traslado en Remolque de Plataforma

Para traslados de vehículos UTV / ATV averiados o para instalaciones complejas que requieran banco de prueba en nuestro taller central de Santa Ana, ZxZ Mods dispone de equipo de remolque en plataforma con fajas de trinquete (ratchets) de grado industrial:

1. **Inspección Fotográfica 360° Obligatoria:** Previo al anclaje y subida del vehículo a la plataforma, el chofer técnico de ZxZ Mods realizará una inspección visual exhaustiva y registrará fotografías de alta resolución en 360 grados de la carrocería, plásticos, roll cage, parabrisas, llantas y accesorios del vehículo para documentar rayones, golpes, abolladuras o desperfectos preexistentes.
2. **Exclusión de Daños Preexistentes:** ZxZ Mods Costa Rica S.A. (Cédula Jurídica **3-101-436132**) no responderá bajo ninguna circunstancia por daños, fracturas o piezas faltantes que hayan sido registradas durante la inspección previa o que deriven del desgaste natural y uso previo de la máquina.
3. **Seguro de Transporte y Amarres:** El vehículo será asegurado a la plataforma mediante cuatro puntos de anclaje independientes a los brazos o chasis estructural. La Empresa cuenta con póliza de responsabilidad civil en sus vehículos tractores conforme a la Ley de Tránsito de Costa Rica.
4. **Objetos Personales y Carga Suelta:** El Cliente debe retirar del vehículo todo objeto de valor, herramientas sueltas, teléfonos, radios portátiles o pertenencias personales antes del traslado. La Empresa no se hace responsable por extravío de objetos dejados sueltos dentro de la cabina del UTV.`,
    contentEn: `## Clause 1: Mobile On-Site Workshop Conditions

ZxZ Mods offers mobile technical dispatch and on-site installation directly at the residence, estate, or property designated by The Client within Costa Rica. To enable our technicians to safely and accurately perform installations or scheduled maintenance, The Client must provide the following mandatory site conditions:

1. **Level, Firm Working Surface:** A covered (or weather-protected) workspace on completely flat, firm, and stable ground (concrete, asphalt, or compacted gravel; never deep mud, steep slopes, or unstable terrain that could compromise hydraulic jacks or stands).
2. **Electrical Power Supply:** Access to a functional 110V electrical outlet within reasonable reach for diagnostic and precision equipment.
3. **Securing of Pets and Animals:** All dogs, pets, or livestock must be securely restrained away from the workspace throughout the technicians' visit.
4. **Authorized Adult Presence:** The vehicle owner or an authorized adult representative must be present upon arrival to hand over the machine and upon completion to verify the installation and sign the service completion record.

If our mobile unit arrives on site and determines that terrain or weather conditions pose an occupational safety hazard, ZxZ Mods personnel will suspend the installation, and The Client will be responsible for rescheduling and covering the additional dispatch fee.

---

## Clause 2: Flatbed Trailer Pickup and Transport Service

For transporting UTV/ATV units to and from our central workshop in Santa Ana, ZxZ Mods utilizes dedicated flatbed trailers equipped with industrial-grade ratchet tie-down straps:

1. **Mandatory 360° Photographic Inspection:** Prior to loading and strapping the vehicle onto the flatbed, the ZxZ Mods transport specialist will perform a comprehensive visual walkaround and capture 360-degree high-resolution photographs of all plastics, bodywork, roll cage, windshield, wheels, and accessories to document any pre-existing scratches, dents, or wear.
2. **Pre-Existing Damage Exclusion:** ZxZ Mods Costa Rica S.A. (Corporate Legal ID **3-101-436132**) shall not be liable under any circumstance for scratches, fractures, or missing components documented during the pre-loading inspection or resulting from prior off-road use.
3. **Four-Point Tie-Down & Transit Coverage:** The vehicle is secured via four independent anchor points attached to structural suspension arms or chassis mounts. Our tow vehicles maintain active liability coverage in accordance with Costa Rican Traffic Law.
4. **Personal Belongings and Loose Items:** The Client must remove all valuables, loose tools, electronics, portable radios, and personal items from the cabin prior to pickup. The Company is not responsible for loose personal items left inside the vehicle during transit.`,
  },
  {
    id: "reprogramacion-ecu",
    slug: "reprogramacion-ecu",
    order: 8,
    category: "TUNING",
    titleEs: "Política de Reprogramación de ECU, Calibración de Mapas y Tuning de Software",
    titleEn: "ECU Remapping, Map Calibration & Performance Software Policy",
    badgeEs: "Garantía de Software Lifetime • Cero Garantía en Motor Físico",
    badgeEn: "Lifetime Software File • Zero Mechanical Engine Coverage",
    summaryEs:
      "Alcance técnico del servicio de reprogramación electrónica de computadoras (ECU remap). Respaldo permanente del software y exclusión total de averías de motor físico por bajo octanaje o maltrato mecánico.",
    summaryEn:
      "Technical scope of electronic engine control unit remapping (ECU Tuning). Permanent lifetime software file backup and strict exclusion of physical engine/drivetrain mechanical failures.",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código Civil de Costa Rica (Límites de la Responsabilidad Contractual)",
      "Ley N° 7472 (Especificaciones Técnicas Claras de Servicios Especializados)",
      "Código de Comercio de Costa Rica",
    ]),
    contentEs: `## Cláusula 1: Naturaleza del Servicio de ECU Tuning

La reprogramación de la unidad de control electrónico del motor (ECU Tuning, Flasheo o Remapeo) es un procedimiento de modificación digital avanzada enfocado en optimizar parámetros como mapas de combustible (Air/Fuel Ratio), curvas de avance de encendido, presión de sobrealimentación (boost en motores turbo), eliminación de limitadores de velocidad máxima de fábrica, ajuste del corte de revoluciones (RPM limit) y respuesta electrónica del acelerador (Fly-by-Wire).

El Cliente comprende y acepta que este servicio altera los parámetros de fábrica configurados originalmente por el fabricante del vehículo con el propósito deliberado de incrementar la potencia, torque y rendimiento dinámico de la máquina.

---

## Cláusula 2: Garantía de Software de por Vida (Lifetime File Guarantee)

ZxZ Mods garantiza formalmente la integridad y estabilidad del archivo digital programado:
1. **Respaldo Digital Permanente:** La Empresa mantendrá en sus servidores un respaldo seguro de la lectura original del vehículo (stock file) y del archivo reprogramado adquirido por El Cliente.
2. **Re-flasheo Gratuito de por Vida:** Si por motivo de una revisión rutinaria o actualización técnica en el concesionario oficial de la marca la computadora es restablecida a los valores de fábrica, El Cliente podrá acudir a ZxZ Mods para que reinstalemos el mapa de potencia de forma completamente gratuita cuantas veces sea necesario durante la vida útil del vehículo en posesión del cliente original.

---

## Cláusula 3: Exclusión Radical de Garantía en Componentes Mecánicos de Motor

**ADVERTENCIA TÉCNICA Y LEGAL VINCULANTE:**
La garantía otorgada por ZxZ Mods Costa Rica S.A. (Cédula Jurídica **3-101-436132**) ampara de manera exclusiva y estricta el **archivo de software y su correcta carga digital en la memoria de la computadora**. 

**BAJO NINGUNA CIRCUNSTANCIA LA GARANTÍA CUBRE, NI ZXZ MODS ASUMIRÁ COSTOS POR DAÑOS MECÁNICOS, AVERÍAS INTERNAS O ROTURAS DEL MOTOR O TREN MOTRIZ**, incluyendo de forma enunciativa pero no limitativa:
- Pistones derretidos, agrietados o perforados por detonación o pre-ignición.
- Bielas dobladas o rotas.
- Válvulas quemadas o daño en cabezote.
- Rotura o sobrecalentamiento de turbocompresores.
- Daño en fajas de transmisión (belts), bandas rotas o desgastes prematuros de discos de clutch.
- Grietas o roturas en cárter o bloque de motor.

---

## Cláusula 4: Requerimiento Estricto de Combustible de Alto Octanaje

1. **Octanaje Mínimo Requerido:** Tras la reprogramación de la ECU, los mapas de encendido optimizados exigen el uso exclusivo de **gasolina de alto octanaje de grado premium (mínimo 95 RON / Gasolina Súper en Costa Rica de alta calidad)**. El uso de combustible de octanaje regular, combustible adulterado o gasolina almacenada por tiempos prolongados causará detonación ("knocking" o cascabeleo) y destruirá los componentes mecánicos internos del motor.
2. **Temperatura y Aceite:** El Cliente es el único responsable de monitorear en tiempo real los indicadores de temperatura de refrigerante y aceite del motor, así como utilizar aceites sintéticos certificados para powersports de viscosidad adecuada. Operar el motor bajo sobrecalentamiento extremo anula cualquier posibilidad de reclamo.`,
    contentEn: `## Clause 1: Nature of ECU Tuning Services

Engine Control Unit remapping (ECU Tuning / Flashing) is an advanced digital calibration procedure designed to optimize air/fuel ratio (AFR) tables, ignition timing curves, turbocharger boost pressure targets, factory speed limiters, rev limiters (RPM cutoffs), cooling fan activation thresholds, and electronic throttle-by-wire response.

The Client understands and agrees that this service intentionally alters factory stock calibration parameters set by the vehicle manufacturer in order to increase horsepower, torque, and throttle response.

---

## Clause 2: Lifetime Software File Guarantee

ZxZ Mods formally guarantees the integrity and stability of the programmed digital calibration file:
1. **Permanent Digital Backup:** The Company maintains a secure backup of both the vehicle's original factory read (stock file) and the custom performance tune file purchased by The Client.
2. **Free Lifetime Re-Flashing:** If a routine dealership service or factory diagnostic update overwrites the ECU back to stock settings, The Client may bring the vehicle or ECU to ZxZ Mods to have the purchased performance map re-flashed free of software charge for as long as the original client owns the vehicle.

---

## Clause 3: Strict Exclusion of Physical Engine and Drivetrain Mechanical Components

**BINDING TECHNICAL AND LEGAL NOTICE:**
The warranty granted by ZxZ Mods Costa Rica S.A. (Corporate Legal ID **3-101-436132**) covers strictly and exclusively the **digital software calibration file and its proper programming into the ECU memory**.

**UNDER NO CIRCUMSTANCE DOES THIS WARRANTY COVER, NOR SHALL ZXZ MODS ASSUME ANY COST FOR, PHYSICAL MECHANICAL DAMAGE, INTERNAL ENGINE FAILURE, OR DRIVETRAIN BREAKAGE**, including but not limited to:
- Melted, cracked, or perforated pistons caused by detonation or pre-ignition.
- Bent or broken connecting rods.
- Burned valves or cylinder head damage.
- Turbocharger overheating or failure.
- Snapped CVT drive belts or premature clutch wear.
- Cracked crankcases or engine blocks.

---

## Clause 4: Mandatory High-Octane Fuel and Cooling Requirements

1. **Minimum Octane Requirement:** Following an ECU remap, optimized ignition timing tables strictly require the exclusive use of **premium high-octane fuel (minimum 95 RON / Costa Rican Super grade fuel from reputable stations)**—or race fuel/octane booster when specified by the stage map. Using regular-grade fuel, contaminated fuel, or stale gasoline will cause severe engine detonation ("knock") and destroy internal engine components.
2. **Thermal & Lubrication Monitoring:** The Client is solely responsible for monitoring real-time coolant and oil temperatures, keeping radiators clean of mud debris, and using certified full-synthetic powersports lubricants of the proper viscosity.`,
  },
];

async function main() {
  console.log("Iniciando sembrado bilingüe (ES/EN) de Documentos Legales oficiales de ZxZ Mods Costa Rica...");

  // Ensure WorkshopInfo has the official Cédula Jurídica '3-101-436132' if empty or placeholder
  let activeCedula = DEFAULT_CEDULA_JURIDICA;
  try {
    const workshop = await prisma.workshopInfo.findUnique({ where: { id: "zxz-hq" } });
    if (workshop) {
      if (!workshop.cedulaJuridica || workshop.cedulaJuridica.includes("XXXXXX")) {
        await prisma.workshopInfo.update({
          where: { id: "zxz-hq" },
          data: { cedulaJuridica: DEFAULT_CEDULA_JURIDICA },
        });
      } else {
        activeCedula = workshop.cedulaJuridica;
      }
    }
  } catch (err) {
    console.warn("Nota: No se pudo verificar WorkshopInfo:", err.message);
  }

  for (const doc of legalDocuments) {
    const injectCedula = (str) =>
      String(str || "")
        .replace(/3-101-XXXXXX/g, activeCedula)
        .replace(/3-101-436132/g, activeCedula);

    const upserted = await prisma.legalDocument.upsert({
      where: { id: doc.id },
      update: {
        slug: doc.slug,
        order: doc.order,
        category: doc.category,
        titleEs: doc.titleEs,
        titleEn: doc.titleEn,
        badgeEs: doc.badgeEs,
        badgeEn: doc.badgeEn,
        summaryEs: injectCedula(doc.summaryEs),
        summaryEn: injectCedula(doc.summaryEn),
        contentEs: injectCedula(doc.contentEs),
        contentEn: injectCedula(doc.contentEn),
        jurisdiction: doc.jurisdiction,
        lastUpdated: doc.lastUpdated,
        applicableLawsJson: doc.applicableLawsJson,
        isPublished: true,
      },
      create: {
        id: doc.id,
        slug: doc.slug,
        order: doc.order,
        category: doc.category,
        titleEs: doc.titleEs,
        titleEn: doc.titleEn,
        badgeEs: doc.badgeEs,
        badgeEn: doc.badgeEn,
        summaryEs: injectCedula(doc.summaryEs),
        summaryEn: injectCedula(doc.summaryEn),
        contentEs: injectCedula(doc.contentEs),
        contentEn: injectCedula(doc.contentEn),
        jurisdiction: doc.jurisdiction,
        lastUpdated: doc.lastUpdated,
        applicableLawsJson: doc.applicableLawsJson,
        isPublished: true,
      },
    });

    console.log(`✓ Documento legal bilingüe sincronizado: [${upserted.order}] ${upserted.titleEs} / ${upserted.titleEn}`);
  }

  console.log("Sembrado bilingüe de documentos legales finalizado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error al sembrar documentos legales:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
