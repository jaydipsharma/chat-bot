import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse-fork';
import { prisma } from '../../../../../lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);

  if (!parsed.text) {
    return NextResponse.json({ error: 'Empty or unreadable PDF' }, { status: 400 });
  }

  // Save to DB
  const doc = await prisma.document.create({
    data: {
      name: file.name,
      content: parsed.text,
    },
  });

  return NextResponse.json({
    message: 'PDF uploaded and saved',
    id: doc.id,
    preview: parsed.text.slice(0, 200),
  });
}
