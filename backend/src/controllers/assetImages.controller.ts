import { prisma } from '../config/database';
import { Request, Response } from 'express';
import { getFileUrl } from '../middleware/upload';

// Listar imágenes de un activo
export const listAssetImages = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    const images = await prisma.assetImage.findMany({
      where: { assetId },
      orderBy: { order: 'asc' }
    });
    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Subir imagen de activo
export const uploadAssetImage = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const imageUrl = getFileUrl(file);
    const { title, imageType = 'PHOTO', order = 0 } = req.body;

    const image = await prisma.assetImage.create({
      data: {
        assetId,
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

// Actualizar imagen de activo
export const updateAssetImage = async (req: Request, res: Response) => {
  try {
    const imageId = Number(req.params.imageId);
    const { title, imageType, order } = req.body;

    const image = await prisma.assetImage.update({
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

// Eliminar imagen de activo
export const deleteAssetImage = async (req: Request, res: Response) => {
  try {
    const imageId = Number(req.params.imageId);
    await prisma.assetImage.delete({
      where: { id: imageId }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
