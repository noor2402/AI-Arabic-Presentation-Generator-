// app/api/generate/route.ts

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Slide } from "@/lib/types";

function cleanArabic(text: string, allowLatin: boolean = false): string {
  if (!text) return "";
  const pattern = allowLatin
    ? /[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF0-9٠-٩a-zA-Z\s،؛؟!,.:%×\-\(\)\"'«»]/g
    : /[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF0-9٠-٩\s،؛؟!,.:%×\-\(\)\"'«»]/g;
  return text
    .replace(pattern, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// FIX 1: any[] → Record<string, unknown>[] with proper type assertions inside
function cleanSlides(slides: Record<string, unknown>[], allowLatin: boolean = false): Slide[] {
  if (!Array.isArray(slides)) return [];
  return slides.map(slide => {
    // FIX 2: warn when AI returns deprecated 'stats' type so you can catch it during testing
    if (slide.type === 'stats') {
      console.warn(`[cleanSlides] AI returned deprecated type 'stats' for slide id=${slide.id}. Falling back to 'paragraph'.`);
    }

    const leftSide = slide.leftSide as { label?: string; points?: unknown[] } | undefined;
    const rightSide = slide.rightSide as { label?: string; points?: unknown[] } | undefined;

    return {
      id: slide.id as number,
      type: (slide.type === 'stats' || !slide.type)
        ? 'paragraph'
        : slide.type as 'paragraph' | 'bullets' | 'comparison',
      title:    cleanArabic((slide.title    as string) || "بدون عنوان", allowLatin),
      subtitle: cleanArabic((slide.subtitle as string) || "",            allowLatin),
      icon:     (slide.icon as string) || "📄",
      mainText: cleanArabic((slide.mainText as string) || "", allowLatin),
      keyPoints: Array.isArray(slide.keyPoints)
        ? (slide.keyPoints as string[]).map(p => cleanArabic(p, allowLatin))
        : [],
      leftSide: leftSide ? {
        label:  cleanArabic(leftSide.label || "", allowLatin),
        points: Array.isArray(leftSide.points)
          ? (leftSide.points as string[]).map(p => cleanArabic(p, allowLatin))
          : [],
      } : undefined,
      rightSide: rightSide ? {
        label:  cleanArabic(rightSide.label || "", allowLatin),
        points: Array.isArray(rightSide.points)
          ? (rightSide.points as string[]).map(p => cleanArabic(p, allowLatin))
          : [],
      } : undefined,
      imageUrl: undefined,
    };
  });
}

// FIX 3: usedPhotoIds is now a parameter — no module-level shared state between requests
async function fetchPexelsImage(query: string, usedPhotoIds: Set<number>): Promise<string | null> {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const photos: { id: number; src: { large: string } }[] = data.photos || [];
    const uniquePhoto = photos.find(p => !usedPhotoIds.has(p.id));
    if (!uniquePhoto) return photos[0]?.src?.large || null;

    usedPhotoIds.add(uniquePhoto.id);
    return uniquePhoto.src.large;
  } catch {
    return null;
  }
}

async function translateForSearch(groq: Groq, arabicTitle: string, topic: string): Promise<string> {
  try {
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 30,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "Translate the Arabic slide title to a short 2-3 word English search query for finding a relevant professional photo. Reply with ONLY the English words, nothing else.",
        },
        { role: "user", content: `Topic: ${topic}\nSlide title: ${arabicTitle}` },
      ],
    });
    return result.choices[0]?.message?.content?.trim() || topic;
  } catch {
    return topic;
  }
}

// FIX 4a: usedPhotoIds is now local (per-request scope, zero cross-request bleed)
// FIX 4b: sequential for...of instead of Promise.all — avoids simultaneous Pexels rate limit hits
async function attachPexelsImages(groq: Groq, slides: Slide[], topic: string): Promise<Slide[]> {
  const usedPhotoIds = new Set<number>();
  const updated: Slide[] = [];

  for (const slide of slides) {
    if (slide.type !== 'paragraph') {
      updated.push(slide);
      continue;
    }
    const searchQuery = await translateForSearch(groq, slide.title, topic);
    const imageUrl    = await fetchPexelsImage(searchQuery, usedPhotoIds);
    updated.push({ ...slide, imageUrl: imageUrl || undefined });
  }

  return updated;
}

