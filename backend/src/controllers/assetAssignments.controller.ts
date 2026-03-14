import { prisma } from '../config/database';
import { Request, Response } from 'express';

async function getNextCompanyDocNumber(companyId: number) {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const last = await prisma.assetAssignmentDoc.findFirst({
    where: { companyId, docNumber: { startsWith: prefix } },
    orderBy: { docNumber: 'desc' },
    select: { docNumber: true },
  });
  const nextSeq = last ? (parseInt(last.docNumber.split('-')[1] || '0', 10) + 1) : 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `${prefix}${padded}`;
}

async function hasActiveAssignment(assetId: number) {
  const active = await prisma.assetAssignment.findFirst({ where: { assetId, status: 'ACTIVE', endDate: null } });
  return !!active;
}

export const assignAsset = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const { assignmentType, assignedToUserId, assignedToCompanyId, assignedToHqId, generateDoc, pdfUrl, commentary } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    if (await hasActiveAssignment(assetId)) {
      return res.status(400).json({ error: 'El activo ya tiene una asignación activa. Debe desasignarse primero.' });
    }

    let docId: number | undefined = undefined;
    if (generateDoc) {
      if (!asset.companyId) {
        return res.status(400).json({ 
          error: 'El activo debe tener una empresa asignada para generar un documento de asignación.' 
        });
      }
      const docNumber = await getNextCompanyDocNumber(asset.companyId);
      const doc = await prisma.assetAssignmentDoc.create({
        data: {
          companyId: asset.companyId,
          docNumber,
          pdfUrl: pdfUrl || null,
          updatedAt: new Date(),
        },
      });
      docId = doc.id;
    }

    const created = await prisma.assetAssignment.create({
      data: {
        assetId,
        assignmentType,
        assignedToUserId: assignedToUserId || null,
        assignedToCompanyId: assignedToCompanyId || null,
        assignedToHqId: assignedToHqId || null,
        assignmentDocId: docId,
        status: 'ACTIVE',
        commentary: commentary || null,
        updatedAt: new Date(),
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error in assignAsset:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const unassignAsset = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const { generateDoc, pdfUrl, commentary } = req.body || {};

    const active = await prisma.assetAssignment.findFirst({ where: { assetId, status: 'ACTIVE', endDate: null }, orderBy: { startDate: 'desc' } });
    if (!active) return res.status(400).json({ error: 'El activo no tiene asignación activa.' });

    let docId: number | undefined = undefined;
    if (generateDoc) {
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      
      if (!asset.companyId) {
        return res.status(400).json({ 
          error: 'El activo debe tener una empresa asignada para generar un documento de desasignación.' 
        });
      }
      
      const docNumber = await getNextCompanyDocNumber(asset.companyId);
      const doc = await prisma.assetAssignmentDoc.create({ 
        data: { 
          companyId: asset.companyId, 
          docNumber, 
          pdfUrl: pdfUrl || null,
          updatedAt: new Date()
        } 
      });
      docId = doc.id;
    }

    const closed = await prisma.assetAssignment.update({
      where: { id: active.id },
      data: { endDate: new Date(), status: 'INACTIVE', commentary: commentary || active.commentary, assignmentDocId: docId || active.assignmentDocId },
    });

    res.json(closed);
  } catch (error) {
    console.error('Error in unassignAsset:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
