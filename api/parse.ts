import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a Brazilian financial document parser.
Extract financial data and return ONLY a valid JSON object — no prose, no markdown fences.

Schema:
{
  "docType": "Holerite" | "Nota Fiscal" | "Extrato" | "Comprovante",
  "date": "YYYY-MM-DD",
  "value": number,
  "description": string,
  "summary": string,
  "transactions": [
    {
      "type": "income" | "expense",
      "description": string,
      "amount": number,
      "date": "YYYY-MM-DD",
      "category": "Salário" | "Freelance" | "Moradia" | "Transporte" | "Alimentação" | "Saúde" | "Educação" | "Lazer" | "Assinaturas" | "Roupas" | "Viagem" | "Outros Ganhos" | "Outros",
      "paymentMethod": "credito" | "debito" | "pix" | "dinheiro" | "outro",
      "jarMatch": string | null
    }
  ]
}

Rules:
- Holerite: income transaction = net salary (salário líquido). date = competência month last day.
- Nota Fiscal: expense transaction. category = best match.
- Extrato Mercado Pago: list every debit/credit as a transaction.
  For "Reservas" / savings goal entries set jarMatch = goal name exactly as written.
  paymentMethod = "pix" for Pix, "credito" for cartão crédito, "debito" for débito.
- All amounts in BRL as plain numbers (no R$ symbol).
- Convert Brazilian dates (dd/mm/yyyy) to ISO (YYYY-MM-DD).
- summary: one sentence in Portuguese describing what was found.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileBase64, fileName, mimeType, docType, person } = req.body ?? {};
  if (!fileBase64 || !mimeType) {
    return res.status(400).json({ error: 'Missing fileBase64 or mimeType' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userText = `Parse this ${docType ?? 'document'} uploaded by ${person ?? 'user'}. File: ${fileName ?? 'document'}.`;
  const isImage = (mimeType as string).startsWith('image/');

  const contentBlock: any = isImage
    ? { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileBase64 } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } };

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: userText }] }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON returned by AI');

    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('[parse]', err);
    return res.status(500).json({ error: err?.message ?? 'Parse failed' });
  }
}