// FIX 5: wrapped in try/catch — a Groq failure now surfaces a clear Arabic error
async function generateRichEnglish(groq: Groq, topic: string, numSlides: number): Promise<string> {
  try {
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 6000,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `You are an elite subject matter expert and institutional consultant. Write an intellectually rigorous, analytically layered research report. Avoid repetition or generic padding. Structure ideas logically.`,
        },
        {
          role: "user",
          content: `Write a comprehensive, authoritative research report about: "${topic}".
CRITICAL RULES:
1. ABSOLUTELY NO NUMBERS, NO PERCENTAGES, NO STATISTICS, NO DATES, NO CURRENCY. Rely entirely on qualitative analysis, strategic concepts, and theoretical frameworks.
2. Divide the report into exactly ${numSlides} distinct, non-overlapping sections. Each section must explore a completely different dimension of the topic.
Write at least ${numSlides * 250} words.`,
        },
      ],
    });
    return result.choices[0]?.message?.content || "";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    throw new Error(`فشل في توليد المحتوى الإنجليزي: ${message}`);
  }
}

async function structureAndTranslate(
  groq: Groq,
  englishContent: string,
  topic: string,
  numSlides: number,
  selectedTheme: string,
) {
  // FIX 6: replaced "teal" (doesn't exist in lib/themes.ts) with "maroon"
  const themeInstruction =
    selectedTheme !== "auto"
      ? `Use theme: "${selectedTheme}"`
      : `Choose the most fitting theme: blue (government/national strategy), green (environment/sustainability), purple (education/culture), orange (business/innovation), maroon (technology/research/general)`;

  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 7000,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `أنت كاتب أكاديمي وخبير في صياغة المحتوى المؤسسي باللغة العربية الفصحى الرسمية الراقية مع خبره تصل الى عشرين عام، عروضك وتنسيقك يساوي 500-1000 دولار.

════ شروط مطلقة ════
1. يجب أن تكون جميع المعلومات دقيقة وموثوقة، ويُمنع استخدام أي معلومة غير مؤكدة.
2. النصوص تُكتب بالعربية الفصحى بأسلوب احترافي جذاب، مناسب للعرض أمام لجان أكاديمية.
3. يمنع استخدام أي حرف لاتيني أو لغة إنجليزية.
4. **يُمنع منعاً باتاً إنشاء شريحة "مراجع" أو "مصادر"**.
5. **يُمنع منعاً باتاً استخدام الأرقام أو النسب المئوية أو الإحصائيات أو التواريخ أو المبالغ المالية**. ركّز حصرياً على التحليل النوعي والمفاهيم الاستراتيجية.
6. **التنويع اللغوي**: لا تكرر نفس الجملة أو العبارة. استخدم مفردات عربية غنية ومتنوعة.
7. **التمييز الصارم بين المفاهيم**:
   - "الفرص/الإيجابيات": هي ظروف خارجية أو إمكانيات مستقبلية.
   - "التوصيات": هي إجراءات إدارية أو تقنية داخلية محددة وقابلة للتنفيذ (تبدأ بأفعال مثل: إنشاء، اعتماد، تطوير، تفعيل).
8. **التفرد العالمي (Global Uniqueness)**: يجب أن تكون كل نقطة في كل شريحة فريدة بنسبة 100%. يُمنع منعاً باتاً نسخ أو تكرار نفس النقاط في شرائح مختلفة (مثلاً: لا يمكن أن تتطابق نقاط "الفرص" مع نقاط "التوصيات" أو "التحديات" أبداً).

════ تعليمات تقسيم الشرائح ════
- يجب تقسيم البحث إلى عدد شرائح يساوي بالضبط (${numSlides}).
- تنويع أنواع الشرائح (type) — ثلاثة أنواع فقط مسموح بها:
  • 'paragraph': شرائح تحليلية سردية عميقة (mainText من 75–90 كلمة).
  • 'bullets': عرض ركائز أو نقاط رئيسية مركزة (4 عناصر في keyPoints، كل عنصر 20–30 كلمة).
  • 'comparison': عند الحاجة إلى مقارنة بين جانبين (لا تقل عن 4 نقاط في كل جانب).
- يُمنع منعاً باتاً استخدام نوع 'stats' أو أي نوع آخر.

THEME: ${themeInstruction}`,
      },
      {
        role: "user",
        content: `باستخدام البحث الإنجليزي أدناه، أنشئ بالضبط ${numSlides} شريحة عربية احترافية ومتنوعة عن: "${topic}"
البحث المصدر:
${englishContent}

أعد JSON فقط بهذا الهيكل تماماً:
{
  "correctedTopic": "الموضوع بالعربية الفصحى الفصيحة",
  "theme": "blue",
  "slides": [
    {
      "id": 1,
      "type": "paragraph أو bullets أو comparison فقط",
      "title": "عنوان الشريحة المحدد والمبتكر",
      "subtitle": "عنوان فرعي يضيف سياقاً جديداً",
      "icon": "⚙️",
      "mainText": "يستخدم في حال كان النوع paragraph فقط",
      "keyPoints": ["تستخدم في حال كان النوع bullets فقط"],
      "leftSide": { "label": "عنوان الجانب الأول", "points": ["نقطة 1", "نقطة 2", "نقطة 3", "نقطة 4"] },
      "rightSide": { "label": "عنوان الجانب الثاني", "points": ["نقطة 1", "نقطة 2", "نقطة 3", "نقطة 4"] }
    }
  ]
}`,
      },
    ],
  });
  return result.choices[0]?.message?.content || "";
}

