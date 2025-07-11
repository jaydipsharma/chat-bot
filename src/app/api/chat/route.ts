export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse-fork";

// export async function POST(req: Request) {
//     const { message } = await req.json();

//     if (!message || typeof message !== "string") {
//       return NextResponse.json({ error: "Invalid input" }, { status: 400 });
//     }

//     const pdfPath = path.join(process.cwd(), "files", "profiles.pdf");

//     const fileExists = fs.existsSync(pdfPath);
//     // return NextResponse.json({ message: fileExists, pdfPath }, { status: 200 });
//     if (!fileExists) {
//       return NextResponse.json({ error: "PDF file not found" }, { status: 404 });
//     }

//        let pdfData;
//     try {
//       const buffer = fs.readFileSync(pdfPath);
//       pdfData = await pdfParse(buffer);
//     } catch (err) {
//       console.error("❌ Error reading or parsing PDF:", err);
//       return NextResponse.json({ error: "Error processing PDF" }, { status: 500 });
//     }

//     if (!pdfData?.text || pdfData.text.trim().length === 0) {
//       return NextResponse.json({ error: "PDF has no readable text" }, { status: 400 });
//     }

//     if (!pdfData?.text || pdfData.text.trim().length === 0) {
//       return NextResponse.json(
//         {
//           error: "PDF contains no readable text (possibly scanned/image-only).",
//         },
//         { status: 400 }
//       );
//     }
//     // ✅ Build prompt
//     //   const limitedText = pdfData.text.slice(0, 16000); // Token-safe
//     const prompt = `
// You are a helpful assistant. Use only the following document to answer the user's question.
// If the answer is not in the document, say: "Sorry, I couldn't find that in the document."

// Document:
// """
// ${pdfData.text.slice(0, 16000)}
// """

// User: ${message}
// Bot:
// `;

//     const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyD0TDC3seWnixxf5dM1UPHfx_gwJ98xEvk`;

//     // ✅ Call Gemini
//     let geminiRes;
//     try {
//       geminiRes = await fetch(geminiURL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [
//             {
//               role: "user",
//               parts: [{ text: prompt }],
//             },
//           ],
//         }),
//       });
//     } catch (err) {
//       console.error("❌ Network/API error:", err);
//       return NextResponse.json(
//         { error: "Failed to call Gemini API. Check network or API key." },
//         { status: 500 }
//       );
//     }

//     const data = await geminiRes.json();

//     if (!geminiRes.ok) {
//       console.error("❌ Gemini API Error:", data);
//       return NextResponse.json(
//         {
//           error:
//             data?.error?.message ||
//             data?.message ||
//             "Something went wrong with Gemini API",
//         },
//         { status: 500 }
//       );
//     }

//     const text =
//       data.candidates?.[0]?.content?.parts?.[0]?.text ||
//       "No response from Gemini";

//     return NextResponse.json({
//       response: text,
//     //   info: {
//     //     pdfPath,
//     //     pdfTextLength: pdfData.text.length,
//     //     fileSize: fileBuffer.length,
//     //   },
//     });
// }

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 });
    }

    const pdfPath = path.join(process.cwd(), 'files', 'profiles.pdf');

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    let text: string;
    try {
      const buffer = fs.readFileSync(pdfPath);
      const result = await pdfParse(buffer);
      text = result.text;
    } catch (err) {
      console.error('PDF parsing error:', err);
      return NextResponse.json({ error: 'Error reading or parsing PDF' }, { status: 500 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'PDF contains no readable text' }, { status: 400 });
    }

    // Build prompt for Gemini
    const limitedText = text.slice(0, 16000); // Token-safe
    const prompt = `
You are a helpful assistant. Use only the following document to answer the user's question.
If the answer is not in the document, say: "Sorry, I couldn't find that in the document."

Document:
"""
${limitedText}
"""

User: ${message}
Bot:
`;

    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // Call Gemini API
    let geminiRes;
    try {
      geminiRes = await fetch(geminiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
    } catch (err) {
      console.error("❌ Network/API error:", err);
      return NextResponse.json(
        { error: "Failed to call Gemini API. Check network or API key." },
        { status: 500 }
      );
    }

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("❌ Gemini API Error:", data);
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.message ||
            "Something went wrong with Gemini API",
        },
        { status: 500 }
      );
    }

    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    return NextResponse.json({
      response: responseText,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
