import { prisma } from '../config/database';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

export const listAssets = async (req: Request, res: Response) => {
  try {
    const { 
      companyId, 
      headquartersId, 
      typeId, 
      categoryId,
      groupId,
      manufacturerId,
      modelId,
      status 
    } = req.query as any;
    
    const where: any = {};
    
    // Filtros directos
    if (companyId) where.companyId = Number(companyId);
    if (headquartersId) where.headquartersId = Number(headquartersId);
    if (typeId) where.typeId = Number(typeId);
    if (modelId) where.modelId = Number(modelId);
    if (status) where.status = status;
    
    // Filtros por relaciones
    if (categoryId) {
      // Activos que pertenecen a una categoría (directamente por categoryId)
      where.categoryId = Number(categoryId);
    }
    
    if (groupId) {
      // Activos que pertenecen a un grupo (directamente por groupId)
      where.groupId = Number(groupId);
    }
    
    if (manufacturerId) {
      // Activos que pertenecen a un fabricante (a través de model -> manufacturer)
      where.AssetModel = {
        manufacturerId: Number(manufacturerId)
      };
    }
    
    // Incluir relaciones para el frontend
    const include: any = {
      AssetModel: {
        include: {
          AssetManufacturer: true,
          AssetType: {
            include: {
              AssetGroup: {
                include: {
                  AssetCategory: true
                }
              }
            }
          }
        }
      },
      AssetCategory: true,
      AssetGroup: true,
      AssetType: true,
      companies_assets_companyIdTocompanies: {
        select: {
          id: true,
          name: true
        }
      },
      Headquarters: {
        select: {
          id: true,
          name: true
        }
      },
      users_assets_assignedUserIdTousers: {
        select: {
          documentNumber: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    };
    
    const items = await prisma.asset.findMany({ 
      where, 
      include,
      orderBy: { id: 'desc' } 
    });
    
    res.json(items);
  } catch (error: any) {
    console.error('Error listing assets:', error);
    res.status(500).json({ 
      error: error.message || 'Error al listar activos' 
    });
  }
};

/**
 * ✨ MEJORADO: Obtener asset con campos dinámicos
 */
export const getAsset = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.asset.findUnique({
      where: { id },
      include: {
        AssetCategory: true,
        AssetGroup: true,
        AssetType: true,
        AssetModel: {
          include: {
            AssetManufacturer: true
          }
        },
        companies_assets_companyIdTocompanies: {
          select: {
            id: true,
            name: true
          }
        },
        Headquarters: {
          select: {
            id: true,
            name: true
          }
        },
        users_assets_assignedUserIdTousers: {
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            companyId: true,
            headquartersId: true,
            processId: true,
            jobTitleId: true
          }
        },
        AssetFieldValue: {
          include: {
            CustomFieldDef: {
              include: {
                CustomFieldOption: true
              }
            }
          }
        }
      }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    res.json(item);
  } catch (error: any) {
    console.error('Error getting asset:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener activo'
    });
  }
};

/**
 * ✨ MEJORADO: Crear asset con soporte para campos dinámicos y auto-completado
 * Requiere autenticación y rol SUPER_ADMIN o ADMIN
 */