async function structureFromContent(
  groq: Groq,
  content: string,
  numSlides: number,
  selectedTheme: string,
) {
  const themeInstruction =
    selectedTheme !== "auto"
      ? `استخدم الثيم: "${selectedTheme}"`
      : `اختر الثيم الأنسب: blue (حكومي/استراتيجي)، green (بيئة/استدامة)، purple (تعليم/ثقافة)، orange (أعمال/ابتكار)، maroon (عام/مؤسسي)`;

  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 7000,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `أنت كاتب أكاديمي وخبير في صياغة المحتوى المؤسسي باللغة العربية الفصحى مع خبرة تصل لعشرون عام، ومتخصص أيضاً في إعادة هيكلة التقارير والنصوص الجاهزة.

════ شروط مطلقة ════
1. مصدر معلوماتك الوحيد هو "النص المصدر" في رسالة المستخدم. يُمنع منعاً باتاً إضافة أي معلومة أو حقيقة أو مثال أو فكرة غير موجودة فيه أو غير مستنتجة منطقياً منه مباشرة.
2. **فهم السياق - المتحدث والجمهور**: حدد طبيعة النص المصدر. من هم الجمهور ومن المتحدث. وحدد اللغة والاسلوب الانسب حسب كل حالة واتبعه بناءا على خبرتك.
3. تجاهل العناصر الشكلية للتقرير المكتوب التي لا تصلح كمحتوى لشريحة عرض (مثل حقول التوقيع، التاريخ في نهاية النموذج، رؤوس وتذييلات الصفحات)، إلا إذا كانت جزءاً جوهرياً من الرسالة.
4. إن كان النص المصدر مكتوباً بالعربية، أعد هيكلته وتنظيمه وحسّن صياغته مباشرة بالعربية الفصحى دون أي ترجمة أو تغيير في المعنى. إن كان مكتوباً بالإنجليزية أو بأي لغة أخرى غير العربية، ترجمه أولاً ترجمة دقيقة واحترافية إلى العربية الفصحى، ثم أعد هيكلته.
5. **الأسماء والمصطلحات التقنية**: أسماء البرامج والأدوات والمنصات والمؤسسات والأشخاص المكتوبة بالإنجليزية في النص المصدر، إن لم يكن لها ترجمة او مرادف مناسب باللغة العربية. تُكتب كما هي بحروفها الإنجليزية الأصلية ضمن الجملة العربية بين علامات تنصيص او قول ""، ولا تُترجم ولا تُحذف ولا تُستبدل بعبارات عامة.
6. إن كان النص المصدر قصيراً ولا يكفي بمفرده لتغطية ${numSlides} شريحة بمحتوى غني ومتفرد، أنشئ عدد شرائح أقل (3 على الأقل) يغطي فعلياً المحتوى الموجود، بدلاً من تكرار نفس الأفكار أو إضافة حشو وعبارات عامة.
7. إن وردت أرقام أو نسب أو تواريخ أو إحصائيات في النص المصدر، احتفظ بها كما هي بدقة تامة. يُمنع إضافة أي رقم غير مذكور في المصدر، ويُمنع حذف الأرقام الموجودة فيه.
8. النصوص بالعربية الفصحى الرسمية الراقية، مناسبة لعرض أمام لجان أكاديمية أو مؤسسية.
9. **يُمنع منعاً باتاً إنشاء شريحة "مراجع" أو "مصادر"**.
10. **التفرد العالمي**: كل نقطة في كل شريحة فريدة بنسبة 100٪، بدون تكرار بين الشرائح. يُمنع تكرار نفس الجملة أو الفكرة بصياغات مختلفة في أكثر من شريحة.
11. يُمنع كتابة عبارات حشو عامة لا تحمل معلومة محددة. كل جملة يجب أن تحمل تفصيلاً ملموساً مأخوذاً من النص المصدر.
12. يرجى العلم ان كل عرض سوف يعرض امام اشخاص حقيقيون متخصصون ولغتهم الم هي العربية، كما ان هذا العرض جزء من وظيفة او عمل يقدر بالالاف الدولارات.
════ تعليمات تقسيم الشرائح ════
- قسّم محتوى النص المصدر إلى ${numSlides} شريحة كحد أقصى (وأقل إن لزم حسب القاعدة 6)، كل شريحة تغطي جزءاً متمايزاً منه بترتيب منطقي.
- الأنواع المسموحة فقط:
  • 'paragraph': mainText من 75-90 كلمة.
  • 'bullets': 4 عناصر في keyPoints، كل عنصر 20-30 كلمة.
  • 'comparison': فقط إذا كان النص المصدر يقارن فعلياً بين عنصرين؛ لا تقل عن 4 نقاط في كل جانب.

THEME: ${themeInstruction}`,
      },
      {
        role: "user",
        content: `النص المصدر:
"""
${content}
"""

أعد JSON فقط بهذا الهيكل تماماً:
{
  "correctedTopic": "عنوان قصير من 3 إلى 6 كلمات يعكس طبيعة التقرير (مثال: تقرير تقدم التدريب)، يُستخدم فقط كحل احتياطي في حال لم يدخل المستخدم اسم للعرض",
  "theme": "blue",
  "slides": [
    {
      "id": 1,
      "type": "paragraph أو bullets أو comparison فقط",
      "title": "عنوان الشريحة",
      "subtitle": "عنوان فرعي",
      "icon": "⚙️",
      "mainText": "يستخدم في حال كان النوع paragraph فقط",
      "keyPoints": ["تستخدم في حال كان النوع bullets فقط"],
      "leftSide": { "label": "عنوان الجانب الأول", "points": ["1","2","3","4"] },
      "rightSide": { "label": "عنوان الجانب الثاني", "points": ["1","2","3","4"] }
    }
  ]
}`,
      },
    ],
  });
  return result.choices[0]?.message?.content || "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, numSlides, selectedTheme = "auto", reportContent } = body;

    const hasReportContent = !!reportContent?.trim();
    const hasTopic        = !!topic?.trim();

    if (!hasReportContent && !hasTopic) {
      return NextResponse.json(
        { error: "يرجى إدخال عنوان العرض أو نص التقرير." },
        { status: 400 },
      );
    }
    if (hasReportContent && reportContent.length > 20000) {
      return NextResponse.json(
        { error: "نص التقرير طويل جداً (الحد الأقصى ~20000 حرف)." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح API الخاص بـ Groq مفقود في الخادم." },
        { status: 401 },
      );
    }

    const groq = new Groq({ apiKey });

    const isEnglishTopic = hasTopic && /[a-zA-Z]/.test(topic);

    let titleInstruction = "";
    if (hasTopic) {
      titleInstruction = isEnglishTopic
        ? `المستخدم أدخل عنواناً باللغة الإنجليزية وهو: "${topic}". يجب عليك ترجمته حرفياً واحترافياً إلى العربية الفصحى وضعه في حقل correctedTopic.`
        : `المستخدم أدخل عنواناً بالعربية وهو: "${topic}". ثبت هذا العنوان كما هو أو حسّن صياغته الأكاديمية فقط وضعه في حقل correctedTopic.`;
    } else {
      titleInstruction = `المستخدم لم يدخل عنواناً. قم باستخراج عنوان احترافي وبليغ للعرض التقديمي من واقع النص المصدر وضعه في حقل correctedTopic.`;
    }

    let structuredRaw: string;
    if (hasReportContent) {
      structuredRaw = await structureFromContent(
        groq,
        `${titleInstruction}\n\nالنص المصدر:\n${reportContent}`,
        numSlides,
        selectedTheme,
      );
    } else {
      structuredRaw = await structureAndTranslate(
        groq,
        await generateRichEnglish(groq, topic, numSlides),
        topic,
        numSlides,
        selectedTheme,
      );
    }

    const startIdx = structuredRaw.indexOf('{');
    const endIdx   = structuredRaw.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("لم يتم العثور على هيكل JSON صالح في استجابة الذكاء الاصطناعي.");
    }

    const cleanText = structuredRaw.substring(startIdx, endIdx + 1).trim();
    const parsed    = JSON.parse(cleanText);

    if (selectedTheme !== "auto") parsed.theme = selectedTheme;
    parsed.slides = Array.isArray(parsed.slides) ? parsed.slides.slice(0, numSlides) : [];

    let finalTopic: string;
    if (hasTopic) {
      finalTopic = isEnglishTopic ? (parsed.correctedTopic || topic) : topic;
    } else {
      finalTopic = parsed.correctedTopic || "عرض تقديمي بدون عنوان";
    }

    parsed.correctedTopic = cleanArabic(finalTopic, true);
    parsed.slides         = cleanSlides(parsed.slides, hasReportContent);
    parsed.slides         = await attachPexelsImages(groq, parsed.slides, parsed.correctedTopic || topic);

    return NextResponse.json({ result: parsed }, { status: 200 });

  } catch (error: unknown) {
    // FIX 7: error: any → error: unknown with proper type narrowing
    const message = error instanceof Error
      ? error.message
      : "حدث خطأ داخلي أثناء معالجة البيانات.";
    console.error("API route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}