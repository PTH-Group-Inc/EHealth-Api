import { Router, Request, Response } from 'express';

const router = Router();

// 1. GET /api/ai/summarize/:patientId — Tóm tắt hồ sơ bệnh nhân
router.get('/summarize/:patientId', (req: Request, res: Response) => {
    const { patientId } = req.params;
    res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        summary: {
            patientId,
            patientName: 'Bệnh nhân Demo',
            chronicConditions: [
                'Tăng huyết áp vô căn (giai đoạn 2)',
                'Đái tháo đường type 2 (kiểm soát bằng thuốc)',
                'Rối loạn lipid máu hỗn hợp'
            ],
            currentMedications: [
                { name: 'Metformin 850mg', dosage: '1 viên x 2 lần/ngày (sau ăn)', compliance: 'Tốt' },
                { name: 'Amlodipine 5mg', dosage: '1 viên x 1 lần/ngày (sáng)', compliance: 'Khá' },
                { name: 'Atorvastatin 20mg', dosage: '1 viên x 1 lần/ngày (tối)', compliance: 'Tốt' }
            ],
            allergies: ['Penicillin (ngứa, mề đay)', 'Sulfonamides'],
            redFlags: [
                'Chỉ số HA đo tại nhà dao động mạnh (150/95 - 165/100 mmHg)',
                'Glucose lúc đói tăng nhẹ trong 3 tháng gần nhất (6.8 -> 7.4 mmol/L)'
            ],
            recentDiagnosis: {
                icdCode: 'I10',
                description: 'Bệnh tăng huyết áp vô căn (nguyên phát)',
                date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
            },
            citations: [
                {
                    id: 'cit_1',
                    source: 'Hướng dẫn điều trị tăng huyết áp BYT 2022',
                    section: 'Mục 3.2',
                    excerpt: 'Mục tiêu huyết áp kiểm soát ở bệnh nhân đái tháo đường đi kèm là < 130/80 mmHg nếu dung nạp tốt.',
                    evidenceLevel: 'BYT_VN',
                    reference: 'Quyết định 3192/QĐ-BYT'
                }
            ]
        }
    });
});

