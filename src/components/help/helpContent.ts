export interface FieldHelpEntry {
  title: string;
  whatToEnter: string;
  formatRange: string;
  financialImpact: string;
}

export const FIELD_HELP: Record<string, FieldHelpEntry> = {
  // Login & Registro
  'login.email': {
    title: 'Correo electrónico de acceso',
    whatToEnter: 'Ingresa el correo registrado de tu bodega, cuenta Superadmin o cuenta de vecino.',
    formatRange: 'Formato email válido (ej. donlucho@bodegaelvecino.pe).',
    financialImpact: 'Determina tu perfil de acceso (ADMIN_NEGOCIO, ADMIN_SISTEMA o CLIENTE) y aislamiento de cartera.',
  },
  'login.dni': {
    title: 'DNI o correo del vecino',
    whatToEnter: 'Ingresa tu número de documento (DNI) o correo electrónico registrado por tu bodega.',
    formatRange: 'DNI de 8 dígitos numéricos o correo válido.',
    financialImpact: 'Permite consultar únicamente tu propia línea de crédito, cronogramas y estado de cuenta.',
  },
  'login.password': {
    title: 'Contraseña de seguridad',
    whatToEnter: 'Tu clave secreta personal de acceso a Defia Book.',
    formatRange: 'Mínimo 6 caracteres (8 en cuentas demo).',
    financialImpact: 'Protege la información financiera y registros de bitácora bajo sesión JWT.',
  },
  'register.ruc': {
    title: 'RUC del comercio',
    whatToEnter: 'Número de Registro Único de Contribuyentes de la bodega o comercio.',
    formatRange: 'Exactamente 11 dígitos numéricos (ej. 20601234567).',
    financialImpact: 'Identifica tributariamente a la tienda emisora en comprobantes y estados de cuenta.',
  },
  'register.razonSocial': {
    title: 'Razón Social',
    whatToEnter: 'Denominación legal completa del negocio o persona natural con negocio.',
    formatRange: 'Texto de al menos 3 caracteres.',
    financialImpact: 'Se muestra en la cabecera de contratos, cronogramas y estados de cuenta imprimibles.',
  },
  'register.nombreComercial': {
    title: 'Nombre Comercial',
    whatToEnter: 'Nombre conocido de tu bodega con el que te identifican tus vecinos.',
    formatRange: 'Mínimo 2 caracteres (ej. Bodega El Vecino).',
    financialImpact: 'Aparece en el panel principal y en el portal de consulta de tus clientes.',
  },
  'register.direccion': {
    title: 'Dirección del local',
    whatToEnter: 'Dirección física donde opera la bodega o punto de cobro.',
    formatRange: 'Mínimo 3 caracteres.',
    financialImpact: 'Sirve como domicilio comercial referencial en los reportes de cobranza.',
  },
  'register.telefono': {
    title: 'Teléfono / WhatsApp de contacto',
    whatToEnter: 'Número de contacto del comercio para consultas de los vecinos.',
    formatRange: 'Opcional; ej. +51 987654321.',
    financialImpact: 'Informativo para coordinación de cobranzas y recordatorios.',
  },
  'register.monedaDefecto': {
    title: 'Moneda predeterminada de la tienda',
    whatToEnter: 'Moneda principal en la que opera tu negocio (Soles o Dólares).',
    formatRange: 'PEN (S/) o USD (US$).',
    financialImpact: 'Define el símbolo monetario por defecto y las referencias de topes BCRP aplicables.',
  },
  'register.horaCorte': {
    title: 'Hora de corte diario',
    whatToEnter: 'Hora límite del día hasta la cual una compra entra en el ciclo actual.',
    formatRange: 'Entero de 0 a 23 (por defecto 18 = 6:00 p. m.).',
    financialImpact: 'Determina si una compra realizada exactamente el día de corte pasa al ciclo siguiente.',
  },

  // Cliente
  'cliente.nombreCompleto': {
    title: 'Nombre completo del vecino',
    whatToEnter: 'Nombres y apellidos completos tal como figuran en su documento.',
    formatRange: 'Mínimo 3 caracteres.',
    financialImpact: 'Identifica al titular responsable de la línea de crédito y el pagaré/libreta.',
  },
  'cliente.tipoDoc': {
    title: 'Tipo de documento',
    whatToEnter: 'Selecciona DNI, Carnet de Extranjería (CE) o RUC.',
    formatRange: 'Valores permitidos: DNI, CE, RUC.',
    financialImpact: 'Asegura unicidad del cliente dentro de tu tienda (no se duplican documentos).',
  },
  'cliente.numDoc': {
    title: 'Número de documento',
    whatToEnter: 'Número del documento de identidad sin espacios ni guiones.',
    formatRange: 'Entre 8 y 11 dígitos numéricos.',
    financialImpact: 'Permite al vecino iniciar sesión en su portal de consulta y buscar su expediente rápido.',
  },
  'cliente.telefono': {
    title: 'Teléfono / WhatsApp',
    whatToEnter: 'Número celular del vecino para avisos de vencimiento.',
    formatRange: 'Opcional (ej. +51 912345678).',
    financialImpact: 'Facilita el seguimiento preventivo antes de la fecha de pago oportuno.',
  },
  'cliente.direccion': {
    title: 'Dirección del domicilio',
    whatToEnter: 'Dirección actual donde reside el vecino.',
    formatRange: 'Opcional, texto libre.',
    financialImpact: 'Respaldo de ubicación en el expediente del deudor.',
  },
  'cliente.email': {
    title: 'Correo electrónico del vecino',
    whatToEnter: 'Correo electrónico para acceso al Portal del Vecino (rol CLIENTE).',
    formatRange: 'Opcional; formato email válido.',
    financialImpact: 'Junto con la contraseña, habilita que el vecino consulte sus cuotas y estado de cuenta.',
  },
  'cliente.password': {
    title: 'Clave para Portal del Vecino',
    whatToEnter: 'Contraseña inicial para que el vecino consulte sus créditos en línea.',
    formatRange: 'Mínimo 6 caracteres (opcional en edición si no se desea cambiar).',
    financialImpact: 'Se cifra con bcrypt en el servidor; nunca se almacena en texto plano.',
  },
  'cliente.ingresosNetos': {
    title: 'Ingresos netos mensuales',
    whatToEnter: 'Ingreso mensual estimado del cliente para evaluar su capacidad de pago.',
    formatRange: 'Número mayor o igual a 0.',
    financialImpact: 'Referencia comercial para asignar un límite de crédito prudente L.',
  },
  'cliente.moneda': {
    title: 'Moneda de la línea de crédito',
    whatToEnter: 'Moneda en la que se pactan y emiten todos los créditos del cliente.',
    formatRange: 'PEN (Soles) o USD (Dólares).',
    financialImpact: 'Define los topes referenciales BCRP (PEN: 100%/50% | USD: 80%/40%) y moneda de las cuotas.',
  },
  'cliente.tipoTasa': {
    title: 'Tipo de tasa compensatoria',
    whatToEnter: 'Elige Efectiva Anual (TEA) o Nominal Anual (TNA).',
    formatRange: 'Efectiva o Nominal.',
    financialImpact: 'Si es Nominal, el motor convierte TNA a TEA con la fórmula TEA = (1 + TNA/m)^m - 1 antes de calcular cuotas.',
  },
  'cliente.tasa': {
    title: 'Tasa compensatoria anual (%)',
    whatToEnter: 'Porcentaje anual pactado con el cliente (ej. ingresa 36 para 36%).',
    formatRange: 'Mayor a 0% y dentro del tope BCRP (máx. 100% TEA en PEN, 80% TEA en USD).',
    financialImpact: 'Determina la TEM (base 30/360), el interés de gracia total y las cuotas del cronograma.',
  },
  'cliente.capitalizacion': {
    title: 'Frecuencia de capitalización (m)',
    whatToEnter: 'Número de capitalizaciones por año cuando la tasa es Nominal.',
    formatRange: '12 (Mensual), 360 (Diaria), 4 (Trimestral), 2 (Semestral), 1 (Anual).',
    financialImpact: 'A mayor frecuencia m para una misma TNA, mayor es la TEA resultante.',
  },
  'cliente.teaMora': {
    title: 'TEA Moratoria anual (%)',
    whatToEnter: 'Tasa efectiva anual aplicada únicamente sobre cuotas vencidas no pagadas.',
    formatRange: '0% o mayor, hasta tope BCRP (máx. 50% en PEN, 40% en USD).',
    financialImpact: 'Calcula el Interés Moratorio sin anatocismo: IM = Cuota × [(1 + TEAm)^(dm/360) - 1].',
  },
  'cliente.diaCorte': {
    title: 'Día de corte del ciclo',
    whatToEnter: 'Día del mes en que cierra la facturación del cliente.',
    formatRange: 'Entero entre 1 y 28.',
    financialImpact: 'Define qué compras entran en el ciclo actual y calcula los días de gracia total g hasta el pago.',
  },
  'cliente.diaPago': {
    title: 'Día de pago oportuno',
    whatToEnter: 'Día del mes en que vencen las cuotas del cliente sin generar mora.',
    formatRange: 'Entero entre 1 y 28.',
    financialImpact: 'Fija la Primera Fecha de Pago (F0) y el vencimiento mensual de cada cuota (cada 30 días).',
  },
  'cliente.limiteCredito': {
    title: 'Límite de crédito aprobado (L)',
    whatToEnter: 'Tope máximo de capital vigente que puede adeudar el cliente.',
    formatRange: 'Número positivo (> 0).',
    financialImpact: 'El motor bloquea cualquier nuevo crédito si Capital Vigente (Kv) + Precio Lista (PL) > L.',
  },
  'cliente.maxMeses': {
    title: 'Plazo máximo permitido (meses)',
    whatToEnter: 'Número máximo de cuotas mensuales autorizadas para este vecino.',
    formatRange: 'Entero mayor o igual a 1 (ej. 6 o 12 meses).',
    financialImpact: 'Limita el número de cuotas seleccionables en el Wizard de emisión de crédito.',
  },

  // Producto
  'producto.sku': {
    title: 'Código SKU del producto',
    whatToEnter: 'Código interno único del bien o servicio (si lo dejas vacío se genera automáticamente).',
    formatRange: 'Mínimo 2 caracteres; único por tienda.',
    financialImpact: 'Identifica el bien en el catálogo y en el comprobante de emisión de crédito.',
  },
  'producto.nombre': {
    title: 'Nombre del bien o servicio',
    whatToEnter: 'Descripción breve y clara del producto financiable.',
    formatRange: 'Mínimo 2 caracteres.',
    financialImpact: 'Aparece en el selector del Paso 1 del Wizard y en el detalle del crédito.',
  },
  'producto.marca': {
    title: 'Marca comercial',
    whatToEnter: 'Marca del fabricante o línea del producto.',
    formatRange: 'Opcional (ej. Surge, Costeño, LG).',
    financialImpact: 'Ayuda a diferenciar presentaciones en el catálogo sin gestionar stock.',
  },
  'producto.proveedor': {
    title: 'Proveedor',
    whatToEnter: 'Nombre del distribuidor o proveedor del bien o servicio.',
    formatRange: 'Opcional, texto libre.',
    financialImpact: 'Información de referencia comercial almacenada en el catálogo.',
  },
  'producto.unidadMedida': {
    title: 'Unidad de medida',
    whatToEnter: 'Unidad de entrega o presentación del producto.',
    formatRange: 'Ej. UNIDAD, SACO, PACK, SERVICIO.',
    financialImpact: 'Clarifica qué unidad recibe el cliente al momento de pactar el crédito.',
  },
  'producto.precioContado': {
    title: 'Precio al Contado (Pc)',
    whatToEnter: 'Valor del bien si el cliente lo pagara al contado en tienda.',
    formatRange: 'Número positivo mayor a 0.',
    financialImpact: 'Base para el cálculo de la TCEA real que percibe el cliente al comparar contra los flujos pagados.',
  },
  'producto.precioLista': {
    title: 'Precio de Lista / Crédito (PL)',
    whatToEnter: 'Monto financiado nominal al otorgar crédito (puede coincidir o diferir de Pc).',
    formatRange: 'Número positivo mayor a 0.',
    financialImpact: 'Es el capital inicial P que consume línea de crédito (Kv + PL <= L) y sobre el que se calcula el cronograma.',
  },
  'producto.imagenUrl': {
    title: 'URL de imagen referencial',
    whatToEnter:
      'Enlace directo opcional a la imagen del producto (.jpg, .png, .webp), no el enlace a una página web HTML.',
    formatRange:
      'Opcional; URL http(s) directa a archivo de imagen. Si no carga, la tarjeta usa el ícono por defecto.',
    financialImpact: 'Solo visual para mostrar el producto en catálogo y Wizard.',
  },
  'producto.descripcion': {
    title: 'Descripción comercial',
    whatToEnter: 'Detalle adicional o especificaciones del bien o servicio.',
    formatRange: 'Opcional, texto libre.',
    financialImpact: 'Referencia informativa al momento de ofrecer el crédito.',
  },
  'producto.modalidades': {
    title: 'Modalidades de financiamiento permitidas',
    whatToEnter: 'Marca si el bien puede venderse en Pago Único a fin de mes y/o Cuotas mensuales.',
    formatRange: 'Debe estar activa al menos una modalidad.',
    financialImpact: 'Restringe las opciones disponibles en el Paso 2 del Wizard para este producto.',
  },

  // Wizard de Crédito
  'wizard.clienteId': {
    title: 'Cliente titular del crédito',
    whatToEnter: 'Selecciona al vecino activo que realizará la compra al crédito.',
    formatRange: 'Cliente activo con cupo disponible (L - Kv > 0).',
    financialImpact: 'Sus condiciones contractuales (tasa, moneda, corte, pago) rigen la emisión real del crédito.',
  },
  'wizard.productoId': {
    title: 'Producto o servicio a financiar',
    whatToEnter: 'Elige un bien del catálogo o ingresa un monto libre de compra.',
    formatRange: 'Producto activo; sin bloqueo por stock.',
    financialImpact: 'Define el Precio al Contado (Pc), Precio de Lista (PL) y modalidades permitidas.',
  },
  'wizard.precioLista': {
    title: 'Monto a financiar / Precio de Lista (PL)',
    whatToEnter: 'Capital nominal de la operación crediticia.',
    formatRange: 'Mayor a 0 y menor o igual al cupo disponible (L - Kv).',
    financialImpact: 'Consume línea de crédito (Kv + PL <= L) y sirve de base para capitalizar la gracia total.',
  },
  'wizard.precioContado': {
    title: 'Precio al Contado referencial (Pc)',
    whatToEnter: 'Valor al contado equivalente de la operación.',
    formatRange: 'Mayor a 0.',
    financialImpact: 'El motor calcula la TCEA resolviendo el flujo descontado contra Pc.',
  },
  'wizard.modalidad': {
    title: 'Modalidad de crédito',
    whatToEnter: 'Elige entre Cuotas mensuales (Método Francés) o Pago Único a fecha de pago.',
    formatRange: 'Cuotas o PagoUnico (según producto).',
    financialImpact: 'Cuotas genera cronograma nivelado con gracia total; Pago Único liquida capital + interés diferido en F0.',
  },
  'wizard.plazoMeses': {
    title: 'Plazo en cuotas mensuales',
    whatToEnter: 'Cantidad de cuotas mensuales (mes comercial de 30 días).',
    formatRange: 'Entre 1 y el plazo máximo del cliente (1 fijo en Pago Único).',
    financialImpact: 'Define n en el Factor de Recuperación de Capital (FRC) para hallar la cuota constante R.',
  },
  'wizard.fCompra': {
    title: 'Fecha de compra / emisión',
    whatToEnter: 'Fecha en la que se realiza la venta a crédito.',
    formatRange: 'Formato fecha YYYY-MM-DD.',
    financialImpact: 'Junto al día de corte y hora de corte, determina el ciclo de facturación y los días de gracia g.',
  },
  'wizard.diasGracia': {
    title: 'Días de gracia total (g)',
    whatToEnter: 'Opcional: deja vacío para que el motor calcule automáticamente según corte/pago, o especifica un valor.',
    formatRange: 'Entero >= 0 días (base 360).',
    financialImpact: 'Capitaliza los intereses de gracia al inicio: P\' = PL × (1 + TEA)^(g/360).',
  },
  'wizard.whatIf': {
    title: 'Modo Simulación What-If (solo prueba)',
    whatToEnter: 'Actívalo solo si deseas probar tasas o monedas hipotéticas en el simulador.',
    formatRange: 'Interruptor de prueba.',
    financialImpact: 'Por seguridad, deshabilita el botón de emisión real hasta restaurar las condiciones contractuales del cliente.',
  },

  // Pago Modal
  'pago.fPago': {
    title: 'Fecha efectiva del pago',
    whatToEnter: 'Selecciona la fecha en que el cliente realiza el abono en caja.',
    formatRange: 'Fecha YYYY-MM-DD (usa los botones rápidos para simular a tiempo vs. hoy).',
    financialImpact: 'El backend calcula dm = max(0, fPago - fechaVencimiento) e IM sin anatocismo al instante.',
  },
  'pago.metodoPago': {
    title: 'Medio de pago recibido',
    whatToEnter: 'Selecciona el canal mediante el cual ingresa el dinero.',
    formatRange: 'EFECTIVO, YAPE, PLIN o TRANSFERENCIA.',
    financialImpact: 'Se registra en el historial de pagos y bitácora de recaudación.',
  },
  'pago.referencia': {
    title: 'Referencia u operación digital',
    whatToEnter: 'Código opcional de operación Yape/Plin/Transferencia.',
    formatRange: 'Texto libre opcional para control interno de caja.',
    financialImpact: 'Informativo en pantalla; el cálculo financiero no varía.',
  },
  'pago.montoRecibido': {
    title: 'Monto total recibido en caja',
    whatToEnter: 'Importe entregado por el vecino; debe cubrir el Total Exigible exacto (T + IM).',
    formatRange: 'Mayor o igual al Total Exigible devuelto por el servidor.',
    financialImpact: 'El motor rechaza pagos parciales (monto < Total Exigible) e imputa: 1° Mora, 2° Compensatorio, 3° Capital.',
  },

  // Configuración Tienda & Superadmin
  'config.razonSocial': {
    title: 'Razón Social de la tienda',
    whatToEnter: 'Nombre jurídico o razón social registrada.',
    formatRange: 'Mínimo 3 caracteres.',
    financialImpact: 'Se muestra en encabezados formales y reportes.',
  },
  'config.nombreComercial': {
    title: 'Nombre Comercial',
    whatToEnter: 'Nombre visible de la bodega en la interfaz.',
    formatRange: 'Mínimo 2 caracteres.',
    financialImpact: 'Actualiza el encabezado del panel y barra lateral.',
  },
  'config.direccion': {
    title: 'Dirección del establecimiento',
    whatToEnter: 'Ubicación física principal de la bodega.',
    formatRange: 'Mínimo 3 caracteres.',
    financialImpact: 'Dato informativo en estados de cuenta.',
  },
  'config.telefono': {
    title: 'Teléfono de contacto',
    whatToEnter: 'Número de atención al cliente de la tienda.',
    formatRange: 'Opcional.',
    financialImpact: 'Informativo.',
  },
  'config.monedaDefecto': {
    title: 'Moneda predeterminada',
    whatToEnter: 'Moneda base de operación comercial.',
    formatRange: 'PEN o USD.',
    financialImpact: 'Orienta el formato predeterminado del negocio.',
  },
  'config.horaCorte': {
    title: 'Hora de corte diario (0–23)',
    whatToEnter: 'Hora límite de recepción de compras del mismo día de corte.',
    formatRange: 'Entero de 0 a 23 (ej. 18 = 6:00 p. m.).',
    financialImpact: 'Se usa en el algoritmo de determinación de ciclo al emitir créditos.',
  },
  'estadoCuenta.fCorte': {
    title: 'Fecha de referencia / corte',
    whatToEnter: 'Fecha con la cual deseas calcular el estado de cuenta y la mora acumulada.',
    formatRange: 'Formato fecha YYYY-MM-DD.',
    financialImpact: 'El backend recalcula el ciclo vigente, días de atraso e interés moratorio a esa fecha exacta.',
  },
};

