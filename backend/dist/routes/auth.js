"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const mongodb_1 = require("../lib/mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_2 = require("mongodb");
const router = (0, express_1.Router)();
exports.router = router;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN_DAYS = Number(process.env.JWT_EXPIRES_IN_DAYS || 7);
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(6) });
const signupSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(6), name: zod_1.z.string().optional() });
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    const db = await (0, mongodb_1.getDb)();
    const user = await db.collection('User').findOne({ email: parsed.data.email });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcryptjs_1.default.compareSync(parsed.data.password, user.password);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ sub: user._id.toHexString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: `${JWT_EXPIRES_IN_DAYS}d` });
    const sameSite = (process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'));
    res.cookie('token', token, {
        httpOnly: true,
        sameSite,
        secure: process.env.NODE_ENV === 'production',
        maxAge: JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
    });
    // Email notifications removed per request
    res.json({ ok: true });
});
router.post('/signup', async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    const db = await (0, mongodb_1.getDb)();
    const exists = await db.collection('User').findOne({ email: parsed.data.email });
    if (exists)
        return res.status(409).json({ error: 'Email already in use' });
    const hash = bcryptjs_1.default.hashSync(parsed.data.password, 10);
    await db.collection('User').insertOne({
        email: parsed.data.email,
        password: hash,
        name: parsed.data.name,
        role: 'user', // Default role
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    res.json({ ok: true });
});
router.post('/logout', (_req, res) => {
    res.cookie('token', '', { httpOnly: true, path: '/', maxAge: 0 });
    res.json({ ok: true });
});
router.get('/me', async (req, res) => {
    const token = req.cookies?.token;
    if (!token)
        return res.json({ user: null });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const db = await (0, mongodb_1.getDb)();
        const user = await db.collection('User').findOne({ _id: new mongodb_2.ObjectId(payload.sub) }, { projection: { password: 0 } } // Exclude password from the result
        );
        if (user) {
            // Rename _id to id for frontend compatibility
            if (user._id && typeof user._id === 'object' && typeof user._id.toHexString === 'function') {
                user.id = user._id.toHexString();
            }
            else {
                user.id = String(user._id);
            }
            user._id && delete user._id;
        }
        return res.json({ user });
    }
    catch {
        return res.json({ user: null });
    }
});
