import { prisma } from '../config/database';
import { Request, Response } from 'express';

export const listComponents = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const parents = await prisma.assetComponent.findMany({ where: { parentAssetId: assetId, status: 'ACTIVE' }, orderBy: { positionIndex: 'asc' } });
    res.json(parents);
  } catch (error) {
    console.error('Error in listComponents:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const addComponent = async (req: Request, res: Response) => {
  try {
    const parentAssetId = Number(req.params.id);
    const { childAssetId, relationRole, quantity, positionIndex } = req.body;

    const existing = await prisma.assetComponent.findFirst({ where: { childAssetId: Number(childAssetId), status: 'ACTIVE' } });
    if (existing) return res.status(400).json({ error: 'El componente ya está asociado activamente a otro activo.' });

    const startId = Number(childAssetId);
    const targetId = parentAssetId;
    const visited = new Set<number>();
    const queue: number[] = [startId];
    while (queue.length) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      if (current === targetId) {
        return res.status(400).json({ error: 'Relación inválida: crearía un ciclo en la jerarquía de componentes.' });
      }
      const children = await prisma.assetComponent.findMany({
        where: { parentAssetId: current, status: 'ACTIVE' },
        select: { childAssetId: true },
      });
      for (const ch of children) {
        if (!visited.has(ch.childAssetId)) queue.push(ch.childAssetId);
      }
    }
    const created = await prisma.assetComponent.create({
      data: {
        parentAssetId,
        childAssetId: Number(childAssetId),
        relationRole: relationRole || null,
        quantity: quantity ? Number(quantity) : 1,
        positionIndex: positionIndex != null ? Number(positionIndex) : null,
        status: 'ACTIVE',
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error in addComponent:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const removeComponent = async (req: Request, res: Response) => {
  try {
    const parentAssetId = Number(req.params.id);
    const compId = Number(req.params.compId);
    const comp = await prisma.assetComponent.findFirst({ where: { id: compId, parentAssetId, status: 'ACTIVE' } });
    if (!comp) return res.status(404).json({ error: 'Componente no encontrado o ya inactivo.' });
    const updated = await prisma.assetComponent.update({ where: { id: compId }, data: { status: 'INACTIVE', removedAt: new Date() } });
    res.json(updated);
  } catch (error) {
    console.error('Error in removeComponent:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};

export const moveComponent = async (req: Request, res: Response) => {
  try {
    const parentAssetId = Number(req.params.id);
    const compId = Number(req.params.compId);
    const { positionIndex, relationRole } = req.body;
    const comp = await prisma.assetComponent.findFirst({ where: { id: compId, parentAssetId, status: 'ACTIVE' } });
    if (!comp) return res.status(404).json({ error: 'Componente no encontrado o ya inactivo.' });
    const updated = await prisma.assetComponent.update({ where: { id: compId }, data: { positionIndex: positionIndex != null ? Number(positionIndex) : comp.positionIndex, relationRole: relationRole ?? comp.relationRole } });
    res.json(updated);
  } catch (error) {
    console.error('Error in moveComponent:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev && error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message, statusCode: 500 });
  }
};
