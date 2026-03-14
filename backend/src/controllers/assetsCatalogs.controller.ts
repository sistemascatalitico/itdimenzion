import { prisma } from '../config/database';
import { Request, Response } from 'express';

export const listManufacturers = async (req: Request, res: Response) => {
  try {
    const { q, category, populate } = req.query as any;
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: String(q) } },
        { description: { contains: String(q) } },
      ];
    }
    if (category) {
      where.ManufacturerCategory = {
        some: {
          categoryId: Number(category)
        }
      };
    }
    
    const include: any = {};
    if (populate?.includes('categories')) {
      include.ManufacturerCategory = {
        include: {
          AssetCategory: true
        }
      };
    }
    
    const items: any = await prisma.assetManufacturer.findMany({ 
      where, 
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { name: 'asc' } 
    });
    
    if (populate?.includes('categories')) {
      const transformed = items.map((item: any) => ({
        ...item,
        categories: item.ManufacturerCategory?.map((mc: any) => mc.AssetCategory) || []
      }));
      res.json(transformed);
    } else {
      res.json(items);
    }
  } catch (error) {
    console.error('Error in listManufacturers:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const createManufacturer = async (req: Request, res: Response) => {
  try {
    const { categoryIds, ...manufacturerData } = req.body;
    
    const item: any = await prisma.assetManufacturer.create({
      data: {
        ...manufacturerData,
        ManufacturerCategory: categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0
          ? {
              create: categoryIds.map((categoryId: number) => ({
                categoryId: Number(categoryId)
              }))
            }
          : undefined
      },
      include: {
        ManufacturerCategory: {
          include: {
            AssetCategory: true
          }
        }
      }
    });
    
    // Transformar para que sea más fácil en el frontend
    const transformed = {
      ...item,
      categories: item.ManufacturerCategory?.map((mc: any) => mc.AssetCategory) || [],
      categoryIds: item.ManufacturerCategory?.map((mc: any) => mc.categoryId) || []
    };
    
    res.status(201).json(transformed);
  } catch (error: any) {
    console.error('Error creating manufacturer:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un fabricante con este nombre' 
      });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'Una o más categorías seleccionadas no existen' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear fabricante' 
      });
    }
  }
};

export const updateManufacturer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { categoryIds, ...manufacturerData } = req.body;
    
    // Primero actualizar las categorías si se proporcionaron
    if (categoryIds !== undefined) {
      // Eliminar todas las categorías existentes
      await prisma.manufacturerCategory.deleteMany({
        where: { manufacturerId: id }
      });
      
      // Crear las nuevas categorías si hay
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await prisma.manufacturerCategory.createMany({
          data: categoryIds.map((categoryId: number) => ({
            manufacturerId: id,
            categoryId: Number(categoryId)
          }))
        });
      }
    }
    
    // Actualizar el manufacturer
    const item: any = await prisma.assetManufacturer.update({ 
      where: { id }, 
      data: manufacturerData,
      include: {
        ManufacturerCategory: {
          include: {
            AssetCategory: true
          }
        }
      }
    });
    
    // Transformar para que sea más fácil en el frontend
    const transformed = {
      ...item,
      categories: item.ManufacturerCategory?.map((mc: any) => mc.AssetCategory) || [],
      categoryIds: item.ManufacturerCategory?.map((mc: any) => mc.categoryId) || []
    };
    
    res.json(transformed);
  } catch (error: any) {
    console.error('Error updating manufacturer:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un fabricante con este nombre' 
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Fabricante no encontrado' });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'Una o más categorías seleccionadas no existen' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar fabricante' 
      });
    }
  }
};

export const deleteManufacturer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.assetManufacturer.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting manufacturer:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Fabricante no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar fabricante' 
      });
    }
  }
};

export const listCategories = async (_: Request, res: Response) => {
  try {
    const items = await prisma.assetCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(items);
  } catch (error) {
    console.error('Error in listCategories:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, label, description, status, isPersistent } = req.body;
    const item = await prisma.assetCategory.create({ data: { name, label: label || name, description, status, isPersistent, updatedAt: new Date() } });
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe una categoría con este nombre o etiqueta' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear categoría' 
      });
    }
  }
};
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, label, description, status, isPersistent } = req.body;
    const item = await prisma.assetCategory.update({ where: { id }, data: { name, label, description, status, isPersistent, updatedAt: new Date() } });
    res.json(item);
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe una categoría con este nombre o etiqueta' 
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Categoría no encontrada' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar categoría' 
      });
    }
  }
};
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.assetCategory.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Categoría no encontrada' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar categoría' 
      });
    }
  }
};

