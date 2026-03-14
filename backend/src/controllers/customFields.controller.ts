import { prisma } from '../config/database';
import { Request, Response } from 'express';

const VALID_FIELD_TYPES = [
  'TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'CAPACITY',
  'SELECT', 'MULTISELECT', 'CHECKBOX', 'DATE', 'DATETIME',
  'URL', 'EMAIL', 'PHONE', 'COLOR',
] as const;

const VALID_SCOPES = ['CATEGORY', 'GROUP', 'TYPE', 'MODEL', 'MANUFACTURER', 'ASSET'] as const;
const KEY_REGEX = /^[a-z][a-z0-9_]{1,63}$/;

function errorResponse(res: Response, statusCode: number, error: string) {
  res.status(statusCode).json({ error, statusCode });
}

function safeError(res: Response, error: unknown) {
  console.error(error);
  const isDev = process.env.NODE_ENV !== 'production';
  const msg = isDev && error instanceof Error ? error.message : 'Internal server error';
  errorResponse(res, 500, msg);
}

async function validateScopeEntity(scope: string, scopeId: number): Promise<boolean> {
  switch (scope) {
    case 'CATEGORY': return !!(await prisma.assetCategory.findUnique({ where: { id: scopeId } }));
    case 'GROUP':    return !!(await prisma.assetGroup.findUnique({ where: { id: scopeId } }));
    case 'TYPE':     return !!(await prisma.assetType.findUnique({ where: { id: scopeId } }));
    case 'MODEL':    return !!(await prisma.assetModel.findUnique({ where: { id: scopeId } }));
    default: return false;
  }
}

// ─── Fields ──────────────────────────────────────────────────────
export const listFields = async (req: Request, res: Response) => {
  try {
    const { status } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    const items = await prisma.customFieldDef.findMany({
      where,
      include: { CustomFieldOption: { where: { isActive: true }, orderBy: { order: 'asc' } } },
      orderBy: { key: 'asc' },
    });
    res.json(items);
  } catch (error) { safeError(res, error); }
};

export const createField = async (req: Request, res: Response) => {
  try {
    const { key, label, type, description, config } = req.body;

    if (!key || !label || !type)
      return errorResponse(res, 400, 'key, label y type son obligatorios');

    if (!KEY_REGEX.test(key))
      return errorResponse(res, 400, 'key debe ser snake_case (a-z, 0-9, _), iniciar con letra, 2-64 chars');

    if (!(VALID_FIELD_TYPES as readonly string[]).includes(type))
      return errorResponse(res, 400, `type inválido. Permitidos: ${VALID_FIELD_TYPES.join(', ')}`);

    const exists = await prisma.customFieldDef.findUnique({ where: { key } });
    if (exists)
      return errorResponse(res, 409, `Ya existe un campo con key "${key}"`);

    const item = await prisma.customFieldDef.create({
      data: { key, label: label.trim(), type, description: description?.trim() || null, config: config || null, status: 'ACTIVE', updatedAt: new Date() },
    });
    res.status(201).json(item);
  } catch (error) { safeError(res, error); }
};

export const updateField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 400, 'ID inválido');

    const existing = await prisma.customFieldDef.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 404, 'Campo no encontrado');

    const { label, type, description, config, status } = req.body;

    if (type && !(VALID_FIELD_TYPES as readonly string[]).includes(type))
      return errorResponse(res, 400, `type inválido. Permitidos: ${VALID_FIELD_TYPES.join(', ')}`);

    if (type && type !== existing.type) {
      const hasValues = await prisma.assetFieldValue.count({ where: { fieldId: id } });
      if (hasValues > 0)
        return errorResponse(res, 400, `No se puede cambiar el tipo del campo porque tiene ${hasValues} valores registrados`);
    }

    const item = await prisma.customFieldDef.update({
      where: { id },
      data: {
        ...(label !== undefined && { label: label.trim() }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(config !== undefined && { config }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
    });
    res.json(item);
  } catch (error) { safeError(res, error); }
};

export const deleteField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 400, 'ID inválido');

    const existing = await prisma.customFieldDef.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 404, 'Campo no encontrado');

    const activeBindings = await prisma.customFieldBinding.count({
      where: { fieldId: id, status: 'ACTIVE', isEnabled: true },
    });
    if (activeBindings > 0)
      return errorResponse(res, 400, `No se puede desactivar: el campo está vinculado a ${activeBindings} entidad(es) activa(s). Elimina los mapeos primero.`);

    await prisma.customFieldDef.update({ where: { id }, data: { status: 'INACTIVE', updatedAt: new Date() } });
    res.json({ success: true, message: 'Campo desactivado' });
  } catch (error) { safeError(res, error); }
};