// 2. POST /api/ai/analyze — Các phân tích AI chuyên sâu
router.post('/analyze', (req: Request, res: Response) => {
    const { type } = req.body;

    switch (type) {
        case 'vital_anomaly': {
            const vitals = req.body.vitals || {};
            const alerts: any[] = [];
            let overallStatus = 'normal';

            // Check Huyết áp
            if (vitals.bloodPressure) {
                const parts = vitals.bloodPressure.split('/');
                const sbp = parseInt(parts[0]);
                const dbp = parseInt(parts[1]);
                if (sbp >= 140 || dbp >= 90) {
                    alerts.push({
                        id: 'v_bp_high',
                        parameter: 'blood_pressure',
                        value: vitals.bloodPressure,
                        severity: sbp >= 160 ? 'critical' : 'warning',
                        message: `Huyết áp tâm thu/tâm trương cao (${vitals.bloodPressure} mmHg).`,
                        clinicalAssessment: ['Nghi ngờ cơn tăng huyết áp chưa kiểm soát', 'Đánh giá nguy cơ biến chứng tim mạch'],
                        suggestedLabs: [
                            { id: 'ecg', labName: 'Điện tâm đồ (ECG)', reason: 'Đánh giá phì đại thất trái / thiếu máu cơ tim', priority: 'necessary' }
                        ],
                        citations: [
                            {
                                id: 'c_vital_1',
                                source: 'ESC/ESH 2023 Guidelines',
                                section: 'Section 4.1',
                                excerpt: 'Hypertension is defined as office SBP >= 140 mmHg and/or DBP >= 90 mmHg.',
                                evidenceLevel: 'A',
                                reference: 'EHJ 2023'
                            }
                        ],
                        confidence: 95
                    });
                    overallStatus = sbp >= 160 ? 'critical' : 'warning';
                }
            }

            // Check SpO2
            if (vitals.spO2 && parseInt(vitals.spO2) < 95) {
                alerts.push({
                    id: 'v_spo2_low',
                    parameter: 'spo2',
                    value: vitals.spO2,
                    severity: 'critical',
                    message: `Chỉ số SpO2 thấp (${vitals.spO2}%). Nguy cơ suy hô hấp.`,
                    clinicalAssessment: ['Đánh giá tình trạng suy hô hấp cấp', 'Kiểm tra đường thở và thông khí'],
                    suggestedLabs: [
                        { id: 'xray', labName: 'X-quang ngực thẳng', reason: 'Đánh giá tổn thương nhu mô phổi', priority: 'urgent' }
                    ],
                    citations: [],
                    confidence: 98
                });
                overallStatus = 'critical';
            }

            res.status(200).json({
                success: true,
                data: {
                    alerts,
                    overallStatus
                }
            });
            break;
        }

        case 'drug_interaction': {
            const drugs = req.body.drugs || [];
            const allergies = req.body.allergies || [];
            const interactions: any[] = [];
            const allergyConflicts: any[] = [];

            // Mock tương tác giữa Clopidogrel + Aspirin hoặc Amlodipine + NSAIDs
            const drugNames = drugs.map((d: any) => d.name.toLowerCase());
            
            if (drugNames.some((n: string) => n.includes('aspirin')) && drugNames.some((n: string) => n.includes('ibuprofen') || n.includes('diclofenac'))) {
                interactions.push({
                    drugA: 'Aspirin',
                    drugB: 'Ibuprofen/Diclofenac',
                    severity: 'serious',
                    detail: 'NSAIDs có thể làm giảm tác dụng bảo vệ tim mạch của Aspirin liều thấp và làm tăng nguy cơ xuất huyết tiêu hoá gấp 2-4 lần.',
                    citations: [
                        {
                            id: 'c_drug_1',
                            source: 'DrugBank v5.0',
                            section: 'DB00945 x DB01050',
                            excerpt: 'Concomitant NSAID use impairs low-dose aspirin antiplatelet effect.',
                            evidenceLevel: 'A',
                            reference: 'DrugBank'
                        }
                    ]
                });
            }

            // Check dị ứng penicillin
            if (allergies.some((a: string) => a.toLowerCase().includes('penicillin')) && drugNames.some((n: string) => n.includes('amoxicillin') || n.includes('augmentin') || n.includes('penicillin'))) {
                allergyConflicts.push({
                    drug: 'Amoxicillin/Augmentin',
                    allergy: 'Penicillin',
                    citations: [
                        {
                            id: 'c_allergy_1',
                            source: 'Chỉ dẫn Lâm sàng BYT',
                            section: 'Dị ứng thuốc nhóm Beta-lactam',
                            excerpt: 'Chống chỉ định tuyệt đối kháng sinh nhóm penicillin khi có tiền sử dị ứng phản vệ.',
                            evidenceLevel: 'BYT_VN',
                            reference: 'Dược thư Quốc gia VN'
                        }
                    ]
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    overallSafe: interactions.length === 0 && allergyConflicts.length === 0,
                    interactions,
                    allergyConflicts
                }
            });
            break;
        }

        case 'prescription_audit': {
            res.status(200).json({
                success: true,
                data: {
                    issues: []
                }
            });
            break;
        }

        case 'lab_trend': {
            res.status(200).json({
                success: true,
                data: {
                    trends: [
                        {
                            id: 't_glu',
                            parameter: 'Glucose',
                            values: [
                                { date: '2026-01-10', value: 5.8 },
                                { date: '2026-03-15', value: 6.4 },
                                { date: '2026-06-08', value: 7.2 }
                            ],
                            trend: 'increasing',
                            clinicalSignificance: 'Chỉ số glucose lúc đói tăng dần qua 3 lần xét nghiệm liên tiếp, tiệm cận ngưỡng đái tháo đường thực sự. Cần đánh giá thêm HbA1c.',
                            citations: []
                        }
                    ]
                }
            });
            break;
        }

        case 'daily_briefing': {
            res.status(200).json({
                success: true,
                data: {
                    items: [
                        {
                            id: 'b_1',
                            type: 'allergy_warning',
                            severity: 'warning',
                            title: 'Cảnh báo dị ứng Penicillin',
                            content: 'Bệnh nhân Nguyễn Văn A chuẩn bị vào khám có tiền sử dị ứng Penicillin nặng.',
                            citations: []
                        }
                    ],
                    generatedAt: new Date().toISOString()
                }
            });
            break;
        }

        case 'follow_up_tracking': {
            res.status(200).json({
                success: true,
                data: {
                    suggestions: [],
                    citations: []
                }
            });
            break;
        }

        case 'session_notes': {
            res.status(200).json({
                success: true,
                data: {
                    message: 'S: Bệnh nhân đau đầu nhẹ, chóng mặt 2 ngày qua. Tuân thủ thuốc huyết áp khá.\nO: Huyết áp đo tại quầy 145/90 mmHg. Tim đều, phổi trong.\nA: Tăng huyết áp độ 1 chưa kiểm soát hoàn toàn.\nP: Tiếp tục Amlodipine 5mg, dặn dò đo HA hàng ngày, tái khám sau 2 tuần.',
                    citations: [],
                    confidence: 90
                }
            });
            break;
        }

        case 'inventory_forecast': {
            res.status(200).json({
                success: true,
                data: {
                    forecast: 'Dự báo tiêu thụ ổn định cho các nhóm thuốc tim mạch và tiểu đường trong tháng tới.'
                }
            });
            break;
        }

        case 'queue_prediction': {
            res.status(200).json({
                success: true,
                data: {
                    predictedWaitTimeMin: 15,
                    reason: 'Số lượng bệnh nhân chờ thấp và năng suất phòng khám hiện tại ổn định.'
                }
            });
            break;
        }

        default: {
            res.status(200).json({
                success: true,
                data: {}
            });
        }
    }
});