export const listGroups = async (req: Request, res: Response) => {
  try {
    const { populate, categoryId } = req.query;
    
    const where: any = {};
    if (categoryId) {
      where.categoryId = Number(categoryId);
    }
    
    const include: any = {};
    if (populate) {
      const relations = String(populate).split(',');
      if (relations.includes('category')) include.AssetCategory = true;
    }
    
    const items = await prisma.assetGroup.findMany({ 
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { name: 'asc' } 
    });
    res.json(items);
  } catch (error) {
    console.error('Error in listGroups:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const getGroupsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    const groups = await prisma.assetGroup.findMany({
      where: { categoryId: Number(categoryId) },
      include: {
        AssetCategory: true,
        AssetType: {
          select: {
            id: true,
            name: true,
            label: true
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { AssetType: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Agregar conteo de activos por grupo y obtener nombres de activos
    const groupsWithAssetCount = await Promise.all(
      groups.map(async (group: any) => {
        const assets = await prisma.asset.findMany({
          where: {
            groupId: group.id
          },
          select: {
            id: true,
            name: true,
            assetCode: true
          },
          take: 5, // Solo los primeros 5 para mostrar
          orderBy: { name: 'asc' }
        });
        
        const assetCount = await prisma.asset.count({
          where: {
            groupId: group.id
          }
        });
        
        return {
          ...group,
          assetCount,
          assets: assets.map((a: any) => ({
            id: a.id,
            name: a.name || a.assetCode || `Activo ${a.id}`
          }))
        };
      })
    );
    
    res.json(groupsWithAssetCount);
  } catch (error: any) {
    console.error('Error getting groups by category:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener grupos por categoría' 
    });
  }
};
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, label, categoryId, status } = req.body;
    const item = await prisma.assetGroup.create({ data: { name, description, label, categoryId, status, updatedAt: new Date() } });
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating group:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un grupo con este nombre' 
      });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'La categoría seleccionada no existe' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear grupo' 
      });
    }
  }
};
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description, label, categoryId, status } = req.body;
    const item = await prisma.assetGroup.update({ where: { id }, data: { name, description, label, categoryId, status, updatedAt: new Date() } });
    res.json(item);
  } catch (error: any) {
    console.error('Error updating group:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un grupo con este nombre' 
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Grupo no encontrado' });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'La categoría seleccionada no existe' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar grupo' 
      });
    }
  }
};
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.assetGroup.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting group:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Grupo no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar grupo' 
      });
    }
  }
};

