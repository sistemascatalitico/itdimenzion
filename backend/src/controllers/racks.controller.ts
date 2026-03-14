import { prisma } from '../config/database';
import { Request, Response } from 'express';

export const listRacks = async (req: Request, res: Response) => {
  try {
    const { companyId, headquartersId } = req.query as any;
    const where: any = {};
    if (companyId) where.companyId = Number(companyId);
    if (headquartersId) where.headquartersId = Number(headquartersId);
    const racks = await prisma.rack.findMany({ where, orderBy: { name: 'asc' } });
    res.json(racks);
  } catch (error) {
    console.error('Error in listRacks:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const createRack = async (req: Request, res: Response) => {
  try {
    const item = await prisma.rack.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error in createRack:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const assignToRack = async (req: Request, res: Response) => {
  try {
    const rackId = Number(req.params.id);
    const { assetId, startU, heightU, notes } = req.body;

    const sU = Number(startU);
    const hU = Number(heightU);
    const endU = sU + hU - 1;
    if (sU < 1 || hU < 1) return res.status(400).json({ error: 'Valores de U inválidos.' });

    const assignments = await prisma.rackAssignment.findMany({ where: { rackId } });
    const overlaps = assignments.some((a: any) => {
      const aStart = a.startU;
      const aEnd = a.startU + a.heightU - 1;
      return Math.max(aStart, sU) <= Math.min(aEnd, endU);
    });
    if (overlaps) return res.status(400).json({ error: 'Colisión de intervalos de U en el rack.' });

    const created = await prisma.rackAssignment.create({
      data: { rackId, assetId: Number(assetId), startU: sU, heightU: hU, notes: notes || null, updatedAt: new Date() },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error in assignToRack:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const removeFromRack = async (req: Request, res: Response) => {
  try {
    const assignId = Number(req.params.assignmentId);
    await prisma.rackAssignment.delete({ where: { id: assignId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error in removeFromRack:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
