import axios from 'axios';

function parseSOAP(rawText: string, citations: any[]): any {
    const lines = rawText.split('\n');

    const sections: Record<string, string[]> = {
        subjective: [],
        objective: [],
        assessment: [],
        plan: [],
    };

    // Section label patterns (Vietnamese + English)
    const sectionPatterns: [string, RegExp][] = [
        ['subjective', /^(S|Subjective|Chủ quan|Bệnh sử|Lý do khám)\s*[:\-]/i],
        ['objective', /^(O|Objective|Khách quan|Khám|Sinh hiệu)\s*[:\-]/i],
        ['assessment', /^(A|Assessment|Đánh giá|Chẩn đoán)\s*[:\-]/i],
        ['plan', /^(P|Plan|Kế hoạch|Điều trị)\s*[:\-]/i],
    ];

    let currentSection: string | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let matched = false;
        for (const [section, pattern] of sectionPatterns) {
            if (pattern.test(trimmed)) {
                currentSection = section;
                // Include text after the colon on the same line
                const afterColon = trimmed.replace(pattern, '').replace(/^[\s:\-]+/, '');
                if (afterColon) sections[section].push(afterColon);
                matched = true;
                break;
            }
        }

        if (!matched && currentSection) {
            sections[currentSection].push(trimmed);
        }
    }

    // Fallback: if parsing failed, dump raw text into assessment
    const hasContent = Object.values(sections).some((v) => v.length > 0);
    if (!hasContent) {
        sections.assessment.push(rawText);
    }

    return {
        subjective: sections.subjective.join('\n'),
        objective: sections.objective.join('\n'),
        assessment: sections.assessment.join('\n'),
        plan: sections.plan.join('\n'),
        rawText,
        citations,
    };
}

const testAI = async () => {
    try {
        console.log('Sending request to /api/ai/analyze...');
        const res = await axios.post('http://localhost:3000/api/ai/analyze', {
            type: 'session_notes',
            vitals: { bloodPressure: '120/80', heartRate: '80' },
            symptoms: 'đau đầu',
            diagnosis: 'tăng huyết áp',
            icdCode: 'I10',
            treatment: 'nghỉ ngơi',
            medications: [],
            format: 'SOAP'
        });
        
        const responseData = (res.data as any)?.data ?? res.data;
        const data = responseData as any;
        const rawText = data.message ?? data.content ?? data.text ?? '';
        console.log('Raw text length:', rawText.length);
        console.log('Raw text:', JSON.stringify(rawText));

        const parsed = parseSOAP(rawText, []);
        console.log('Parsed:', JSON.stringify(parsed, null, 2));

    } catch (err: any) {
        console.error('Error:', err.message);
    }
};

testAI();
