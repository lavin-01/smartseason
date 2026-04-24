const { PrismaClient } = require('@prisma/client');
const { respondWithDatabaseError } = require('../utils/databaseErrors');

const prisma = new PrismaClient();

// POST /api/fields/:id/updates — Agent or Admin
const addUpdate = async (req, res) => {
  try {
    const { note, stage } = req.body;
    const fieldId = req.params.id;

    if (!note && !stage) {
      return res.status(400).json({ error: 'Provide a note or stage change' });
    }

    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) return res.status(404).json({ error: 'Field not found' });

    // Agents can only update their assigned fields
    if (req.user.role === 'AGENT' && field.assignedAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this field' });
    }

    // Create the update record
    const update = await prisma.fieldUpdate.create({
      data: {
        fieldId,
        agentId: req.user.id,
        note: note || null,
        stage: stage || null,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    // If stage is changing, update the field's stage too
    if (stage && stage !== field.stage) {
      await prisma.field.update({
        where: { id: fieldId },
        data: { stage },
      });
    } else {
      // Touch updatedAt so staleness timer resets
      await prisma.field.update({
        where: { id: fieldId },
        data: { updatedAt: new Date() },
      });
    }

    res.status(201).json({ update });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to add update');
  }
};

// GET /api/updates/recent — Admin dashboard feed
const getRecentUpdates = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const updates = await prisma.fieldUpdate.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        agent: { select: { id: true, name: true } },
        field: { select: { id: true, name: true, cropType: true } },
      },
    });

    res.json({ updates });
  } catch (err) {
    return respondWithDatabaseError(res, err, 'Failed to fetch recent updates');
  }
};

module.exports = { addUpdate, getRecentUpdates };
