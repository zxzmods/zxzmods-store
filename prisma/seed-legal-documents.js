const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const legalDocuments = [
  {
    id: "terminos-condiciones",
    slug: "terminos-condiciones",
    order: 1,
    category: "GENERAL",
    titleEs: "Términos y Condiciones Generales de Uso de Plataforma y Venta",
    titleEn: "",
    badgeEs: "Marco Legal & Contrato General",
    badgeEn: "",
    summaryEs: "Regulación contractual del acceso a la plataforma web de ZxZ Mods, registro de usuarios, pedidos de compra, propiedad intelectual y competencia legal en Costa Rica bajo la Ley N° 7472.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Ley N° 7472 de Promoción de la Competencia y Defensa Efectiva del Consumidor",
      "Código de Comercio de la República de Costa Rica (Ley N° 3284)",
      "Código Civil de Costa Rica"
    ]),
    contentEs: `## Cláusula 1: Identificación y Aceptación Contractual

El presente contrato regula los términos y condiciones de uso, acceso y contratación de servicios a través de la plataforma web oficial de **ZxZ Mods** (operada legalmente bajo la razón social **ZxZ Mods Costa Rica S.A.**, en adelante "La Empresa"), con domicilio legal y sede operativa principal situada en Calle 34, Pozos, Santa Ana, San José, Costa Rica.

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

Todos los logotipos, diseños, código fuente, interfaces visuales, gráficos, esquemas de compatibilidad, imágenes producidas por ZxZ Mods y textos contenidos en este sitio web son propiedad exclusiva de ZxZ Mods Costa Rica S.A. o se utilizan bajo licencia y autorización legal. Queda estrictamente prohibida su copia, reproducción, ingeniería inversa, extracción automatizada ("scraping") o distribución comercial sin consentimiento previo por escrito.

Las marcas comerciales de fabricantes de vehículos o accesorios (tales como Can-Am, Polaris, CFMOTO, Dynojet, SuperATV, Warn, etc.) se mencionan únicamente con carácter descriptivo e informativo para identificar la compatibilidad técnica de los repuestos, perteneciendo sus derechos a sus legítimos titulares.

---

## Cláusula 6: Modificaciones de los Términos

ZxZ Mods se reserva el derecho de actualizar, modificar o reemplazar cualquier sección de estos Términos y Condiciones en cualquier momento para ajustarse a cambios normativos o mejoras operativas. Las modificaciones entrarán en vigencia inmediatamente tras su publicación en esta pantalla oficial con su respectiva indicación de última actualización. El uso continuado del sitio web después de tales cambios constituirá la aceptación tácita de los mismos.

---

## Cláusula 7: Jurisdicción Territorial y Ley Aplicable

Para la resolución de cualquier controversia, litigio, interpretación o reclamación derivada de la validez, ejecución o terminación de estos términos o de las transacciones comerciales efectuadas en el sitio web, las partes renuncian expresamente a cualquier otro fuero que pudiera corresponderles y se someten de manera formal y exclusiva a la jurisdicción de los Tribunales Ordinarios de Justicia de San José, República de Costa Rica.`
  },
  {
    id: "acuerdos-pago",
    slug: "acuerdos-pago",
    order: 2,
    category: "PAYMENTS",
    titleEs: "Acuerdos y Condiciones de Pago y Transferencias Bancarias",
    titleEn: "",
    badgeEs: "Pagos Exclusivos por Transferencia Bancaria",
    badgeEn: "",
    summaryEs: "Condiciones contractuales obligatorias para la liquidación de órdenes mediante transferencia bancaria oficial IBAN en CRC y USD. Sin SINPE Móvil. Exención total de responsabilidad por errores del cliente.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código de Comercio de Costa Rica (Normativa de Transferencias y Depósitos Bancarios)",
      "Código Penal de Costa Rica (Delitos de Estafa Informática y Falsificación de Documento)",
      "Reglamento del Sistema de Pagos del Banco Central de Costa Rica"
    ]),
    contentEs: `## Cláusula 1: Modalidad Exclusiva de Pago

En ZxZ Mods Costa Rica S.A., por estrictas políticas de control fiscal, trazabilidad financiera y seguridad corporativa, **NO SE ACEPTA SINPE MÓVIL NI PAGOS INFORMALES EN EFECTIVO SIN REGISTRO**. 

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
2. **Tipo de Cambio Oficial:** En caso de que El Cliente decida liquidar en Colones una orden cuyo valor base esté presupuestado en Dólares (o viceversa), se aplicará estrictamente el tipo de cambio de venta de divisas de referencia publicado por el Banco Central de Costa Rica (BCCR) correspondiente al día en que se efectúe la liquidación.`
  },
  {
    id: "poliza-garantia",
    slug: "poliza-garantia",
    order: 3,
    category: "WARRANTIES",
    titleEs: "Póliza Oficial de Garantía y Defectos de Fábrica",
    titleEn: "",
    badgeEs: "60 Días Taller • 90 Días Bolt-On • Software Lifetime",
    badgeEn: "",
    summaryEs: "Términos oficiales de garantía por escrito: 60 días en mano de obra técnica, 90 días en piezas mecánicas bolt-on y calibración ECU de por vida. Política estricta: NO se aceptan devoluciones de ningún tipo, únicamente fallos de fábrica comprobados.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Artículo 43 y concordantes de la Ley N° 7472 de Protección al Consumidor",
      "Reglamento Ejecutivo N° 37899-MEIC a la Ley de Defensa del Consumidor",
      "Código Civil de Costa Rica (Régimen de Vicios Ocultos)"
    ]),
    contentEs: `## Cláusula 1: Principio Fundamental de Cero Devoluciones

**EN ZXZ MODS COSTA RICA S.A. NO SE ACEPTA NINGÚN TIPO DE DEVOLUCIÓN NI REEMBOLSO BAJO NINGUNA CIRCUNSTANCIA, EXCEPTO ÚNICA Y EXCLUSIVAMENTE POR FALLOS O DEFECTOS DE FÁBRICA COMPROBADOS MEDIANTE INSPECCIÓN TÉCNICA OFICIAL.**

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

1. **Notificación Formal:** Para iniciar un reclamo de garantía por presunto fallo de fábrica, El Cliente debe comunicarse dentro del periodo de vigencia a nuestro canal oficial de soporte técnico vía WhatsApp (+506 8888-9999) o correo electrónico a \`garantias@zxzmods.com\`, adjuntando:
   - Número de orden o comprobante de compra.
   - Descripción detallada del síntoma o fallo observado.
   - Fotografías y vídeos claros en alta resolución que muestren la pieza instalada en el vehículo y el defecto alegado.
2. **Inspección Técnica Obligatoria:** ZxZ Mods requerirá la presentación de la pieza física o el ingreso del vehículo a nuestro taller central en Santa Ana, San José, para que nuestros mecánicos certificados dictaminen si la falla obedece a un defecto de manufactura o a un uso indebido/accidente.
3. **Plazo de Resolución:** De conformidad con la Ley N° 7472, La Empresa emitirá su informe técnico y resolución en un plazo no mayor a diez (10) días hábiles posteriores a la recepción física del componente para evaluación.`
  },
  {
    id: "privacidad-datos",
    slug: "privacidad-datos",
    order: 4,
    category: "PRIVACY",
    titleEs: "Política de Privacidad y Tratamiento de Datos Personales (Ley N° 8968)",
    titleEn: "",
    badgeEs: "Protección PRODHAB • Derechos ARCO",
    badgeEn: "",
    summaryEs: "Cumplimiento legal estricto de la Ley N° 8968 de Costa Rica. Protección de datos de usuarios, almacenamiento seguro en Firebase, finalidades legítimas y procedimiento para ejercicio de derechos ARCO.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Ley N° 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica",
      "Reglamento a la Ley N° 8968 (Decreto Ejecutivo N° 37554-JP)",
      "Normativa de la Agencia de Protección de Datos de los Habitantes (PRODHAB)"
    ]),
    contentEs: `## Cláusula 1: Responsable del Tratamiento y Marco Normativo

En cumplimiento estricto de la **Ley N° 8968** (*Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales* de la República de Costa Rica) y su respectivo Reglamento Ejecutivo, se informa a los usuarios que los datos de carácter personal recolectados a través de esta plataforma son tratados por **ZxZ Mods Costa Rica S.A.** (en adelante "La Empresa"), con domicilio en Calle 34, Pozos, Santa Ana, San José, Costa Rica, actuando como titular y responsable de las bases de datos automatizadas.

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

Para ejercer cualquiera de estos derechos, El Cliente podrá remitir una solicitud formal por escrito al correo electrónico **privacidad@zxzmods.com** o a **info@zxzmods.com**, indicando su nombre completo, copia de su documento de identidad y el derecho específico que desea hacer valer. La Empresa responderá a la solicitud dentro del plazo máximo fijado por la ley costarricense.

---

## Cláusula 5: Seguridad y Conservación de la Información

La información se almacena en infraestructuras seguras que emplean cifrado SSL/TLS para la transmisión de datos, firewalls perimetrales y mecanismos de autenticación mediante Firebase Auth. Los datos se conservarán durante el tiempo que subsista la relación comercial con el cliente y, posteriormente, durante los plazos legalmente exigidos por la legislación mercantil y tributaria costarricense para la prescripción de responsabilidades.`
  },
  {
    id: "importacion-aduanas",
    slug: "importacion-aduanas",
    order: 5,
    category: "LOGISTICS",
    titleEs: "Políticas de Importación, Envíos y Logística Aduanera desde EE.UU.",
    titleEn: "",
    badgeEs: "Envíos Directos USA • 7-21 Días Hábiles • Desalmacenaje",
    badgeEn: "",
    summaryEs: "Regulación de los plazos de importación de repuestos de alto rendimiento desde Estados Unidos (mínimo 7 a máximo 21 días hábiles como estimación), trámites aduaneros en Costa Rica y cláusulas de fuerza mayor.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Ley General de Aduanas de la República de Costa Rica (Ley N° 7557)",
      "Reglamento a la Ley General de Aduanas",
      "Código de Comercio de Costa Rica (Contratos de Transporte y Flete)"
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

ZxZ Mods Costa Rica S.A. asume la gestión integral de la logística de importación, incluyendo la contratación del flete internacional, la declaración aduanera (DUA), el pago de los correspondientes Derechos Arancelarios a la Importación (DAI), el Impuesto sobre el Valor Agregado (IVA) y las tasas de desalmacenaje fiscal.

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
2. El Cliente cuenta con un plazo perentorio de **cuarenta y ocho (48) horas naturales** para reportar cualquier faltante o daño cosmético exterior visible mediante fotografías remitidas a nuestros canales oficiales de soporte.`
  },
  {
    id: "descargo-responsabilidad",
    slug: "descargo-responsabilidad",
    order: 6,
    category: "SAFETY",
    titleEs: "Descargo de Responsabilidad para Vehículos Deportivos, Modificaciones Extremas y Carreras",
    titleEn: "",
    badgeEs: "Aviso de Garantía de Fábrica • Asunción de Riesgo Off-Road",
    badgeEn: "",
    summaryEs: "Advertencia legal y exención de responsabilidad para vehículos modificados de alto rendimiento. Consecuencias sobre garantías de agencia de fábrica, asunción voluntaria de riesgo off-road y equipos de seguridad obligatorios.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código Civil de Costa Rica (Régimen de Responsabilidad Extracontractual y Asunción del Riesgo)",
      "Ley de Tránsito por Vías Públicas Terrestres y Seguridad Vial de Costa Rica (Ley N° 9078)",
      "Ley N° 7472 (Obligación de Advertencia de Riesgos en Productos de Uso Peligroso)"
    ]),
    contentEs: `## Cláusula 1: Naturaleza Extrema de los Deportes Todo Terreno (Powersports)

El uso, conducción y operación de vehículos todo terreno tipo UTV (Side-by-Side), ATV (Cuadraciclos) y vehículos recreativos deportivos modificados para alto desempeño son actividades inherentemente peligrosas que conllevan riesgos graves e inevitables de accidentes, volcamientos, colisiones, daños materiales severos, lesiones corporales permanentes e incluso la muerte.

El Cliente y los operadores del vehículo declaran tener pleno conocimiento de la naturaleza de estas actividades y asumen de manera libre, consciente, voluntaria y exclusiva todos y cada uno de los riesgos directos e indirectos derivados de la conducción en terrenos agrestes, barro profundo, ríos, dunas, pendientes pronunciadas y pistas de obstáculos.

---

## Cláusula 2: Aviso Crítico sobre Garantías de Fábrica de Concesionarios (Agencias)

**AVISO VINCULANTE:** El Cliente reconoce y acepta de forma informada que la instalación de repuestos de alto rendimiento no provistos por la agencia original del vehículo, la modificación de la suspensión (lift kits, long travel), el cambio de dimensiones de neumáticos, el reemplazo de componentes del tren motriz y la reprogramación o flasheo electrónico de la computadora del motor (ECU) **PUEDEN ANULAR, RESTRINGIR O INVALIDAR TOTAL O PARCIALMENTE LA GARANTÍA ORIGINAL OTORGADA POR EL FABRICANTE O LA AGENCIA DISTRIBUIDORA DEL VEHÍCULO EN COSTA RICA** (tales como agencias oficiales de Can-Am, Polaris, CFMOTO, Yamaha, Honda, etc.).

ZxZ Mods Costa Rica S.A. no se hace responsable por reclamos, rechazos de garantía o cancelaciones de pólizas de mantenimiento que la agencia oficial aplique sobre el vehículo a raíz de las modificaciones contratadas por El Cliente.

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
- Abstenerse terminantemente de conducir bajo los efectos del alcohol, drogas o medicamentos que alteren los reflejos.`
  },
  {
    id: "taller-domicilio-remolque",
    slug: "taller-domicilio-remolque",
    order: 7,
    category: "LOGISTICS",
    titleEs: "Términos del Servicio de Taller Móvil a Domicilio y Transporte en Remolque",
    titleEn: "",
    badgeEs: "Instalación en Sitio • Plataforma Asegurada • Inspección 360°",
    badgeEn: "",
    summaryEs: "Requisitos de seguridad en la propiedad del cliente para servicio técnico a domicilio. Protocolo obligatorio de inspección fotográfica 360° de daños preexistentes para traslado en plataforma.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código Civil de Costa Rica (Obligaciones de Custodia y Depósito)",
      "Ley de Tránsito por Vías Públicas Terrestres de Costa Rica",
      "Ley N° 7472 (Condiciones de Seguridad en la Prestación de Servicios)"
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
2. **Exclusión de Daños Preexistentes:** ZxZ Mods Costa Rica S.A. no responderá bajo ninguna circunstancia por daños, fracturas o piezas faltantes que hayan sido registradas durante la inspección previa o que deriven del desgaste natural y uso previo de la máquina.
3. **Seguro de Transporte y Amarres:** El vehículo será asegurado a la plataforma mediante cuatro puntos de anclaje independientes a los brazos o chasis estructural. La Empresa cuenta con póliza de responsabilidad civil en sus vehículos tractores conforme a la Ley de Tránsito de Costa Rica.
4. **Objetos Personales y Carga Suelta:** El Cliente debe retirar del vehículo todo objeto de valor, herramientas sueltas, teléfonos, radios portátiles o pertenencias personales antes del traslado. La Empresa no se hace responsable por extravío de objetos dejados sueltos dentro de la cabina del UTV.`
  },
  {
    id: "reprogramacion-ecu",
    slug: "reprogramacion-ecu",
    order: 8,
    category: "TUNING",
    titleEs: "Política de Reprogramación de ECU, Calibración de Mapas y Tuning de Software",
    titleEn: "",
    badgeEs: "Garantía de Software Lifetime • Cero Garantía en Motor Físico",
    badgeEn: "",
    summaryEs: "Alcance técnico del servicio de reprogramación electrónica de computadoras (ECU remap). Respaldo permanente del software y exclusión total de averías de motor físico por bajo octanaje o maltrato mecánico.",
    summaryEn: "",
    jurisdiction: "San José, Costa Rica",
    lastUpdated: "Octubre 2026",
    applicableLawsJson: JSON.stringify([
      "Código Civil de Costa Rica (Límites de la Responsabilidad Contractual)",
      "Ley N° 7472 (Especificaciones Técnicas Claras de Servicios Especializados)",
      "Código de Comercio de Costa Rica"
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
La garantía otorgada por ZxZ Mods ampara de manera exclusiva y estricta el **archivo de software y su correcta carga digital en la memoria de la computadora**. 

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
2. **Temperatura y Aceite:** El Cliente es el único responsable de monitorear en tiempo real los indicadores de temperatura de refrigerante y aceite del motor, así como utilizar aceites sintéticos certificados para powersports de viscosidad adecuada. Operar el motor bajo sobrecalentamiento extremo anula cualquier posibilidad de reclamo.`
  }
];

async function main() {
  console.log("Iniciando sembrado de Documentos Legales oficiales de ZxZ Mods Costa Rica...");

  for (const doc of legalDocuments) {
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
        summaryEs: doc.summaryEs,
        summaryEn: doc.summaryEn,
        contentEs: doc.contentEs,
        contentEn: doc.contentEn,
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
        summaryEs: doc.summaryEs,
        summaryEn: doc.summaryEn,
        contentEs: doc.contentEs,
        contentEn: doc.contentEn,
        jurisdiction: doc.jurisdiction,
        lastUpdated: doc.lastUpdated,
        applicableLawsJson: doc.applicableLawsJson,
        isPublished: true,
      },
    });

    console.log(`✓ Documento legal sincronizado: [${upserted.order}] ${upserted.titleEs}`);
  }

  console.log("Sembrado de documentos legales finalizado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error al sembrar documentos legales:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
