import { prisma } from '../config/database';
import { Request, Response } from 'express';
import { getFileUrl } from '../middleware/upload';

// Listar imágenes de un modelo
export const listModelImages = async (req: Request, res: Response) => {
  try {
    const modelId = Number(req.params.modelId);
    const images = await prisma.assetModelImage.findMany({
      where: { modelId },
      orderBy: { order: 'asc' }
    });
    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Subir imagen de modelo
export const uploadModelImage = async (req: Request, res: Response) => {
  try {
    const modelId = Number(req.params.modelId);
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const imageUrl = getFileUrl(file);
    const { title, imageType = 'PHOTO', order = 0 } = req.body;

    const image = await prisma.assetModelImage.create({
      data: {
        modelId,
        imageUrl: imageUrl || file.path,
        imageType: imageType as any,
        title,
        order: Number(order) || 0,
        createdBy: (req as any).user?.documentNumber
      }
    });

    res.status(201).json(image);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar imagen de modelo
export const updateModelImage = async (req: Request, res: Response) => {
  try {
    const imageId = Number(req.params.imageId);
    const { title, imageType, order } = req.body;

    const image = await prisma.assetModelImage.update({
      where: { id: imageId },
      data: {
        ...(title && { title }),
        ...(imageType && { imageType: imageType as any }),
        ...(order !== undefined && { order: Number(order) })
      }
    });

    res.json(image);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar imagen de modelo
export const deleteModelImage = async (req: Request, res: Response) => {
  try {
    const imageId = Number(req.params.imageId);
    await prisma.assetModelImage.delete({
      where: { id: imageId }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
