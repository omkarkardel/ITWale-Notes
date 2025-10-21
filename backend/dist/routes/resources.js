"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const database_1 = require("@itwale/database");
exports.router = (0, express_1.Router)();
exports.router.post('/list', async (req, res) => {
    const { subjectId, units, type, examType, hasFile } = req.body;
    if (!subjectId)
        return res.status(400).json({ error: 'subjectId required' });
    const unitsWhere = units ? { unitNumber: { in: units } } : {};
    const where = { unit: { subjectId, ...unitsWhere } };
    if (type)
        where.type = type;
    if (examType)
        where.unit.examType = examType;
    if (hasFile)
        where.filePath = { not: null };
    const list = await database_1.prisma.resource.findMany({
        where,
        include: { unit: true },
        orderBy: { createdAt: 'desc' },
    });
    return res.json(list);
});
