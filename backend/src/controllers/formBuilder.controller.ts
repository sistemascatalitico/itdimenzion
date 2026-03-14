import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

// =========================
// FORMS CRUD
// =========================

/**
 * Listar formularios con filtros opcionales
 */
export const listForms = async (req: Request, res: Response) => {
  try {
    const { 
      companyId, 
      moduleType, 
      status, 
      isTemplate,
      assetTypeId,
      search,
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deletedAt: null, // Solo formularios no eliminados (soft delete)
    };

    if (companyId) {
      where.companyId = Number(companyId);
    }

    if (moduleType) {
      where.moduleType = moduleType;
    }

    if (status) {
      where.status = status;
    }

    if (isTemplate !== undefined) {
      where.isTemplate = isTemplate === 'true';
    }

    if (assetTypeId) {
      where.AssetType = {
        id: Number(assetTypeId)
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          Company: {
            select: { id: true, name: true }
          },
          AssetType: {
            select: { id: true, name: true, label: true }
          },
          FormField: {
            orderBy: { displayOrder: 'asc' }
          },
          _count: {
            select: {
              FormField: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.form.count({ where })
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error listing forms:', error);
    res.status(500).json({ 
      error: error.message || 'Error al listar formularios' 
    });
  }
};

/**
 * Obtener un formulario por ID
 */
export const getForm = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const form = await prisma.form.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        Company: {
          select: { id: true, name: true }
        },
        AssetType: {
          select: { 
            id: true, 
            name: true, 
            label: true,
            AssetGroup: {
              select: { id: true, name: true, label: true }
            },
            AssetCategory: {
              select: { id: true, name: true, label: true }
            }
          }
        },
        FormField: {
          orderBy: { displayOrder: 'asc' }
        },
        Form: {
          select: { id: true, name: true, version: true }
        },
        _count: {
          select: {
            FormField: true
          }
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    res.json({
      success: true,
      data: form
    });
  } catch (error: any) {
    console.error('Error getting form:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener formulario' 
    });
  }
};

/**
 * Obtener formulario por AssetType
 */
export const getFormByAssetType = async (req: Request, res: Response) => {
  try {
    const assetTypeId = Number(req.params.assetTypeId);

    const assetType = await prisma.assetType.findUnique({
      where: { id: assetTypeId },
      include: {
        Form: {
          include: {
            FormField: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!assetType) {
      return res.status(404).json({ error: 'Tipo de activo no encontrado' });
    }

    if (!assetType.Form) {
      return res.status(404).json({ 
        error: 'Este tipo de activo no tiene un formulario asignado' 
      });
    }

    res.json({
      success: true,
      data: assetType.Form
    });
  } catch (error: any) {
    console.error('Error getting form by asset type:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener formulario por tipo de activo' 
    });
  }
};

/**
 * Crear un nuevo formulario
 */
export const createForm = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      moduleType,
      companyId,
      assetTypeId,
      assetCategoryId,
      assetGroupId,
      isTemplate = false,
      status = 'draft',
      clonedFromId,
      stepsConfig,
      stylesConfig,
      submissionConfig,
      securityConfig,
      createdBy
    } = req.body;

    // Validaciones
    if (!name || !moduleType || !companyId) {
      return res.status(400).json({ 
        error: 'Nombre, tipo de módulo y empresa son requeridos' 
      });
    }

    // Normalizar valores del enum a minúsculas
    const normalizedModuleType = moduleType?.toString().toLowerCase() as any;
    const normalizedStatus = status?.toString().toLowerCase() as any;

    // Si es para Asset Management, validar assetTypeId
    if (normalizedModuleType === 'assets' && assetTypeId) {
      const assetType = await prisma.assetType.findUnique({
        where: { id: Number(assetTypeId) }
      });

      if (!assetType) {
        return res.status(400).json({ 
          error: 'El tipo de activo especificado no existe' 
        });
      }

      // Verificar que el AssetType no tenga ya un formulario asignado
      if (assetType.formTemplateId) {
        return res.status(400).json({ 
          error: 'Este tipo de activo ya tiene un formulario asignado. Use clonar para crear una variante.' 
        });
      }
    }

    // Preparar datos
    const formData: any = {
      name,
      description: description || null,
      moduleType: normalizedModuleType,
      companyId: Number(companyId),
      isTemplate: Boolean(isTemplate),
      status: normalizedStatus || 'draft',
      createdBy: createdBy || (req as AuthenticatedRequest).user?.documentNumber || 'system',
      version: 1,
      clonedFrom: clonedFromId ? Number(clonedFromId) : null,
      stepsConfig: stepsConfig || null,
      stylesConfig: stylesConfig || null,
      submissionConfig: submissionConfig || null,
      securityConfig: securityConfig || null,
    };

    // Si es para Asset Management y tiene assetTypeId, crear la relación
    if (normalizedModuleType === 'assets' && assetTypeId) {
      // Crear el formulario primero
      const form = await prisma.form.create({
        data: formData,
        include: {
          Company: {
            select: { id: true, name: true }
          },
        }
      });

      // Luego actualizar el AssetType para asignar el formulario
      await prisma.assetType.update({
        where: { id: Number(assetTypeId) },
        data: { formTemplateId: form.id }
      });

      // Recargar el formulario con la relación
      const updatedForm = await prisma.form.findUnique({
        where: { id: form.id },
        include: {
          Company: {
            select: { id: true, name: true }
          },
          AssetType: {
            select: { id: true, name: true, label: true }
          }
        }
      });

      return res.status(201).json({
        success: true,
        data: updatedForm
      });
    }

    // Crear formulario normal (sin AssetType)
    const form = await prisma.form.create({
      data: formData,
      include: {
        Company: {
          select: { id: true, name: true }
        },
      }
    });

    res.status(201).json({
      success: true,
      data: form
    });
  } catch (error: any) {
    console.error('Error creating form:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un formulario con este nombre' 
      });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'La empresa o tipo de activo especificado no existe' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear formulario' 
      });
    }
  }
};