// ─── Options ─────────────────────────────────────────────────────
export const listFieldOptions = async (req: Request, res: Response) => {
  try {
    const fieldId = Number(req.params.fieldId);
    if (isNaN(fieldId)) return errorResponse(res, 400, 'fieldId inválido');
    const items = await prisma.customFieldOption.findMany({ where: { fieldId }, orderBy: { order: 'asc' } });
    res.json(items);
  } catch (error) { safeError(res, error); }
};

export const addFieldOption = async (req: Request, res: Response) => {
  try {
    const fieldId = Number(req.params.fieldId);
    if (isNaN(fieldId)) return errorResponse(res, 400, 'fieldId inválido');

    const field = await prisma.customFieldDef.findUnique({ where: { id: fieldId } });
    if (!field) return errorResponse(res, 404, 'Campo no encontrado');

    if (!['SELECT', 'MULTISELECT'].includes(field.type))
      return errorResponse(res, 400, `Solo campos SELECT/MULTISELECT pueden tener opciones (campo es ${field.type})`);

    const { label, value, order } = req.body;
    if (!label || !value) return errorResponse(res, 400, 'label y value son obligatorios');

    const item = await prisma.customFieldOption.create({
      data: { fieldId, label: label.trim(), value: value.trim(), order: order ?? 0, isActive: true, updatedAt: new Date() },
    });
    res.status(201).json(item);
  } catch (error: any) {
    if (error?.code === 'P2002') return errorResponse(res, 409, 'Ya existe una opción con ese value para este campo');
    safeError(res, error);
  }
};

export const updateFieldOption = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 400, 'ID inválido');
    const { label, value, order, isActive } = req.body;
    const item = await prisma.customFieldOption.update({
      where: { id },
      data: {
        ...(label !== undefined && { label: label.trim() }),
        ...(value !== undefined && { value: value.trim() }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });
    res.json(item);
  } catch (error) { safeError(res, error); }
};

export const deleteFieldOption = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 400, 'ID inválido');
    await prisma.customFieldOption.update({ where: { id }, data: { isActive: false, updatedAt: new Date() } });
    res.json({ success: true, message: 'Opción desactivada' });
  } catch (error) { safeError(res, error); }
};

// ─── Bindings ────────────────────────────────────────────────────
export const listBindings = async (req: Request, res: Response) => {
  try {
    const { scope, scopeId } = req.query as any;
    const where: any = {};
    if (scope) {
      if (!(VALID_SCOPES as readonly string[]).includes(scope))
        return errorResponse(res, 400, `scope inválido. Permitidos: ${VALID_SCOPES.join(', ')}`);
      where.scope = scope;
    }
    if (scopeId) where.scopeId = Number(scopeId);
    const items = await prisma.customFieldBinding.findMany({
      where,
      include: { CustomFieldDef: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(items);
  } catch (error) { safeError(res, error); }
};

export const createBinding = async (req: Request, res: Response) => {
  try {
    const { scope, scopeId, fieldId, isEnabled, isVisible, isRequired, displayOrder, section } = req.body;

    if (!scope || !scopeId || !fieldId)
      return errorResponse(res, 400, 'scope, scopeId y fieldId son obligatorios');

    if (!(VALID_SCOPES as readonly string[]).includes(scope))
      return errorResponse(res, 400, `scope inválido. Permitidos: ${VALID_SCOPES.join(', ')}`);

    const numScopeId = Number(scopeId);
    const numFieldId = Number(fieldId);

    const field = await prisma.customFieldDef.findUnique({ where: { id: numFieldId } });
    if (!field) return errorResponse(res, 404, 'Campo personalizado no encontrado');
    if (field.status !== 'ACTIVE')
      return errorResponse(res, 400, 'No se puede vincular un campo inactivo');

    const entityExists = await validateScopeEntity(scope, numScopeId);
    if (!entityExists)
      return errorResponse(res, 404, `No existe la entidad ${scope} con id ${numScopeId}`);

    const duplicate = await prisma.customFieldBinding.findFirst({
      where: { scope, scopeId: numScopeId, fieldId: numFieldId },
    });
    if (duplicate) {
      if (duplicate.status === 'ACTIVE' && duplicate.isEnabled)
        return errorResponse(res, 409, 'Este campo ya está vinculado a esta entidad');
      const reactivated = await prisma.customFieldBinding.update({
        where: { id: duplicate.id },
        data: { isEnabled: true, isVisible: isVisible ?? true, isRequired: isRequired ?? false, status: 'ACTIVE', displayOrder: displayOrder ?? duplicate.displayOrder, section: section ?? duplicate.section, updatedAt: new Date() },
      });
      return res.json(reactivated);
    }

    const item = await prisma.customFieldBinding.create({
      data: { scope, scopeId: numScopeId, fieldId: numFieldId, isEnabled: isEnabled ?? true, isVisible: isVisible ?? true, isRequired: isRequired ?? false, displayOrder: displayOrder ?? 0, section: section || 'technical', status: 'ACTIVE', updatedAt: new Date() },
    });
    res.status(201).json(item);
  } catch (error) { safeError(res, error); }
};

export const updateBinding = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 400, 'ID inválido');

    const existing = await prisma.customFieldBinding.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 404, 'Mapeo no encontrado');

    const { isEnabled, isVisible, isRequired, displayOrder, section, status } = req.body;

    const item = await prisma.customFieldBinding.update({
      where: { id },
      data: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(isVisible !== undefined && { isVisible }),
        ...(isRequired !== undefined && { isRequired }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(section !== undefined && { section }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
    });
    res.json(item);
  } catch (error) { safeError(res, error); }
};

export const deleteBinding = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return errorResponse(res, 400, 'ID inválido');

    const existing = await prisma.customFieldBinding.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 404, 'Mapeo no encontrado');

    await prisma.customFieldBinding.update({
      where: { id },
      data: { status: 'INACTIVE', isEnabled: false, updatedAt: new Date() },
    });
    res.json({ success: true, message: 'Mapeo desactivado' });
  } catch (error) { safeError(res, error); }
};