// 3. POST /api/ai/symptom-check — AI gợi ý chẩn đoán dựa trên triệu chứng
router.post('/symptom-check', (req: Request, res: Response) => {
    const { symptoms = '' } = req.body;
    const lower = symptoms.toLowerCase();

    const diagnoses: any[] = [];
    const suggestedLabs: any[] = [];

    if (lower.includes('đau đầu') || lower.includes('chóng mặt')) {
        diagnoses.push({
            id: 'diag_1',
            type: 'diagnosis',
            icdCode: 'I10',
            icdDescription: 'Bệnh tăng huyết áp vô căn (nguyên phát)',
            matchingSymptoms: ['đau đầu', 'chóng mặt'],
            excludeSymptoms: [],
            suggestedLabs: ['ecg', 'biochem'],
            confidence: 85,
            citations: [
                {
                    id: 'c_sc_1',
                    source: 'Quyết định 3192/QĐ-BYT',
                    section: 'Phần chẩn đoán',
                    excerpt: 'Chẩn đoán tăng huyết áp xác định khi HA tâm thu >= 140 mmHg và/hoặc HA tâm trương >= 90 mmHg đo tại phòng khám.',
                    evidenceLevel: 'BYT_VN',
                    reference: 'BYT 2022'
                }
            ]
        });
        suggestedLabs.push(
            { id: 'ecg', labName: 'Điện tâm đồ (ECG)', reason: 'Tầm soát biến chứng tim mạch do tăng huyết áp', priority: 'necessary', relatedDiagnosis: 'Bệnh tăng huyết áp vô căn' },
            { id: 'biochem', labName: 'Sinh hoá máu (Glucose, Creatinine, Lipid panel)', reason: 'Kiểm tra đường huyết, chức năng thận và mỡ máu nền', priority: 'necessary', relatedDiagnosis: 'Bệnh tăng huyết áp vô căn' }
        );
    } else {
        diagnoses.push({
            id: 'diag_generic',
            type: 'diagnosis',
            icdCode: 'Z00.0',
            icdDescription: 'Khám kiểm tra sức khoẻ chung',
            matchingSymptoms: [],
            excludeSymptoms: [],
            suggestedLabs: ['blood'],
            confidence: 70,
            citations: []
        });
        suggestedLabs.push({
            id: 'blood',
            labName: 'Tổng phân tích tế bào máu ngoại vi (CBC)',
            reason: 'Kiểm tra công thức máu cơ bản',
            priority: 'necessary',
            relatedDiagnosis: 'Khám sức khỏe chung'
        });
    }

    res.status(200).json({
        success: true,
        data: {
            diagnoses,
            suggestedLabs,
            citations: diagnoses[0]?.citations || []
        }
    });
});

// 4. POST /api/ai/chat — Trò chuyện AI Copilot
router.post('/chat', (req: Request, res: Response) => {
    const { message = '' } = req.body;
    res.status(200).json({
        success: true,
        data: {
            message: `Chào bác sĩ! Tôi đã nhận thông tin câu hỏi: "${message}". Đây là câu trả lời trợ lý ảo: Hệ thống gợi ý kiểm tra hồ sơ lâm sàng và tuân thủ điều trị của bệnh nhân.`,
            citations: [],
            confidence: 90
        }
    });
});

// 5. GET /api/ai/logs — Logs hoạt động AI (admin)
router.get('/logs', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: []
    });
});

// 6. GET /api/ai/preferences/:doctorId — Lấy tuỳ chọn cấu hình AI
router.get('/preferences/:doctorId', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: {
            enableExamSuggestions: true,
            enableAutoSymptomAnalysis: true,
            enableDashboardBriefing: true,
            enableDrugInteractionCheck: true,
            confidenceThreshold: 60,
            enableSessionMemory: true,
            enableAutoNotes: true,
            enableAmbientEngine: true,
            enableProactiveAlerts: true,
            enableVoiceInput: false,
            enableSmartSearch: true,
            enableAdaptiveUI: true,
            enableGamification: false
        }
    });
});

// 7. PUT /api/ai/preferences/:doctorId — Cập nhật cấu hình AI
router.put('/preferences/:doctorId', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Cập nhật cấu hình AI thành công.'
    });
});

export default router;