/**
 * Actualizar un formulario
 */
export const updateForm = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      description,
      status,
      isTemplate,
      stepsConfig,
      stylesConfig,
      submissionConfig,
      securityConfig,
      assetTypeId
    } = req.body;

    // Verificar que el formulario existe y no está eliminado
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!existingForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status.toString().toLowerCase() as any;
    if (isTemplate !== undefined) updateData.isTemplate = Boolean(isTemplate);
    if (stepsConfig !== undefined) updateData.stepsConfig = stepsConfig;
    if (stylesConfig !== undefined) updateData.stylesConfig = stylesConfig;
    if (submissionConfig !== undefined) updateData.submissionConfig = submissionConfig;
    if (securityConfig !== undefined) updateData.securityConfig = securityConfig;

    // Si se está cambiando el AssetType asociado
    if (assetTypeId !== undefined) {
      if (assetTypeId === null) {
        // Desasociar el formulario del AssetType
        await prisma.assetType.updateMany({
          where: { formTemplateId: id },
          data: { formTemplateId: null }
        });
      } else {
        // Verificar que el AssetType existe
        const assetType = await prisma.assetType.findUnique({
          where: { id: Number(assetTypeId) }
        });

        if (!assetType) {
          return res.status(400).json({ 
            error: 'El tipo de activo especificado no existe' 
          });
        }

        // Verificar que el AssetType no tenga ya otro formulario asignado
        if (assetType.formTemplateId && assetType.formTemplateId !== id) {
          return res.status(400).json({ 
            error: 'Este tipo de activo ya tiene otro formulario asignado' 
          });
        }

        // Desasociar el formulario anterior del AssetType
        await prisma.assetType.updateMany({
          where: { formTemplateId: id },
          data: { formTemplateId: null }
        });

        // Asociar el nuevo AssetType
        await prisma.assetType.update({
          where: { id: Number(assetTypeId) },
          data: { formTemplateId: id }
        });
      }
    }

    // Actualizar el formulario
    const form = await prisma.form.update({
      where: { id },
      data: updateData,
      include: {
        Company: {
          select: { id: true, name: true }
        },
        AssetType: {
            select: { id: true, name: true, label: true }
          },
        FormField: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: form
    });
  } catch (error: any) {
    console.error('Error updating form:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un formulario con este nombre' 
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Formulario no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar formulario' 
      });
    }
  }
};

/**
 * Eliminar un formulario (soft delete)
 */
