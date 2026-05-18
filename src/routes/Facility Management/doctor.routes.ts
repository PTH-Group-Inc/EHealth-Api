import { Router, Request, Response } from 'express';
import { pool } from '../../config/postgresdb';

const router = Router();

/**
 * @swagger
 * /api/doctors/{id}/reviews:
 *   get:
 *     tags: [Doctors]
 *     summary: Lấy danh sách đánh giá của bác sĩ
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Danh sách review (kèm pagination)
 */
router.get('/:id/reviews', async (req: Request, res: Response) => {
    const doctorId = req.params.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? 10), 10)));
    const offset = (page - 1) * limit;

    try {
        // Reuse tele_quality_reviews — bảng đã có sẵn cho teleconsultation.
        // Filter theo doctor_id để trả review của BS cụ thể.
        const [{ rows: items }, { rows: cnt }] = await Promise.all([
            pool.query(
                `SELECT review_id AS id,
                        patient_id,
                        rating,
                        comment,
                        created_at
                 FROM tele_quality_reviews
                 WHERE doctor_id = $1
                 ORDER BY created_at DESC
                 LIMIT $2 OFFSET $3`,
                [doctorId, limit, offset]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS total FROM tele_quality_reviews WHERE doctor_id = $1`,
                [doctorId]
            ),
        ]);

        const total: number = cnt[0]?.total ?? 0;
        return res.status(200).json({
            success: true,
            data: items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (err: any) {
        // Bảng có thể chưa tồn tại trong vài môi trường — fallback empty thay vì 500
        if (err?.code === '42P01') {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: { page, limit, total: 0, totalPages: 1 },
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Không tải được review bác sĩ.',
            error: err?.message,
        });
    }
});

export default router;