export interface GlossaryItem {
  term: string;
  formula?: string;
  description: string;
}

export const FINANCIAL_GLOSSARY: GlossaryItem[] = [
  {
    term: 'TNA vs. TEA (Conversión Anual)',
    formula: 'TEA = (1 + TNA / m)^m - 1',
    description:
      'La Tasa Nominal Anual (TNA) requiere conocer cuántas veces al año capitaliza (m = 12 mensual, 360 diaria). El motor la convierte siempre a Tasa Efectiva Anual (TEA) para operar en base homogénea.',
  },
  {
    term: 'Período de Gracia Total (g)',
    formula: "P' = PL × (1 + TEA)^(g / 360)",
    description:
      'Días entre la fecha de compra y el inicio del primer período mensual de amortización. En gracia total no se pagan cuotas aún, pero el interés compensatorio devengado se capitaliza al principal P\'.',
  },
  {
    term: 'Método Francés Vencido Ordinario',
    formula: 'R = P\' × [TEM × (1 + TEM)^n] / [(1 + TEM)^n - 1]',
    description:
      'Sistema de cuotas constantes calculadas sobre meses comerciales de 30 días y año de 360 días. La última cuota absorbe cualquier residuo de redondeo para dejar el saldo final exactamente en 0.00.',
  },
  {
    term: 'TCEA y TREA',
    description:
      'Tasa de Costo Efectivo Anual (para el cliente) y Tasa de Rendimiento Efectivo Anual (para la tienda), calculadas en el servidor por bisección numérica sobre el flujo real descontado en base 360 días.',
  },
  {
    term: 'Interés Moratorio (Sin Anatocismo)',
    formula: 'IM = Cuota × [(1 + TEAm)^(dm / 360) - 1]',
    description:
      'Se calcula exclusivamente sobre la cuota exigible vencida por los días de atraso (dm), sin capitalizarse sobre el saldo futuro ni generar interés sobre interés.',
  },
  {
    term: 'Prelación Legal de Imputación y Cero Pagos Parciales',
    description:
      'Todo abono debe cubrir el Total Exigible exacto (Cuota + Mora). El motor imputa estrictamente en orden: 1° Interés Moratorio → 2° Interés Compensatorio → 3° Amortización de Capital.',
  },
];

