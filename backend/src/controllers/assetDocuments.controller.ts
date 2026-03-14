import { prisma } from '../config/database';
import { Request, Response } from 'express';
import { getFileUrl } from '../middleware/upload';

// Listar documentos de un activo
export const listAssetDocuments = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId || req.params.id);
    const { docType, activeOnly } = req.query;

    const where: any = { assetId };
    if (docType) {
      where.docType = docType as any;
    }
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const docs = await prisma.assetDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener documentos activos de un activo
export const getActiveDocuments = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId || req.params.id);
    const docs = await prisma.assetDocument.findMany({
      where: { assetId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Agregar documento (con upload de archivo)
export const addAssetDocument = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId || req.params.id);
    const file = (req as any).file;
    
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const {
      docType,
      title,
      fileUrl: urlFromBody, // URL proporcionada directamente
      externalRef,
      supplier,
      amount,
      documentDate,
      commentary,
      isActive = true,
      documentRef,
      relatedUserId,
      relatedCompanyId,
      relatedDocumentId
    } = req.body;

    // Si hay archivo, usar getFileUrl; si no, usar URL del body
    const fileUrl = file ? getFileUrl(file) : urlFromBody;

    if (!fileUrl) {
      return res.status(400).json({ error: 'Debe proporcionar un archivo o URL' });
    }

    const doc = await prisma.assetDocument.create({
      data: {
        assetId,
        docType: docType as any,
        title,
        fileUrl,
        externalRef,
        supplier,
        amount: amount ? Number(amount) : null,
        documentDate: documentDate ? new Date(documentDate) : null,
        commentary,
        isActive: isActive === 'true' || isActive === true,
        documentRef,
        relatedUserId,
        relatedCompanyId: relatedCompanyId ? Number(relatedCompanyId) : null,
        relatedDocumentId: relatedDocumentId ? Number(relatedDocumentId) : null,
        fileSize: file?.size || null,
        mimeType: file?.mimetype || null,
        createdBy: (req as any).user?.documentNumber,
        updatedAt: new Date()
      }
    });

    res.status(201).json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar documento
export const updateAssetDocument = async (req: Request, res: Response) => {
  try {
    const docId = Number(req.params.docId);
    const file = (req as any).file;
    
    const {
      docType,
      title,
      fileUrl: urlFromBody,
      externalRef,
      supplier,
      amount,
      documentDate,
      commentary,
      isActive,
      documentRef,
      relatedUserId,
      relatedCompanyId,
      relatedDocumentId
    } = req.body;

    const updateData: any = {};
    if (docType) updateData.docType = docType as any;
    if (title) updateData.title = title;
    if (file) {
      updateData.fileUrl = getFileUrl(file);
      updateData.fileSize = file.size;
      updateData.mimeType = file.mimetype;
    } else if (urlFromBody) {
      updateData.fileUrl = urlFromBody;
    }
    if (externalRef !== undefined) updateData.externalRef = externalRef;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (amount !== undefined) updateData.amount = amount ? Number(amount) : null;
    if (documentDate !== undefined) updateData.documentDate = documentDate ? new Date(documentDate) : null;
    if (commentary !== undefined) updateData.commentary = commentary;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (documentRef !== undefined) updateData.documentRef = documentRef;
    if (relatedUserId !== undefined) updateData.relatedUserId = relatedUserId;
    if (relatedCompanyId !== undefined) updateData.relatedCompanyId = relatedCompanyId ? Number(relatedCompanyId) : null;
    if (relatedDocumentId !== undefined) updateData.relatedDocumentId = relatedDocumentId ? Number(relatedDocumentId) : null;
    
    updateData.updatedBy = (req as any).user?.documentNumber;

    const doc = await prisma.assetDocument.update({
      where: { id: docId },
      data: updateData
    });

    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar documento
export const deleteAssetDocument = async (req: Request, res: Response) => {
  try {
    const docId = Number(req.params.docId);
    await prisma.assetDocument.delete({
      where: { id: docId }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