// Values
export const upsertAssetValue = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    const { fieldId, valueText, valueNumber, valueDecimal, valueBoolean, valueDate, valueJson } = req.body;
    const item = await prisma.assetFieldValue.upsert({
      where: { assetId_fieldId: { assetId, fieldId } } as any,
      update: { valueText, valueNumber, valueDecimal, valueBoolean, valueDate: valueDate ? new Date(valueDate) : null, valueJson },
      create: { assetId, fieldId, valueText, valueNumber, valueDecimal, valueBoolean, valueDate: valueDate ? new Date(valueDate) : null, valueJson, updatedAt: new Date() },
    });
    res.json(item);
  } catch (error) {
    console.error('Error in upsertAssetValue:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

// Resolver de formulario (herencia)
export const resolveFieldsForType = async (req: Request, res: Response) => {
  try {
    const typeId = Number(req.params.typeId);
    const type = await prisma.assetType.findUnique({ where: { id: typeId }, include: { AssetGroup: { include: { AssetCategory: true } } } });
    if (!type) return res.status(404).json({ error: 'Type not found' });

    const bindings = await prisma.customFieldBinding.findMany({
      where: {
        OR: [
          { scope: 'CATEGORY', scopeId: type.AssetGroup.AssetCategory.id },
          { scope: 'GROUP', scopeId: type.groupId },
          { scope: 'TYPE', scopeId: typeId },
        ],
        status: 'ACTIVE',
        isEnabled: true,
      },
      orderBy: { displayOrder: 'asc' },
      include: { CustomFieldDef: { include: { CustomFieldOption: true } } },
    });

    const map = new Map<number, any>();
    for (const b of bindings) map.set(b.fieldId, b);
    const merged = Array.from(map.values())
      .filter(b => b.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(b => ({
        fieldId: b.fieldId,
        key: b.CustomFieldDef.key,
        label: b.CustomFieldDef.label,
        type: b.CustomFieldDef.type,
        config: b.CustomFieldDef.config,
        options: b.CustomFieldDef.CustomFieldOption
          ?.filter((o: any) => o.isActive)
          .sort((x: any, y: any) => (x.order ?? 0) - (y.order ?? 0)),
        isRequired: b.isRequired,
        section: b.section || null,
      }));

    res.json({ typeId, fields: merged });
  } catch (error) {
    console.error('Error in resolveFieldsForType:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

/**
 * ✨ NUEVO: Obtener campos completos para modal de creación de assets
 * Retorna: campos universales + dinámicos + reutilizables
 */
export const getFieldsForAssetType = async (req: Request, res: Response) => {
  try {
    const assetTypeId = Number(req.params.assetTypeId);
    
    // 1. Verificar que el AssetType existe
    const assetType = await prisma.assetType.findUnique({
      where: { id: assetTypeId },
      include: {
        AssetGroup: {
          include: {
            AssetCategory: true
          }
        }
      }
    }) as any; // Usar 'any' temporalmente hasta que Prisma regenere los tipos
    
    if (!assetType) {
      return res.status(404).json({ error: 'AssetType no encontrado' });
    }
    
    // 2. Campos Universales (siempre presentes, hardcodeados)
    const universalFields = [
      {
        key: 'name',
        label: 'Nombre del Activo',
        type: 'TEXT',
        isRequired: true,
        isReadonly: false,
        section: 'general',
        displayOrder: 1,
        helpText: 'El sistema ajustará automáticamente si el nombre ya existe'
      },
      {
        key: 'assetCode',
        label: 'Código de Activo',
        type: 'TEXT',
        isRequired: false,
        isReadonly: false,
        section: 'general',
        displayOrder: 2,
        helpText: 'Código único del activo (puede usar numeración automática)'
      },
      {
        key: 'manufacturerId',
        label: 'Fabricante',
        type: 'MANUFACTURER_SELECT',
        isRequired: false,
        isReadonly: false,
        section: 'general',
        displayOrder: 3,
        helpText: 'Fabricante del activo (se filtra por categoría seleccionada)'
      },
      {
        key: 'modelId',
        label: 'Modelo',
        type: 'MODEL_SELECT',
        isRequired: false,
        isReadonly: false,
        section: 'general',
        displayOrder: 4,
        helpText: 'Modelo del activo (se filtra por tipo seleccionado)'
      },
      {
        key: 'serialNumber',
        label: 'Número de Serie',
        type: 'TEXT',
        isRequired: false,
        isReadonly: false,
        section: 'general',
        displayOrder: 5,
        helpText: 'Número de serie del fabricante'
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'TEXTAREA',
        isRequired: false,
        isReadonly: false,
        section: 'general',
        displayOrder: 6
      },
      {
        key: 'companyId',
        label: 'Empresa',
        type: 'COMPANY_SELECT',
        isRequired: true,
        isReadonly: false,
        section: 'general',
        displayOrder: 7
      },
      {
        key: 'headquartersId',
        label: 'Sede',
        type: 'HEADQUARTERS_SELECT',
        isRequired: true,
        isReadonly: false,
        section: 'general',
        displayOrder: 8
      },
      {
        key: 'costCenter',
        label: 'Centro de Costos',
        type: 'TEXT',
        isRequired: true,
        isReadonly: false,
        section: 'general',
        displayOrder: 9
      },
      {
        key: 'assignedUserId',
        label: 'Usuario Asignado',
        type: 'USER_SELECT',
        isRequired: false,
        isReadonly: false,
        section: 'assignment',
        displayOrder: 8,
        helpText: 'Al seleccionar, se auto-completarán Empresa, Sede, Proceso y Cargo'
      },
      {
        key: 'processId',
        label: 'Proceso',
        type: 'PROCESS_SELECT',
        isRequired: false,
        isReadonly: false,
        section: 'assignment',
        displayOrder: 9
      },
      {
        key: 'jobTitleId',
        label: 'Cargo',
        type: 'JOB_TITLE_SELECT',
        isRequired: false,
        isReadonly: true,
        section: 'assignment',
        displayOrder: 10,
        helpText: 'Se auto-completa desde el Usuario Asignado y está bloqueado'
      },
      {
        key: 'purchaseDate',
        label: 'Fecha de Compra',
        type: 'DATE',
        isRequired: false,
        isReadonly: false,
        section: 'financial',
        displayOrder: 11
      },
      {
        key: 'purchaseValue',
        label: 'Valor de Compra',
        type: 'DECIMAL',
        isRequired: false,
        isReadonly: false,
        section: 'financial',
        displayOrder: 12
      },
      {
        key: 'warrantyExpiration',
        label: 'Fin de Garantía',
        type: 'DATE',
        isRequired: false,
        isReadonly: false,
        section: 'financial',
        displayOrder: 13
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'SELECT',
        isRequired: true,
        isReadonly: false,
        section: 'general',
        displayOrder: 14,
        options: [
          { value: 'ACTIVE', label: 'Activo' },
          { value: 'INACTIVE', label: 'Inactivo' },
          { value: 'MAINTENANCE', label: 'En Mantenimiento' },
          { value: 'RETIRED', label: 'Retirado' }
        ],
        defaultValue: 'ACTIVE'
      },
      {
        key: 'condition',
        label: 'Condición',
        type: 'SELECT',
        isRequired: true,
        isReadonly: false,
        section: 'general',
        displayOrder: 15,
        options: [
          { value: 'NEW', label: 'Nuevo' },
          { value: 'GOOD', label: 'Bueno' },
          { value: 'FAIR', label: 'Regular' },
          { value: 'POOR', label: 'Malo' }
        ],
        defaultValue: 'NEW'
      },
      {
        key: 'location',
        label: 'Ubicación Física',
        type: 'TEXT',
        isRequired: false,
        isReadonly: false,
        section: 'general',
        displayOrder: 16
      },
      {
        key: 'supplierId',
        label: 'Proveedor',
        type: 'SUPPLIER_SELECT',
        isRequired: false,
        isReadonly: false,
        section: 'financial',
        displayOrder: 17
      },
      {
        key: 'invoiceNumber',
        label: 'Número de Factura',
        type: 'TEXT',
        isRequired: false,
        isReadonly: false,
        section: 'financial',
        displayOrder: 18
      }
    ];
    
    // 3. Campos Dinámicos: herencia CATEGORY -> GROUP -> TYPE -> MODEL
    const categoryId = assetType.AssetGroup?.AssetCategory?.id;
    const groupId = assetType.AssetGroup?.id;
    const modelId = req.query.modelId ? Number(req.query.modelId) : null;

    const scopeFilters: Array<{ scope: any; scopeId: number }> = [];
    if (categoryId) scopeFilters.push({ scope: 'CATEGORY', scopeId: categoryId });
    if (groupId) scopeFilters.push({ scope: 'GROUP', scopeId: groupId });
    scopeFilters.push({ scope: 'TYPE', scopeId: assetTypeId });
    if (modelId) scopeFilters.push({ scope: 'MODEL', scopeId: modelId });

    const dynamicFieldsBindings = await prisma.customFieldBinding.findMany({
      where: {
        OR: scopeFilters,
        isEnabled: true,
        isVisible: true,
        status: 'ACTIVE'
      },
      include: {
        CustomFieldDef: {
          include: {
            CustomFieldOption: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    const fieldMap = new Map<number, any>();
    for (const binding of dynamicFieldsBindings) {
      fieldMap.set(binding.fieldId, binding);
    }

    const dynamicFields = Array.from(fieldMap.values()).map(binding => ({
      id: binding.id,
      fieldId: binding.fieldId,
      key: binding.CustomFieldDef.key,
      label: binding.CustomFieldDef.label,
      type: binding.CustomFieldDef.type,
      description: binding.CustomFieldDef.description,
      config: binding.CustomFieldDef.config,
      options: binding.CustomFieldDef.CustomFieldOption || [],
      isRequired: binding.isRequired,
      isVisible: binding.isVisible,
      section: binding.section || 'technical',
      displayOrder: binding.displayOrder,
      scope: binding.scope,
      helpText: binding.CustomFieldDef.description || null
    }));
    
    // 4. Campos Reutilizables (de otros tipos, disponibles para invocar)
    const allTypeBindings = await prisma.customFieldBinding.findMany({
      where: {
        scope: 'TYPE',
        scopeId: { not: assetTypeId },  // De otros tipos
        isEnabled: true,
        status: 'ACTIVE'
      },
      include: {
        CustomFieldDef: {
          include: {
            CustomFieldOption: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    
    // Obtener todos los tipos únicos de una vez (optimización para evitar N+1)
    const uniqueTypeIds = [...new Set(allTypeBindings.map(b => b.scopeId))];
    const typesMap = new Map<number, any>();
    if (uniqueTypeIds.length > 0) {
      const types = await prisma.assetType.findMany({
        where: { id: { in: uniqueTypeIds } },
        select: { id: true, name: true, label: true }
      });
      types.forEach(type => {
        typesMap.set(type.id, {
          id: type.id,
          name: type.name,
          label: type.label || type.name
        });
      });
    }
    
    // Agrupar por fieldId para evitar duplicados
    const reusableFieldsMap = new Map<number, any>();
    for (const binding of allTypeBindings) {
      if (!reusableFieldsMap.has(binding.fieldId)) {
        reusableFieldsMap.set(binding.fieldId, {
          fieldId: binding.fieldId,
          key: binding.CustomFieldDef.key,
          label: binding.CustomFieldDef.label,
          type: binding.CustomFieldDef.type,
          description: binding.CustomFieldDef.description,
          config: binding.CustomFieldDef.config,
          options: binding.CustomFieldDef.CustomFieldOption || [],
          usedInTypes: []  // Se llenará después
        });
      }
      const field = reusableFieldsMap.get(binding.fieldId);
      const type = typesMap.get(binding.scopeId);
      if (type) {
        field.usedInTypes.push(type);
      }
    }
    
    const reusableFields = Array.from(reusableFieldsMap.values());
    
    // 5. ConnectionConfig del AssetType
    // Acceder a los campos con 'any' ya que Prisma aún no ha regenerado los tipos
    const allowsConnections = (assetType as any).allowsConnections || false;
    const connectionConfigRaw = (assetType as any).connectionConfig;
    
    const connectionConfig = allowsConnections && connectionConfigRaw
      ? {
          enabled: true,
          types: connectionConfigRaw?.types || [],
          maxConnections: connectionConfigRaw?.maxConnections || 10,
          mandatoryInDocuments: connectionConfigRaw?.mandatoryInDocuments || false
        }
      : null;
    
    res.json({
      success: true,
      data: {
        assetType: {
          id: assetType.id,
          name: assetType.name,
          label: assetType.label || assetType.name,
          allowsConnections: allowsConnections,
          connectionConfig
        },
        universalFields,
        dynamicFields,
        reusableFields
      }
    });
  } catch (error: any) {
    console.error('Error getting fields for asset type:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener campos para el tipo de activo'
    });
  }
};

/**
 * ✨ NUEVO: Invocar campo reutilizable en un AssetType
 */
export const invokeReusableField = async (req: Request, res: Response) => {
  try {
    const assetTypeId = Number(req.params.assetTypeId);
    const { fieldId, isRequired = false, section = 'technical', displayOrder } = req.body;
    
    // Verificar que el AssetType existe
    const assetType = await prisma.assetType.findUnique({
      where: { id: assetTypeId }
    });
    
    if (!assetType) {
      return res.status(404).json({ error: 'AssetType no encontrado' });
    }
    
    // Verificar que el campo existe
    const field = await prisma.customFieldDef.findUnique({
      where: { id: fieldId },
      include: { CustomFieldOption: true }
    });
    
    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }
    
    // Verificar que no existe ya un binding para este campo en este tipo
    const existingBinding = await prisma.customFieldBinding.findFirst({
      where: {
        scope: 'TYPE',
        scopeId: assetTypeId,
        fieldId: fieldId
      }
    });
    
    if (existingBinding) {
      // Si existe pero está deshabilitado, habilitarlo
      if (!existingBinding.isEnabled) {
        const updated = await prisma.customFieldBinding.update({
          where: { id: existingBinding.id },
          data: {
            isEnabled: true,
            isVisible: true,
            isRequired,
            section,
            displayOrder: displayOrder || existingBinding.displayOrder,
            status: 'ACTIVE'
          },
          include: {
            CustomFieldDef: {
              include: { CustomFieldOption: true }
            }
          }
        });
        
        return res.json({
          success: true,
          data: updated,
          message: 'Campo reutilizable habilitado en este tipo'
        });
      } else {
        return res.status(400).json({
          error: 'Este campo ya está vinculado a este tipo de activo'
        });
      }
    }
    
    // Obtener el siguiente displayOrder si no se especifica
    let finalDisplayOrder = displayOrder;
    if (!finalDisplayOrder) {
      const lastBinding = await prisma.customFieldBinding.findFirst({
        where: {
          scope: 'TYPE',
          scopeId: assetTypeId
        },
        orderBy: { displayOrder: 'desc' }
      });
      finalDisplayOrder = lastBinding ? lastBinding.displayOrder + 1 : 1;
    }
    
    // Crear el binding
    const binding = await prisma.customFieldBinding.create({
      data: {
        scope: 'TYPE',
        scopeId: assetTypeId,
        fieldId: fieldId,
        isEnabled: true,
        isVisible: true,
        isRequired,
        section,
        displayOrder: finalDisplayOrder,
        status: 'ACTIVE',
        updatedAt: new Date()
      },
      include: {
        CustomFieldDef: {
          include: { CustomFieldOption: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: binding,
      message: 'Campo reutilizable agregado exitosamente'
    });
  } catch (error: any) {
    console.error('Error invoking reusable field:', error);
    res.status(500).json({
      error: error.message || 'Error al invocar campo reutilizable'
    });
  }
};