export const listTypes = async (req: Request, res: Response) => {
  try {
    const { groupId, populate } = req.query;
    const where = groupId ? { groupId: Number(groupId) } : {} as any;
    
    const include: any = {};
    if (populate) {
      const relations = String(populate).split(',');
      if (relations.includes('group')) {
        include.AssetGroup = {
          include: {
            AssetCategory: true
          }
        };
      }
      if (relations.includes('category')) include.AssetCategory = true;
    }
    
    const items = await prisma.assetType.findMany({ 
      where, 
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { name: 'asc' } 
    });
    res.json(items);
  } catch (error) {
    console.error('Error in listTypes:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
export const createType = async (req: Request, res: Response) => {
  try {
    const { groupId, categoryId, code, ...rest } = req.body; // Excluir 'code' si viene (por compatibilidad)
    
    // Auto-completar categoryId desde group si no viene
    let finalCategoryId = categoryId ? Number(categoryId) : null;
    if (!finalCategoryId && groupId) {
      const group = await prisma.assetGroup.findUnique({ where: { id: Number(groupId) }, select: { categoryId: true } });
      if (group) finalCategoryId = group.categoryId;
    }
    
    // Preparar datos para creación
    const createData: any = {
      name: rest.name,
      label: rest.label || null,
      description: rest.description || null,
      status: rest.status || 'ACTIVE',
      groupId: Number(groupId),
      categoryId: finalCategoryId !== null && finalCategoryId !== undefined ? Number(finalCategoryId) : undefined
    };
    
    // Si viene 'code' y no viene 'description', usar 'code' como 'description' (migración)
    if (code && !rest.description) {
      createData.description = code;
    }
    
    const item = await prisma.assetType.create({ 
      data: createData,
      include: {
        AssetGroup: {
          include: {
            AssetCategory: true
          }
        },
        AssetCategory: true
      }
    });
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating asset type:', error);
    if (error.code === 'P2002') {
      // Violación de constraint único
      res.status(400).json({ 
        error: 'Ya existe un tipo con este nombre en el grupo seleccionado' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear tipo de activo' 
      });
    }
  }
};
export const updateType = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { groupId, categoryId, code, ...rest } = req.body; // Excluir 'code' si viene (por compatibilidad)
    
    // Auto-completar categoryId desde group si cambia groupId
    let finalCategoryId = categoryId ? Number(categoryId) : null;
    if (!finalCategoryId && groupId) {
      const group = await prisma.assetGroup.findUnique({ where: { id: Number(groupId) }, select: { categoryId: true } });
      if (group) finalCategoryId = group.categoryId;
    }
    
    // Preparar datos de actualización
    const updateData: any = {};
    
    // Solo incluir campos permitidos
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.label !== undefined) updateData.label = rest.label || null;
    if (rest.description !== undefined) updateData.description = rest.description || null;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (groupId) updateData.groupId = Number(groupId);
    if (finalCategoryId !== null && finalCategoryId !== undefined) {
      updateData.categoryId = Number(finalCategoryId);
    }
    
    // Si viene 'code' y no viene 'description', usar 'code' como 'description' (migración)
    if (code && !rest.description) {
      updateData.description = code;
    }
    
    const item = await prisma.assetType.update({ 
      where: { id }, 
      data: updateData,
      include: {
        AssetGroup: {
          include: {
            AssetCategory: true
          }
        },
        AssetCategory: true
      }
    });
    res.json(item);
  } catch (error: any) {
    console.error('Error updating asset type:', error);
    if (error.code === 'P2002') {
      // Violación de constraint único
      res.status(400).json({ 
        error: 'Ya existe un tipo con este nombre en el grupo seleccionado' 
      });
    } else if (error.code === 'P2025') {
      // Registro no encontrado
      res.status(404).json({ error: 'Tipo de activo no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar tipo de activo' 
      });
    }
  }
};
export const deleteType = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.assetType.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteType:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const listModels = async (req: Request, res: Response) => {
  try {
    const { manufacturerId, typeId, populate } = req.query as any;
    const where: any = {};
    if (manufacturerId) where.manufacturerId = Number(manufacturerId);
    if (typeId) where.typeId = Number(typeId);
    
    const include: any = {
      AssetManufacturer: true,
    };
    
    if (populate) {
      const relations = String(populate).split(',').map((r: string) => r.trim());
      
      if (relations.some((r: string) => r.startsWith('type'))) {
        include.AssetType = {
          include: {
            AssetGroup: {
              include: {
                AssetCategory: true
              }
            }
          }
        };
      }
    }
    
    const items = await prisma.assetModel.findMany({ 
      where, 
      include,
      orderBy: { name: 'asc' } 
    });
    res.json(items);
  } catch (error) {
    console.error('Error in listModels:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
export const createModel = async (req: Request, res: Response) => {
  try {
    // Convertir IDs a números para evitar errores de tipo
    // NOTA: categoryId y groupId NO existen en asset_models (solo manufacturerId y typeId)
    const now = new Date();
    const createData: any = {
      name: req.body.name,
      description: req.body.description,
      manufacturerId: Number(req.body.manufacturerId),
      partNumber: req.body.partNumber,
      status: req.body.status || 'ACTIVE',
      referenceImage: req.body.referenceImage,
      updatedAt: now,
    };

    if (req.body.typeId) {
      createData.typeId = Number(req.body.typeId);
    }

    const item = await prisma.assetModel.create({ data: createData });
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating model:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un modelo con este nombre para este fabricante' 
      });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'El fabricante o tipo seleccionado no existe' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al crear modelo' 
      });
    }
  }
};
export const updateModel = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    // Construir updateData solo con campos válidos
    // NOTA: categoryId y groupId NO existen en asset_models
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.partNumber !== undefined) updateData.partNumber = req.body.partNumber;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.referenceImage !== undefined) updateData.referenceImage = req.body.referenceImage;
    
    if (req.body.manufacturerId !== undefined) {
      updateData.manufacturerId = Number(req.body.manufacturerId);
    }
    if (req.body.typeId !== undefined) {
      updateData.typeId = req.body.typeId ? Number(req.body.typeId) : null;
    }

    updateData.updatedAt = new Date();

    const item = await prisma.assetModel.update({ where: { id }, data: updateData });
    res.json(item);
  } catch (error: any) {
    console.error('Error updating model:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Ya existe un modelo con este nombre para este fabricante' 
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Modelo no encontrado' });
    } else if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'El fabricante o tipo seleccionado no existe' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al actualizar modelo' 
      });
    }
  }
};
export const deleteModel = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.assetModel.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting model:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Modelo no encontrado' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error al eliminar modelo' 
      });
    }
  }
};


