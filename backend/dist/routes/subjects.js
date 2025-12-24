"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const mongodb_1 = require("../lib/mongodb");
exports.router = (0, express_1.Router)();
exports.router.get('/', async (req, res) => {
    const year = req.query.year || undefined;
    const semStr = req.query.sem;
    const sem = semStr ? Number(semStr) : undefined;
    const q = req.query.q?.trim();
    const db = await (0, mongodb_1.getDb)();
    const collection = db.collection('Subject');
    const where = {};
    if (year)
        where.year = year;
    if (sem)
        where.semester = sem;
    const subjects = await collection.find(where, {
        projection: { _id: 1, name: 1, year: 1, semester: 1 }
    }).sort({ name: 1 }).toArray();
    // Rename _id to id for frontend compatibility
    const subjectsWithId = subjects.map(s => ({ ...s, id: s._id.toHexString() }));
    if (!q) {
        return res.json(subjectsWithId);
    }
    else {
        const ql = q.toLowerCase();
        const filtered = subjectsWithId.filter((s) => s.name.toLowerCase().includes(ql));
        return res.json(filtered);
    }
});
