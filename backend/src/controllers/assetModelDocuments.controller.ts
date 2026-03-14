import { prisma } from '../config/database';
import { Request, Response } from 'express';
import { getFileUrl } from '../middleware/upload';

// Listar documentos de un modelo
export const listModelDocuments = async (req: Request, res: Response) => {
  try {
    const modelId = Number(req.params.modelId);
    const documents = await prisma.assetModelDocument.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Subir documento de modelo
export const uploadModelDocument = async (req: Request, res: Response) => {
  try {
    const modelId = Number(req.params.modelId);
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const fileUrl = getFileUrl(file);
    const { title, docType = 'MANUAL' } = req.body;

    const document = await prisma.assetModelDocument.create({
      data: {
        modelId,
        docType: docType as any,
        title: title || file.originalname,
        fileUrl: fileUrl || file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        createdBy: (req as any).user?.documentNumber
      }
    });

    res.status(201).json(document);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar documento de modelo
export const updateModelDocument = async (req: Request, res: Response) => {
  try {
    const docId = Number(req.params.docId);
    const { title, docType } = req.body;

    const document = await prisma.assetModelDocument.update({
      where: { id: docId },
      data: {
        ...(title && { title }),
        ...(docType && { docType: docType as any })
      }
    });

    res.json(document);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar documento de modelo
export const deleteModelDocument = async (req: Request, res: Response) => {
  try {
    const docId = Number(req.params.docId);
    await prisma.assetModelDocument.delete({
      where: { id: docId }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
