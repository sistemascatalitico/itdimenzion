import { prisma } from '../config/database';
import { Request, Response } from 'express';

async function hasActiveAssignment(assetId: number) {
  const active = await prisma.assetAssignment.findFirst({ where: { assetId, status: 'ACTIVE', endDate: null } });
  return !!active;
}

export const transferAsset = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const { toCompanyId, toHeadquartersId, notes } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    if (await hasActiveAssignment(assetId)) {
      return res.status(400).json({ error: 'No se puede trasladar un activo con asignación activa. Desasigne primero.' });
    }

    const created = await prisma.assetTransfer.create({
      data: {
        assetId,
        transferType: 'TRANSFER',
        fromCompanyId: asset.companyId,
        toCompanyId: toCompanyId || null,
        fromHeadquartersId: asset.headquartersId,
        toHeadquartersId: toHeadquartersId || null,
        startDate: new Date(),
        status: 'ACTIVE',
        notes: notes || null,
        updatedAt: new Date(),
      },
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { companyId: toCompanyId ?? asset.companyId, headquartersId: toHeadquartersId ?? asset.headquartersId },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error in transferAsset:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const createLoan = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const { providerId, toCompanyId, toHeadquartersId, expectedReturnDate, notes } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    if (await hasActiveAssignment(assetId)) {
      return res.status(400).json({ error: 'No se puede prestar un activo con asignación activa. Desasigne primero.' });
    }

    const created = await prisma.assetTransfer.create({
      data: {
        assetId,
        transferType: 'LOAN',
        fromCompanyId: asset.companyId,
        toCompanyId: toCompanyId || null,
        fromHeadquartersId: asset.headquartersId,
        toHeadquartersId: toHeadquartersId || null,
        providerId: providerId || null,
        startDate: new Date(),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        status: 'ACTIVE',
        notes: notes || null,
        updatedAt: new Date(),
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error in createLoan:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const returnLoan = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const activeLoan = await prisma.assetTransfer.findFirst({
      where: { assetId, transferType: 'LOAN', status: 'ACTIVE', endDate: null },
      orderBy: { startDate: 'desc' },
    });
    if (!activeLoan) return res.status(400).json({ error: 'El activo no tiene un préstamo activo.' });

    const closed = await prisma.assetTransfer.update({
      where: { id: activeLoan.id },
      data: { endDate: new Date(), status: 'RETURNED' },
    });
    res.json(closed);
  } catch (error) {
    console.error('Error in returnLoan:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
