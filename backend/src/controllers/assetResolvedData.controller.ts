import { prisma } from '../config/database';
import { Request, Response } from 'express';

/**
 * Resolver imágenes combinadas: del modelo + del activo
 * Retorna todas las imágenes del modelo más las específicas del activo
 */
export const getResolvedAssetImages = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    
    // Obtener el activo con su modelo
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        AssetModel: {
          include: {
            AssetModelImage: {
              orderBy: { order: 'asc' }
            }
          }
        },
        AssetImage: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Combinar imágenes del modelo (con flag source: 'model') + imágenes del activo (source: 'asset')
    const resolvedImages = [
      ...(asset.AssetModel?.AssetModelImage?.map((img: any) => ({
        ...img,
        source: 'model', // Indica que viene del modelo
        modelId: asset.modelId
      })) || []),
      ...(asset.AssetImage?.map((img: any) => ({
        ...img,
        source: 'asset' // Indica que es específica del activo
      })) || [])
    ];

    res.json({
      assetId,
      modelId: asset.modelId,
      modelName: asset.AssetModel?.name,
      totalImages: resolvedImages.length,
      modelImages: asset.AssetModel?.AssetModelImage?.length || 0,
      assetImages: asset.AssetImage?.length || 0,
      images: resolvedImages
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolver documentos combinados: del modelo + del activo
 * Retorna todos los documentos del modelo más los específicos del activo
 */
export const getResolvedAssetDocuments = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    const { docType, activeOnly } = req.query;

    // Obtener el activo con su modelo
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        AssetModel: {
          include: {
            AssetModelDocument: true
          }
        },
        AssetDocument: {
          ...(docType && { where: { docType: docType as any } }),
          ...(activeOnly === 'true' && { where: { isActive: true } }),
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Combinar documentos del modelo (con flag source: 'model') + documentos del activo (source: 'asset')
    const resolvedDocuments = [
      ...(asset.AssetModel?.AssetModelDocument?.map((doc: any) => ({
        ...doc,
        source: 'model', // Indica que viene del modelo
        modelId: asset.modelId,
        // Convertir ModelDocumentType a formato similar
        originalDocType: doc.docType,
        docType: doc.docType === 'MANUAL' ? 'MANUAL' : 
                 doc.docType === 'DATASHEET' ? 'DATASHEET' : 
                 doc.docType === 'WARRANTY' ? 'WARRANTY' : 'OTHER'
      })) || []),
      ...(asset.AssetDocument?.map((doc: any) => ({
        ...doc,
        source: 'asset' // Indica que es específico del activo
      })) || [])
    ];

    res.json({
      assetId,
      modelId: asset.modelId,
      modelName: asset.AssetModel?.name,
      totalDocuments: resolvedDocuments.length,
      modelDocuments: asset.AssetModel?.AssetModelDocument?.length || 0,
      assetDocuments: asset.AssetDocument?.length || 0,
      documents: resolvedDocuments
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolver todos los datos: imágenes + documentos
 */
export const getResolvedAssetData = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.assetId);
    
    // Obtener todo junto
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        AssetModel: {
          include: {
            AssetModelImage: {
              orderBy: { order: 'asc' }
            },
            AssetModelDocument: true
          }
        },
        AssetImage: {
          orderBy: { order: 'asc' }
        },
        AssetDocument: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Resolver imágenes
    const resolvedImages = [
      ...(asset.AssetModel?.AssetModelImage?.map((img: any) => ({
        ...img,
        source: 'model',
        modelId: asset.modelId
      })) || []),
      ...(asset.AssetImage?.map((img: any) => ({
        ...img,
        source: 'asset'
      })) || [])
    ];

    // Resolver documentos
    const resolvedDocuments = [
      ...(asset.AssetModel?.AssetModelDocument?.map((doc: any) => ({
        ...doc,
        source: 'model',
        modelId: asset.modelId,
        originalDocType: doc.docType
      })) || []),
      ...(asset.AssetDocument?.map((doc: any) => ({
        ...doc,
        source: 'asset'
      })) || [])
    ];

    res.json({
      assetId,
      assetName: asset.name,
      modelId: asset.modelId,
      modelName: asset.AssetModel?.name,
      images: {
        total: resolvedImages.length,
        fromModel: asset.AssetModel?.AssetModelImage?.length || 0,
        fromAsset: asset.AssetImage?.length || 0,
        items: resolvedImages
      },
      documents: {
        total: resolvedDocuments.length,
        fromModel: asset.AssetModel?.AssetModelDocument?.length || 0,
        fromAsset: asset.AssetDocument?.length || 0,
        items: resolvedDocuments
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