export const deleteForm = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deletedBy = req.body.deletedBy || (req as AuthenticatedRequest).user?.documentNumber || 'system';

    // Verificar que el formulario existe y no está eliminado
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        AssetType: true,
        _count: {
          select: {
          }
        }
      }
    });

    if (!existingForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Si tiene envíos, solo hacer soft delete
    // Si no tiene envíos, desasociar del AssetType si está asociado
    if (existingForm.AssetType) {
      await prisma.assetType.updateMany({
        where: { formTemplateId: id },
        data: { formTemplateId: null }
      });
    }

    // Soft delete del formulario
    const form = await prisma.form.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy
      }
    });

    // Eliminar todos los campos del formulario (CASCADE)
    await prisma.formField.deleteMany({
      where: { formId: id }
    });

    res.json({
      success: true,
      message: 'Formulario eliminado correctamente',
      data: form
    });
  } catch (error: any) {
    console.error('Error deleting form:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Formulario no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar formulario' 
      });
    }
  }
};

/**
 * Clonar un formulario
 */
export const cloneForm = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      description,
      assetTypeId,
      companyId,
      createdBy
    } = req.body;

    // Obtener el formulario original
    const originalForm = await prisma.form.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        FormField: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!originalForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Crear el nuevo formulario clonado
    const clonedForm = await prisma.form.create({
      data: {
        name: name || `${originalForm.name} (Copia)`,
        description: description || originalForm.description,
        moduleType: originalForm.moduleType,
        companyId: companyId ? Number(companyId) : originalForm.companyId,
        isTemplate: originalForm.isTemplate,
        status: 'draft', // Siempre empezar como borrador
        version: 1,
        clonedFrom: id,
        createdBy: createdBy || (req as AuthenticatedRequest).user?.documentNumber || 'system',
        stepsConfig: originalForm.stepsConfig as any,
        stylesConfig: originalForm.stylesConfig as any,
        submissionConfig: originalForm.submissionConfig as any,
        securityConfig: originalForm.securityConfig as any,
        updatedAt: new Date(),
        // Clonar campos
        FormField: {
          create: originalForm.FormField.map(field => ({
            fieldKey: field.fieldKey,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            isReadonly: field.isReadonly,
            isHidden: field.isHidden,
            defaultValue: field.defaultValue,
            placeholder: field.placeholder,
            helpText: field.helpText,
            options: field.options === null ? Prisma.JsonNull : (field.options as any),
            validationRules: field.validationRules === null ? Prisma.JsonNull : (field.validationRules as any),
            autoFill: field.autoFill,
            autoFillSource: field.autoFillSource,
            autoFillMode: field.autoFillMode,
            hasAutoNumbering: field.hasAutoNumbering,
            numberingConfig: field.numberingConfig === null ? Prisma.JsonNull : (field.numberingConfig as any),
            section: field.section,
            displayOrder: field.displayOrder,
            columnPosition: field.columnPosition,
            conditionalLogic: field.conditionalLogic === null ? Prisma.JsonNull : (field.conditionalLogic as any),
            updatedAt: new Date(),
          }))
        }
      },
      include: {
        Company: {
          select: { id: true, name: true }
        },
        FormField: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    // Si se especificó un assetTypeId, asociarlo
    if (assetTypeId) {
      const assetType = await prisma.assetType.findUnique({
        where: { id: Number(assetTypeId) }
      });

      if (!assetType) {
        return res.status(400).json({ 
          error: 'El tipo de activo especificado no existe' 
        });
      }

      if (assetType.formTemplateId) {
        return res.status(400).json({ 
          error: 'Este tipo de activo ya tiene un formulario asignado' 
        });
      }

      await prisma.assetType.update({
        where: { id: Number(assetTypeId) },
        data: { formTemplateId: clonedForm.id }
      });

      // Recargar con la relación
      const updatedForm = await prisma.form.findUnique({
        where: { id: clonedForm.id },
        include: {
          Company: {
            select: { id: true, name: true }
          },
          AssetType: {
            select: { id: true, name: true, label: true }
          },
          FormField: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      return res.status(201).json({
        success: true,
        data: updatedForm
      });
    }

    res.status(201).json({
      success: true,
      data: clonedForm
    });
  } catch (error: any) {
    console.error('Error cloning form:', error);
    res.status(500).json({ 
      error: error.message || 'Error al clonar formulario' 
    });
  }
};

// =========================
// FORM FIELDS CRUD
// =========================

/**
 * Listar campos de un formulario
 */
export const listFormFields = async (req: Request, res: Response) => {
  try {
    const formId = Number(req.params.formId);

    const fields = await prisma.formField.findMany({
      where: {
        formId
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      data: fields
    });
  } catch (error: any) {
    console.error('Error listing form fields:', error);
    res.status(500).json({ 
      error: error.message || 'Error al listar campos del formulario' 
    });
  }
};

/**
 * Obtener un campo por ID
 */
export const getFormField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const field = await prisma.formField.findFirst({
      where: {
        id
      },
      include: {
        Form: {
          select: { id: true, name: true, moduleType: true }
        },
        FieldNumberingSequence: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    res.json({
      success: true,
      data: field
    });
  } catch (error: any) {
    console.error('Error getting form field:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener campo' 
    });
  }
};

/**
 * Crear un nuevo campo
 */
export const createFormField = async (req: Request, res: Response) => {
  try {
    const formId = Number(req.params.formId);
    const {
      fieldKey,
      fieldLabel,
      fieldType,
      isRequired = false,
      isReadonly = false,
      isHidden = false,
      defaultValue,
      placeholder,
      helpText,
      options,
      validationRules,
      autoFill,
      autoFillSource,
      autoFillMode,
      hasAutoNumbering = false,
      numberingConfig,
      section,
      displayOrder,
      columnPosition,
      conditionalLogic,
      createdBy
    } = req.body;

    // Validaciones
    if (!fieldKey || !fieldLabel || !fieldType) {
      return res.status(400).json({ 
        error: 'Clave, etiqueta y tipo de campo son requeridos' 
      });
    }

    // Verificar que el formulario existe
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        deletedAt: null
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Verificar que no exista otro campo con la misma clave en el formulario
    const existingField = await prisma.formField.findFirst({
      where: {
        formId,
        fieldKey
      }
    });

    if (existingField) {
      return res.status(400).json({ 
        error: 'Ya existe un campo con esta clave en el formulario' 
      });
    }

    // Si no se especifica displayOrder, usar el siguiente disponible
    let finalDisplayOrder = displayOrder;
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const lastField = await prisma.formField.findFirst({
        where: { formId },
        orderBy: { displayOrder: 'desc' }
      });
      finalDisplayOrder = lastField ? lastField.displayOrder + 1 : 1;
    }

    // Preparar datos
    const fieldData: any = {
      formId,
      fieldKey,
      fieldLabel,
      fieldType,
      isRequired: Boolean(isRequired),
      isReadonly: Boolean(isReadonly),
      isHidden: Boolean(isHidden),
      defaultValue: defaultValue || null,
      placeholder: placeholder || null,
      helpText: helpText || null,
      options: options || null,
      validationRules: validationRules || null,
      autoFill: autoFill || null,
      autoFillSource: autoFillSource || null,
      autoFillMode: autoFillMode || null,
      hasAutoNumbering: Boolean(hasAutoNumbering),
      numberingConfig: numberingConfig || null,
      section: section || 'general',
      displayOrder: finalDisplayOrder,
      columnPosition: columnPosition || 'full',
      conditionalLogic: conditionalLogic || null,
    };

    // Crear el campo
    const field = await prisma.formField.create({
      data: fieldData,
      include: {
        Form: {
          select: { id: true, name: true }
        }
      }
    });

    // Si tiene numeración automática, crear la secuencia inicial
    if (hasAutoNumbering && numberingConfig) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      await prisma.fieldNumberingSequence.create({
        data: {
          fieldId: field.id,
          companyId: form.companyId,
          currentYear,
          currentMonth,
          currentNumber: 0,
          updatedAt: new Date()
        }
      });
    }

    res.status(201).json({
      success: true,
      data: field
    });
  } catch (error: any) {
    console.error('Error creating form field:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un campo con esta clave en el formulario' 
      });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'El formulario especificado no existe' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear campo' 
      });
    }
  }
};

