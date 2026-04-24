const { PrismaClient } = require('@prisma/client');
const { enrichField } = require('../middleware/fieldStatus');
const { respondWithDatabaseError } = require('../utils/databaseErrors');

const prisma = new PrismaClient();

const fieldSelect = {
  id: true,
  name: true,
  cropType: true,
  plantingDate: true,
  stage: true,
  location: true,
  sizeHectares: true,
  createdAt: true,
  updatedAt: true,
  assignedAgent: {
    select: { id: true, name: true, email: true },
  },
  _count: { select: { updates: true } },
};

// GET /api/fields — Admin gets all, Agent gets assigned
const getFields = async (req, res) => {
  try {
    const where =
      req.user.role === 'ADMIN' ? {} : { assignedAgentId: req.user.id };

    const fields = await prisma.field.findMany({
      where,
      select: fieldSelect,
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ fields: fields.map(enrichField) });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to fetch fields');
  }
};

// GET /api/fields/:id
const getField = async (req, res) => {
  try {
    const field = await prisma.field.findUnique({
      where: { id: req.params.id },
      select: {
        ...fieldSelect,
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            agent: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!field) return res.status(404).json({ error: 'Field not found' });

    // Agents can only view their assigned fields
    if (
      req.user.role === 'AGENT' &&
      field.assignedAgent?.id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ field: enrichField(field) });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to fetch field');
  }
};

// POST /api/fields — Admin only
const createField = async (req, res) => {
  try {
    const { name, cropType, plantingDate, stage, location, sizeHectares, assignedAgentId } =
      req.body;

    if (!name || !cropType || !plantingDate) {
      return res
        .status(400)
        .json({ error: 'name, cropType, and plantingDate are required' });
    }

    const field = await prisma.field.create({
      data: {
        name,
        cropType,
        plantingDate: new Date(plantingDate),
        stage: stage || 'PLANTED',
        location,
        sizeHectares: sizeHectares ? parseFloat(sizeHectares) : null,
        assignedAgentId: assignedAgentId || null,
      },
      select: fieldSelect,
    });

    res.status(201).json({ field: enrichField(field) });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to create field');
  }
};

// PUT /api/fields/:id — Admin only
const updateField = async (req, res) => {
  try {
    const { name, cropType, plantingDate, stage, location, sizeHectares, assignedAgentId } =
      req.body;

    const existing = await prisma.field.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Field not found' });

    const field = await prisma.field.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(cropType && { cropType }),
        ...(plantingDate && { plantingDate: new Date(plantingDate) }),
        ...(stage && { stage }),
        ...(location !== undefined && { location }),
        ...(sizeHectares !== undefined && {
          sizeHectares: sizeHectares ? parseFloat(sizeHectares) : null,
        }),
        ...(assignedAgentId !== undefined && { assignedAgentId: assignedAgentId || null }),
      },
      select: fieldSelect,
    });

    res.json({ field: enrichField(field) });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to update field');
  }
};

// DELETE /api/fields/:id — Admin only
const deleteField = async (req, res) => {
  try {
    const existing = await prisma.field.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: 'Field not found' });

    await prisma.field.delete({ where: { id: req.params.id } });
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to delete field');
  }
};

// GET /api/fields/stats/summary — Dashboard summary
const getSummary = async (req, res) => {
  try {
    const where =
      req.user.role === 'ADMIN' ? {} : { assignedAgentId: req.user.id };

    const fields = await prisma.field.findMany({
      where,
      select: {
        cropType: true,
        stage: true,
        updatedAt: true,
        plantingDate: true,
        sizeHectares: true,
        assignedAgentId: true,
        _count: { select: { updates: true } },
      },
    });

    const enriched = fields.map(enrichField);

    const summary = {
      total: enriched.length,
      byStage: {
        PLANTED: 0,
        GROWING: 0,
        READY: 0,
        HARVESTED: 0,
      },
      byStatus: {
        ACTIVE: 0,
        AT_RISK: 0,
        COMPLETED: 0,
      },
      byPriority: {
        IMMEDIATE: 0,
        HIGH: 0,
        MONITOR: 0,
        ROUTINE: 0,
        CLOSED: 0,
      },
    };

    enriched.forEach((f) => {
      summary.byStage[f.stage]++;
      summary.byStatus[f.status]++;
      summary.byPriority[f.insight.priorityBucket]++;
    });

    res.json({ summary });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to fetch summary');
  }
};

module.exports = { getFields, getField, createField, updateField, deleteField, getSummary };
