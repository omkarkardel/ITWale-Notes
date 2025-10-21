"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const database_1 = require("@itwale/database");
exports.router = (0, express_1.Router)();
exports.router.get('/', async (req, res) => {
    const year = req.query.year || undefined;
    const semStr = req.query.sem;
    const sem = semStr ? Number(semStr) : undefined;
    const q = req.query.q?.trim();
    const where = {};
    if (year)
        where.year = year;
    if (sem)
        where.semester = sem;
    if (!q) {
        const subjects = await database_1.prisma.subject.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true, year: true, semester: true } });
        return res.json(subjects);
    }
    else {
        const subjects = await database_1.prisma.subject.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true, year: true, semester: true } });
        const ql = q.toLowerCase();
        const filtered = subjects.filter(s => s.name.toLowerCase().includes(ql));
        return res.json(filtered);
    }
});