/**
 * Actualizar un campo
 */
export const updateFormField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      fieldLabel,
      fieldType,
      isRequired,
      isReadonly,
      isHidden,
      defaultValue,
      placeholder,
      helpText,
      options,
      validationRules,
      autoFill,
      autoFillSource,
      autoFillMode,
      hasAutoNumbering,
      numberingConfig,
      section,
      displayOrder,
      columnPosition,
      conditionalLogic
    } = req.body;

    // Verificar que el campo existe
    const existingField = await prisma.formField.findFirst({
      where: {
        id
      },
      include: {
        Form: true
      }
    });

    if (!existingField) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (fieldLabel !== undefined) updateData.fieldLabel = fieldLabel;
    if (fieldType !== undefined) updateData.fieldType = fieldType;
    if (isRequired !== undefined) updateData.isRequired = Boolean(isRequired);
    if (isReadonly !== undefined) updateData.isReadonly = Boolean(isReadonly);
    if (isHidden !== undefined) updateData.isHidden = Boolean(isHidden);
    if (defaultValue !== undefined) updateData.defaultValue = defaultValue;
    if (placeholder !== undefined) updateData.placeholder = placeholder;
    if (helpText !== undefined) updateData.helpText = helpText;
    if (options !== undefined) updateData.options = options;
    if (validationRules !== undefined) updateData.validationRules = validationRules;
    if (autoFill !== undefined) updateData.autoFill = autoFill;
    if (autoFillSource !== undefined) updateData.autoFillSource = autoFillSource;
    if (autoFillMode !== undefined) updateData.autoFillMode = autoFillMode;
    if (hasAutoNumbering !== undefined) updateData.hasAutoNumbering = Boolean(hasAutoNumbering);
    if (numberingConfig !== undefined) updateData.numberingConfig = numberingConfig;
    if (section !== undefined) updateData.section = section;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (columnPosition !== undefined) updateData.columnPosition = columnPosition;
    if (conditionalLogic !== undefined) updateData.conditionalLogic = conditionalLogic;

    // Actualizar el campo
    const field = await prisma.formField.update({
      where: { id },
      data: updateData,
      include: {
        Form: {
          select: { id: true, name: true }
        },
        FieldNumberingSequence: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Si se activó la numeración automática y no existe secuencia, crearla
    if (hasAutoNumbering && numberingConfig && (!field.FieldNumberingSequence || field.FieldNumberingSequence.length === 0)) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      await prisma.fieldNumberingSequence.create({
        data: {
          fieldId: field.id,
          companyId: existingField.Form.companyId,
          currentYear,
          currentMonth,
          currentNumber: 0,
          updatedAt: new Date()
        }
      });
    }

    // Recargar el campo con la secuencia actualizada
    const updatedField = await prisma.formField.findUnique({
      where: { id },
      include: {
        Form: {
          select: { id: true, name: true }
        },
        FieldNumberingSequence: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: updatedField
    });
  } catch (error: any) {
    console.error('Error updating form field:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Campo no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar campo' 
      });
    }
  }
};