export const FIXED_CONVENTIONS = [
  { label: 'Año Comercial Base', value: '360 días exactos' },
  { label: 'Mes Comercial', value: '30 días homogéneos por cuota' },
  { label: 'Redondeo Monetario', value: 'Comercial a 2 decimales (R2)' },
  { label: 'Topes Referenciales BCRP (PEN)', value: 'Compensatoria máx. 100.00% TEA · Mora máx. 50.00% TEA' },
  { label: 'Topes Referenciales BCRP (USD)', value: 'Compensatoria máx. 80.00% TEA · Mora máx. 40.00% TEA' },
  { label: 'Control de Línea de Crédito', value: 'Kv + PL <= L (validado en servidor)' },
];

export const MODULE_GUIDES = [
  {
    module: 'Clientes y Línea de Crédito',
    summary:
      'Registra a tus vecinos con su DNI/CE/RUC, límite aprobado (L), tasa pactada y días de corte/pago (1–28). Desde su expediente puedes imprimir su Estado de Cuenta al corte.',
  },
  {
    module: 'Catálogo de Productos',
    summary:
      'Configura bienes y servicios con Precio al Contado (Pc), Precio de Lista (PL) y modalidades permitidas (Pago Único y/o Cuotas). No se controla inventario ni stock.',
  },
  {
    module: 'Wizard de Nuevo Crédito (3 Pasos)',
    summary:
      'Paso 1 verifica cupo (Kv + PL <= L); Paso 2 muestra las condiciones contractuales del cliente y topes BCRP; Paso 3 renderiza el cronograma francés exacto devuelto por el backend antes de emitir.',
  },
  {
    module: 'Cobranza y Liquidación de Pagos',
    summary:
      'Consulta en vivo la mora al día de pago desde el servidor, rechaza pagos parciales y aplica automáticamente la prelación 1° Mora → 2° Compensatorio → 3° Capital.',
  },
];