export const createAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      // Campos universales
      name,
      categoryId,
      groupId,
      typeId,
      modelId,
      companyId,
      headquartersId,
      assignedUserId,
      // Campos dinámicos (vienen en dynamicFields)
      dynamicFields,
      // formData JSON (opcional, para compatibilidad)
      formData,
      // Resto de campos
      ...restFields
    } = req.body;
    
    // Log para debugging
    console.log('📦 Backend recibió:', {
      name: name || 'FALTANTE',
      categoryId: categoryId || 'FALTANTE',
      groupId: groupId || 'FALTANTE',
      typeId: typeId || 'FALTANTE',
      modelId: modelId || 'opcional',
      companyId: companyId || 'opcional',
      headquartersId: headquartersId || 'opcional'
    });
    
    // 1. Validar campos obligatorios (solo los mínimos requeridos)
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!categoryId) missingFields.push('categoryId');
    if (!groupId) missingFields.push('groupId');
    if (!typeId) missingFields.push('typeId');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Campos obligatorios faltantes: ${missingFields.join(', ')}`
      });
    }
    
    // 2. Validar que los IDs de relaciones existan en la base de datos
    const validationErrors: string[] = [];
    
    // Validar categoryId
    const category = await prisma.assetCategory.findUnique({
      where: { id: Number(categoryId) },
      select: { id: true, name: true }
    });
    if (!category) {
      validationErrors.push(`La categoría con ID ${categoryId} no existe`);
    }
    
    // Validar groupId
    const group = await prisma.assetGroup.findUnique({
      where: { id: Number(groupId) },
      select: { id: true, name: true }
    });
    if (!group) {
      validationErrors.push(`El grupo con ID ${groupId} no existe`);
    }
    
    // Validar typeId
    const type = await prisma.assetType.findUnique({
      where: { id: Number(typeId) },
      select: { id: true, name: true }
    });
    if (!type) {
      validationErrors.push(`El tipo con ID ${typeId} no existe`);
    }
    
    // Validar modelId si se proporciona
    if (modelId) {
      const model = await prisma.assetModel.findUnique({
        where: { id: Number(modelId) },
        select: { id: true, name: true }
      });
      if (!model) {
        validationErrors.push(`El modelo con ID ${modelId} no existe`);
      }
    }
    
    // Validar companyId si se proporciona
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: Number(companyId) },
        select: { id: true, name: true }
      });
      if (!company) {
        validationErrors.push(`La empresa con ID ${companyId} no existe`);
      }
    }
    
    // Validar headquartersId si se proporciona
    if (headquartersId) {
      const headquarters = await prisma.headquarters.findUnique({
        where: { id: Number(headquartersId) },
        select: { id: true, name: true }
      });
      if (!headquarters) {
        validationErrors.push(`La sede con ID ${headquartersId} no existe`);
      }
    }
    
    if (validationErrors.length > 0) {
      console.error('❌ Errores de validación de relaciones:', validationErrors);
      return res.status(400).json({
        error: validationErrors.join('. ')
      });
    }
    
    console.log('✅ Validaciones de relaciones pasadas:', {
      category: category?.name,
      group: group?.name,
      type: type?.name,
      model: modelId ? 'proporcionado' : 'no proporcionado',
      company: companyId ? 'proporcionado' : 'no proporcionado',
      headquarters: headquartersId ? 'proporcionado' : 'no proporcionado'
    });
    
    // 3. Auto-completar desde usuario si se selecciona assignedUserId
    let finalCompanyId = companyId || null;
    let finalHeadquartersId = headquartersId || null;
    let finalProcessId = restFields.processId || null;
    let finalJobTitleId = restFields.jobTitleId || null;
    
    if (assignedUserId) {
      const user = await prisma.user.findUnique({
        where: { documentNumber: assignedUserId },
        select: {
          companyId: true,
          headquartersId: true,
          processId: true,
          jobTitleId: true
        }
      });
      
      if (user) {
        // Auto-completar solo si no están ya seleccionados
        if (!finalCompanyId && user.companyId) {
          finalCompanyId = user.companyId;
        }
        if (!finalHeadquartersId && user.headquartersId) {
          finalHeadquartersId = user.headquartersId;
        }
        if (!finalProcessId && user.processId) {
          finalProcessId = user.processId;
        }
        // jobTitleId siempre se auto-completa y bloquea si viene del usuario
        if (user.jobTitleId) {
          finalJobTitleId = user.jobTitleId;
        }
      }
    }
    
    // 4. Generar nombre único si hay duplicados (solo si hay companyId)
    let finalName = name;
    if (finalCompanyId) {
      const existingAssets = await prisma.asset.findMany({
        where: {
          companyId: finalCompanyId,
          name: {
            startsWith: name
          }
          // Nota: No filtramos por isDeleted para evitar conflictos incluso con nombres eliminados
        },
        select: { name: true }
      });
      
      // Si el nombre exacto existe, agregar (2), (3), etc.
      if (existingAssets.some(a => a.name === name)) {
        let counter = 2;
        let newName = `${name} (${counter})`;
        while (existingAssets.some(a => a.name === newName)) {
          counter++;
          newName = `${name} (${counter})`;
        }
        finalName = newName;
      }
    }
    
    // 5. Obtener createdById del usuario autenticado (requerido)
    if (!req.user || !req.user.documentNumber) {
      console.error('❌ Usuario no autenticado');
      return res.status(401).json({
        error: 'Debes estar autenticado para crear activos. Solo usuarios con rol SUPER_ADMIN o ADMIN pueden crear activos.'
      });
    }
    
    const finalCreatedById = req.user.documentNumber;
    
    // Verificar que el usuario autenticado tenga rol válido (debería estar validado por el middleware, pero verificamos por seguridad)
    const creatorUser = await prisma.user.findUnique({
      where: { documentNumber: finalCreatedById },
      select: { 
        documentNumber: true,
        role: true,
        status: true
      }
    });
    
    if (!creatorUser) {
      console.error(`❌ Usuario autenticado no existe en BD: ${finalCreatedById}`);
      return res.status(401).json({
        error: 'Tu usuario no existe en la base de datos. Por favor, contacta al administrador.'
      });
    }
    
    if (creatorUser.status !== 'ACTIVE') {
      console.error(`❌ Usuario inactivo: ${finalCreatedById}`);
      return res.status(403).json({
        error: 'Tu cuenta está inactiva. No puedes crear activos.'
      });
    }
    
    // Verificar rol (debería estar validado por middleware, pero verificamos por seguridad)
    if (creatorUser.role !== 'SUPER_ADMIN' && creatorUser.role !== 'ADMIN') {
      console.error(`❌ Usuario sin permisos: ${finalCreatedById} (rol: ${creatorUser.role})`);
      return res.status(403).json({
        error: 'Solo usuarios con rol SUPER_ADMIN o ADMIN pueden crear activos.'
      });
    }
    
    console.log(`✅ Usuario creador validado: ${finalCreatedById} (rol: ${creatorUser.role})`);
    
    // 6. Preparar datos del asset (campos opcionales solo si tienen valor)
    const assetData: any = {
      name: finalName,
      categoryId: Number(categoryId),
      groupId: Number(groupId),
      typeId: Number(typeId),
      createdById: finalCreatedById,
      updatedAt: new Date(),
      ...restFields
    };
    
    // Agregar campos opcionales solo si tienen valor
    if (modelId) assetData.modelId = Number(modelId);
    if (finalCompanyId) assetData.companyId = Number(finalCompanyId);
    if (finalHeadquartersId) assetData.headquartersId = Number(finalHeadquartersId);
    if (assignedUserId) assetData.assignedUserId = assignedUserId;
    if (finalProcessId) assetData.processId = finalProcessId;
    if (finalJobTitleId) assetData.jobTitleId = finalJobTitleId;
    
    // Log del assetData antes de crear
    console.log('📦 AssetData a crear:', {
      obligatorios: {
        name: assetData.name,
        categoryId: assetData.categoryId,
        groupId: assetData.groupId,
        typeId: assetData.typeId,
        createdById: assetData.createdById
      },
      opcionales: {
        modelId: assetData.modelId || 'NO INCLUIDO',
        companyId: assetData.companyId || 'NO INCLUIDO',
        headquartersId: assetData.headquartersId || 'NO INCLUIDO'
      },
      todosLosCampos: Object.keys(assetData)
    });
    
    // 7. Si viene formData, guardarlo en JSON
    if (formData) {
      assetData.formData = formData;
    }
    
    // 8. Crear el asset
    const asset = await prisma.asset.create({
      data: assetData,
      include: {
        AssetCategory: true,
        AssetGroup: true,
        AssetType: true,
        AssetModel: {
          include: {
            AssetManufacturer: true
          }
        },
        companies_assets_companyIdTocompanies: {
          select: {
            id: true,
            name: true
          }
        },
        Headquarters: {
          select: {
            id: true,
            name: true
          }
        },
        users_assets_assignedUserIdTousers: {
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // 7. Guardar campos dinámicos si vienen
    if (dynamicFields && typeof dynamicFields === 'object') {
      const fieldEntries = Object.entries(dynamicFields);
      
      for (const [fieldKey, fieldValue] of fieldEntries) {
        // Buscar el fieldId por key
        const fieldDef = await prisma.customFieldDef.findUnique({
          where: { key: fieldKey }
        });
        
        if (fieldDef) {
          // Determinar qué columna usar según el tipo
          const valueData: any = {
            assetId: asset.id,
            fieldId: fieldDef.id
          };
          
          switch (fieldDef.type) {
            case 'TEXT':
            case 'TEXTAREA':
            case 'EMAIL':
            case 'URL':
            case 'PHONE':
              valueData.valueText = String(fieldValue);
              break;
            case 'NUMBER':
            case 'CAPACITY':
              valueData.valueNumber = Number(fieldValue);
              break;
            case 'DECIMAL':
              valueData.valueDecimal = Number(fieldValue);
              break;
            case 'CHECKBOX':
              valueData.valueBoolean = Boolean(fieldValue);
              break;
            case 'DATE':
            case 'DATETIME':
              valueData.valueDate = fieldValue ? new Date(fieldValue as string) : null;
              break;
            case 'SELECT':
            case 'MULTISELECT':
              // Para selects, guardar el valor como texto o JSON
              if (Array.isArray(fieldValue)) {
                valueData.valueJson = fieldValue;
              } else {
                valueData.valueText = String(fieldValue);
              }
              break;
            default:
              // Por defecto, guardar como JSON
              valueData.valueJson = fieldValue;
          }
          
          // Upsert del valor
          await prisma.assetFieldValue.upsert({
            where: {
              assetId_fieldId: {
                assetId: asset.id,
                fieldId: fieldDef.id
              }
            } as any,
            update: valueData,
            create: valueData
          });
        }
      }
    }
    
    // 9. Retornar asset con campos dinámicos cargados
    const assetWithFields = await prisma.asset.findUnique({
      where: { id: asset.id },
      include: {
        AssetCategory: true,
        AssetGroup: true,
        AssetType: true,
        AssetModel: {
          include: {
            AssetManufacturer: true
          }
        },
        companies_assets_companyIdTocompanies: {
          select: {
            id: true,
            name: true
          }
        },
        Headquarters: {
          select: {
            id: true,
            name: true
          }
        },
        users_assets_assignedUserIdTousers: {
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        AssetFieldValue: {
          include: {
            CustomFieldDef: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: assetWithFields,
      message: finalName !== name 
        ? `Activo creado. El nombre fue ajustado a "${finalName}" para evitar duplicados.`
        : 'Activo creado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error creating asset:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo único';
      res.status(400).json({ 
        error: `Ya existe un activo con este valor en el campo "${field}"`,
        details: {
          field: field,
          constraint: error.meta?.target
        }
      });
    } else if (error.code === 'P2003') {
      // Error de foreign key - identificar qué campo falla
      const fieldName = error.meta?.field_name || 'campo relacionado';
      const target = error.meta?.target || 'tabla relacionada';
      console.error(`❌ Foreign key constraint failed: ${fieldName} -> ${target}`);
      res.status(400).json({ 
        error: `El campo relacionado "${fieldName}" no existe o es inválido. Verifica que el ID proporcionado exista en ${target}.`,
        details: {
          field: fieldName,
          target: target,
          meta: error.meta,
          suggestion: `Verifica que el ID del campo "${fieldName}" exista en la tabla "${target}"`
        }
      });
    } else {
      // Error genérico - mostrar más detalles en desarrollo
      const errorMessage = error.message || 'Error al crear activo';
      console.error(`❌ Error desconocido: ${errorMessage}`);
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          meta: error.meta,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 10).join('\n')
        } : undefined
      });
    }
  }
};

/**
 * ✨ MEJORADO: Actualizar asset con tracking completo de cambios
 * Requiere autenticación y rol SUPER_ADMIN o ADMIN
 */
export const updateAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // 1. Validar usuario autenticado
    if (!req.user || !req.user.documentNumber) {
      return res.status(401).json({
        error: 'Debes estar autenticado para editar activos. Solo usuarios con rol SUPER_ADMIN o ADMIN pueden editar activos.'
      });
    }
    
    const changedBy = req.user.documentNumber;
    
    // 2. Obtener IP y User-Agent
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // 3. Obtener activo actual para comparar cambios
    const currentAsset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true,
        assetCode: true,
        status: true,
        condition: true,
        categoryId: true,
        groupId: true,
        typeId: true,
        modelId: true,
        companyId: true,
        headquartersId: true,
        assignedUserId: true,
        processId: true,
        costCenter: true,
        location: true,
        purchaseValue: true,
        purchaseDate: true,
        warrantyExpiration: true,
        notes: true,
        commentary: true,
        invoiceNumber: true,
        supplierId: true,
        purchaseCompanyId: true,
        purchasedByCompanyId: true
      }
    });
    
    if (!currentAsset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // 4. Validar permisos del usuario
    const user = await prisma.user.findUnique({
      where: { documentNumber: changedBy },
      select: { documentNumber: true, role: true, status: true }
    });
    
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Tu cuenta está inactiva. No puedes editar activos.'
      });
    }
    
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Solo usuarios con rol SUPER_ADMIN o ADMIN pueden editar activos.'
      });
    }
    
    // 5. Preparar datos de actualización (excluir campos que no se deben actualizar directamente)
    const {
      id: _id,
      createdAt: _createdAt,
      createdById: _createdById,
      isDeleted: _isDeleted,
      deletedAt: _deletedAt,
      deletedBy: _deletedBy,
      deletionReason: _deletionReason,
      restoredAt: _restoredAt,
      restoredBy: _restoredBy,
      restorationReason: _restorationReason,
      changeReason,
      manufacturerId: _manufacturerId, // No es campo directo de Asset, se obtiene vía AssetModel
      jobTitleId: _jobTitleId, // No existe en Asset
      ...updateData
    } = req.body;
    
    // 6. Validar foreign keys si se proporcionan
    const validationErrors: string[] = [];
    
    if (updateData.categoryId !== undefined) {
      const category = await prisma.assetCategory.findUnique({
        where: { id: Number(updateData.categoryId) }
      });
      if (!category) validationErrors.push(`La categoría con ID ${updateData.categoryId} no existe`);
    }
    
    if (updateData.groupId !== undefined) {
      const group = await prisma.assetGroup.findUnique({
        where: { id: Number(updateData.groupId) }
      });
      if (!group) validationErrors.push(`El grupo con ID ${updateData.groupId} no existe`);
    }
    
    if (updateData.typeId !== undefined && updateData.typeId !== null) {
      const type = await prisma.assetType.findUnique({
        where: { id: Number(updateData.typeId) }
      });
      if (!type) validationErrors.push(`El tipo con ID ${updateData.typeId} no existe`);
    }
    
    if (updateData.modelId !== undefined && updateData.modelId !== null) {
      const model = await prisma.assetModel.findUnique({
        where: { id: Number(updateData.modelId) }
      });
      if (!model) validationErrors.push(`El modelo con ID ${updateData.modelId} no existe`);
    }
    
    if (updateData.companyId !== undefined && updateData.companyId !== null) {
      const company = await prisma.company.findUnique({
        where: { id: Number(updateData.companyId) }
      });
      if (!company) validationErrors.push(`La empresa con ID ${updateData.companyId} no existe`);
    }
    
    if (updateData.headquartersId !== undefined && updateData.headquartersId !== null) {
      const headquarters = await prisma.headquarters.findUnique({
        where: { id: Number(updateData.headquartersId) }
      });
      if (!headquarters) validationErrors.push(`La sede con ID ${updateData.headquartersId} no existe`);
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: validationErrors.join('. ')
      });
    }
    
    // 7. Agregar updatedById y updatedAt
    updateData.updatedById = changedBy;
    updateData.updatedAt = new Date();
    
    // 8. Actualizar el activo
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        AssetCategory: true,
        AssetGroup: true,
        AssetType: true,
        AssetModel: {
          include: {
            AssetManufacturer: true
          }
        },
        companies_assets_companyIdTocompanies: {
          select: {
            id: true,
            name: true
          }
        },
        Headquarters: {
          select: {
            id: true,
            name: true
          }
        },
        users_assets_assignedUserIdTousers: {
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // 9. Comparar valores y crear registros de historial
    const changeHistoryRecords: any[] = [];
    const fieldsToTrack = [
      'name', 'description', 'serialNumber', 'assetCode', 'status', 'condition',
      'categoryId', 'groupId', 'typeId', 'modelId', 'companyId', 'headquartersId',
      'assignedUserId', 'processId', 'jobTitleId', 'costCenter', 'location',
      'purchaseValue', 'purchaseDate', 'warrantyExpiration', 'notes', 'commentary',
      'invoiceNumber', 'supplierId', 'purchaseCompanyId', 'purchasedByCompanyId'
    ];
    
    for (const field of fieldsToTrack) {
      const oldValue = currentAsset[field as keyof typeof currentAsset];
      const newValue = updateData[field];
      
      // Solo registrar si el valor cambió
      if (newValue !== undefined && oldValue !== newValue) {
        // Convertir valores a string para almacenar
        const oldValueStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
        const newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : null;
        
        // Si ambos son null/undefined, no registrar
        if (oldValueStr === newValueStr) continue;
        
        changeHistoryRecords.push({
          assetId: id,
          fieldName: field,
          oldValue: oldValueStr,
          newValue: newValueStr,
          changedBy: changedBy,
          changedAt: new Date(),
          changeReason: changeReason || null,
          ipAddress: String(ipAddress).substring(0, 45), // Limitar a 45 caracteres
          userAgent: String(userAgent).substring(0, 500) // Limitar a 500 caracteres
        });
      }
    }
    
    // 10. Crear registros de historial en batch
    if (changeHistoryRecords.length > 0) {
      await prisma.assetChangeHistory.createMany({
        data: changeHistoryRecords
      });
      console.log(`✅ Registrados ${changeHistoryRecords.length} cambios en el historial del activo ${id}`);
    }
    
    res.json({
      success: true,
      data: updatedAsset,
      changesTracked: changeHistoryRecords.length
    });
    
  } catch (error: any) {
    console.error('❌ Error updating asset:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo único';
      res.status(400).json({ 
        error: `Ya existe un activo con este valor en el campo "${field}"`,
        details: {
          field: field,
          constraint: error.meta?.target
        }
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Activo no encontrado' });
    } else if (error.code === 'P2003') {
      const fieldName = error.meta?.field_name || 'campo relacionado';
      const target = error.meta?.target || 'tabla relacionada';
      res.status(400).json({ 
        error: `El campo relacionado "${fieldName}" no existe o es inválido. Verifica que el ID proporcionado exista en ${target}.`,
        details: {
          field: fieldName,
          target: target,
          meta: error.meta
        }
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar activo',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          meta: error.meta,
          message: error.message
        } : undefined
      });
    }
  }
};

/**
 * ✨ Obtener historial de cambios de un activo
 */
export const getAssetHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Verificar que el activo existe
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, name: true }
    });
    
    if (!asset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // Obtener historial con información del usuario
    const [history, total] = await Promise.all([
      prisma.assetChangeHistory.findMany({
        where: { assetId: id },
        include: {
          User: {
            select: {
              documentNumber: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { changedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.assetChangeHistory.count({
        where: { assetId: id }
      })
    ]);
    
    res.json({
      success: true,
      data: history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error getting asset history:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener historial del activo'
    });
  }
};

/**
 * ✨ Obtener conexiones de un activo
 */
export const getAssetConnections = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Verificar que el activo existe
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, name: true }
    });
    
    if (!asset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // Obtener componentes relacionados (conexiones)
    const connections = await prisma.assetComponent.findMany({
      where: {
        OR: [
          { parentAssetId: id },
          { childAssetId: id }
        ]
      },
      include: {
        assets_asset_components_parentAssetIdToassets: {
          select: {
            id: true,
            name: true,
            assetCode: true,
            AssetType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        assets_asset_components_childAssetIdToassets: {
          select: {
            id: true,
            name: true,
            assetCode: true,
            AssetType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Mapear las relaciones a nombres más amigables
    const mappedConnections = connections.map(conn => {
      const { assets_asset_components_parentAssetIdToassets, assets_asset_components_childAssetIdToassets, ...rest } = conn;
      return {
        ...rest,
        parentAsset: assets_asset_components_parentAssetIdToassets,
        childAsset: assets_asset_components_childAssetIdToassets
      };
    });
    
    res.json({
      success: true,
      data: mappedConnections
    });
  } catch (error: any) {
    console.error('Error getting asset connections:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener conexiones del activo'
    });
  }
};

/**
 * ✨ Obtener tickets relacionados con un activo
 * TODO: Implementar cuando el módulo de tickets esté disponible
 */
export const getAssetTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Verificar que el activo existe
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, name: true }
    });
    
    if (!asset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // TODO: Implementar cuando el módulo de tickets esté disponible
    // Por ahora retornar array vacío
    res.json({
      success: true,
      data: [],
      message: 'Módulo de tickets no implementado aún'
    });
  } catch (error: any) {
    console.error('Error getting asset tickets:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener tickets del activo'
    });
  }
};

/**
 * ✨ Obtener entradas de base de conocimiento relacionadas con un activo
 * TODO: Implementar cuando el módulo de base de conocimiento esté disponible
 */
export const getAssetKnowledgeBase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Verificar que el activo existe
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, name: true }
    });
    
    if (!asset) {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    
    // TODO: Implementar cuando el módulo de base de conocimiento esté disponible
    // Por ahora retornar array vacío
    res.json({
      success: true,
      data: [],
      message: 'Módulo de base de conocimiento no implementado aún'
    });
  } catch (error: any) {
    console.error('Error getting asset knowledge base:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener base de conocimiento del activo'
    });
  }
};

export const deleteAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.asset.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Activo no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar activo' 
      });
    }
  }
};




