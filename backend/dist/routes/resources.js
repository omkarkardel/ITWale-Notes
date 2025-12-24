"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const mongodb_1 = require("../lib/mongodb");
const mongodb_2 = require("mongodb");
exports.router = (0, express_1.Router)();
exports.router.post('/list', async (req, res) => {
    const { subjectId, units, type, examType, hasFile } = req.body;
    if (!subjectId)
        return res.status(400).json({ error: 'subjectId required' });
    const db = await (0, mongodb_1.getDb)();
    // This query is complex and requires an aggregation pipeline to join
    // 'Resource' and 'Unit' collections, which was handled by Prisma's `include`.
    const pipeline = [
        // Match resources based on direct properties
        {
            $match: {
                ...(type && { type }),
                ...(hasFile && { filePath: { $ne: null } }),
            }
        },
        // Join with the 'Unit' collection
        {
            $lookup: {
                from: 'Unit',
                localField: 'unitId',
                foreignField: '_id',
                as: 'unit'
            }
        },
        // Deconstruct the unit array
        { $unwind: '$unit' },
        // Match based on properties of the joined 'Unit'
        {
            $match: {
                'unit.subjectId': new mongodb_2.ObjectId(subjectId),
                ...(units && { 'unit.unitNumber': { $in: units } }),
                ...(examType && { 'unit.examType': examType }),
            }
        },
        // Sort the results
        { $sort: { createdAt: -1 } }
    ];
    const list = await db.collection('Resource').aggregate(pipeline).toArray();
    // Rename _id to id for frontend compatibility
    const results = list.map(item => {
        item.id = item._id.toHexString();
        delete item._id;
        if (item.unit) {
            item.unit.id = item.unit._id.toHexString();
            delete item.unit._id;
        }
        return item;
    });
    return res.json(results);
});