/**
 * Eliminar un campo (soft delete)
 */
export const deleteFormField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deletedBy = req.body.deletedBy || (req as AuthenticatedRequest).user?.documentNumber || 'system';

    // Verificar que el campo existe
    const existingField = await prisma.formField.findFirst({
      where: {
        id
      }
    });

    if (!existingField) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    // Eliminar el campo (CASCADE eliminará las secuencias de numeración)
    const field = await prisma.formField.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Campo eliminado correctamente',
      data: field
    });
  } catch (error: any) {
    console.error('Error deleting form field:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Campo no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar campo' 
      });
    }
  }
};

/**
 * Reordenar campos de un formulario
 */
export const reorderFormFields = async (req: Request, res: Response) => {
  try {
    const formId = Number(req.params.formId);
    const { fieldOrders } = req.body; // Array de { id, displayOrder }

    if (!Array.isArray(fieldOrders)) {
      return res.status(400).json({ 
        error: 'fieldOrders debe ser un array' 
      });
    }

    // Actualizar cada campo
    const updates = fieldOrders.map(({ id, displayOrder }: any) =>
      prisma.formField.update({
        where: { id: Number(id) },
        data: { displayOrder: Number(displayOrder) }
      })
    );

    await Promise.all(updates);

    // Recargar campos ordenados
    const fields = await prisma.formField.findMany({
      where: {
        formId
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      data: fields
    });
  } catch (error: any) {
    console.error('Error reordering form fields:', error);
    res.status(500).json({ 
      error: error.message || 'Error al reordenar campos' 
    });
  }
};

// =========================
// FIELD NUMBERING
// =========================

interface NumberingConfig {
  prefix: string;
  suffix: string;
  startNumber: number;
  minLength: number;
  resetFrequency: 'never' | 'yearly' | 'monthly';
  scope: 'global' | 'by_company' | 'by_asset_type';
}

interface GenerateNumberRequest {
  companyId?: number;
  assetTypeId?: number;
}

/**
 * Generar siguiente número incremental para un campo
 */
export const generateFieldNumber = async (req: Request, res: Response) => {
  try {
    const { formId, fieldId } = req.params;
    const { companyId, assetTypeId } = req.body as GenerateNumberRequest;

    // 1. Obtener el campo y su configuración
    const field = await prisma.formField.findUnique({
      where: { id: parseInt(fieldId) },
      include: { Form: true }
    });

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    if (!field.hasAutoNumbering || !field.numberingConfig) {
      return res.status(400).json({ 
        error: 'Este campo no tiene numeración automática habilitada' 
      });
    }

    const config = field.numberingConfig as unknown as NumberingConfig;

    // 2. Validar parámetros según el scope
    let scopeCompanyId: number | null = null;

    if (config.scope === 'by_company') {
      if (!companyId) {
        return res.status(400).json({ 
          error: 'companyId es requerido para scope by_company' 
        });
      }
      scopeCompanyId = companyId;
    } else if (config.scope === 'by_asset_type') {
      if (!assetTypeId) {
        return res.status(400).json({ 
          error: 'assetTypeId es requerido para scope by_asset_type' 
        });
      }
      // Verificar que el asset type existe
      const assetType = await prisma.assetType.findUnique({
        where: { id: assetTypeId }
      });
      
      if (!assetType) {
        return res.status(404).json({ error: 'Tipo de activo no encontrado' });
      }
      
      // Para scope by_asset_type, usamos el assetTypeId como identificador único
      // En lugar de companyId, creamos una secuencia independiente por tipo de activo
      // Nota: En la práctica, esto significa que cada tipo de activo tendrá su propia secuencia
      scopeCompanyId = assetTypeId; // Usar assetTypeId como scope único
    }

    // 3. Determinar año y mes actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = config.resetFrequency === 'monthly' ? now.getMonth() + 1 : null;

    // 4. Obtener o crear la secuencia (con transacción para evitar race conditions)
    let nextNumber: number;
    let sequence: any;

    await prisma.$transaction(async (tx) => {
      // Buscar secuencia existente
      sequence = await tx.fieldNumberingSequence.findFirst({
        where: {
          fieldId: field.id,
          companyId: scopeCompanyId,
          currentYear: currentYear,
          currentMonth: currentMonth
        }
      });

      if (!sequence) {
        // Crear nueva secuencia con el número inicial
        nextNumber = config.startNumber;
        sequence = await tx.fieldNumberingSequence.create({
          data: {
            fieldId: field.id,
            companyId: scopeCompanyId,
            currentYear: currentYear,
            currentMonth: currentMonth,
            currentNumber: nextNumber,
          updatedAt: new Date()
          }
        });
      } else {
        // Incrementar la secuencia existente
        nextNumber = sequence.currentNumber + 1;
        sequence = await tx.fieldNumberingSequence.update({
          where: { id: sequence.id },
          data: { currentNumber: nextNumber }
        });
      }
    });

    // 5. Formatear el número con padding
    const paddedNumber = nextNumber!.toString().padStart(config.minLength, '0');

    // 6. Construir el código final
    const generatedNumber = `${config.prefix}${paddedNumber}${config.suffix}`;

    // 7. Responder
    return res.json({
      success: true,
      data: {
        generatedNumber,
        sequenceId: sequence!.id,
        nextNumber: nextNumber!,
        config: {
          prefix: config.prefix,
          suffix: config.suffix,
          paddedNumber,
          year: currentYear,
          month: currentMonth
        }
      }
    });

  } catch (error) {
    console.error('Error generando número de campo:', error);
    return res.status(500).json({ 
      error: 'Error al generar número de campo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

