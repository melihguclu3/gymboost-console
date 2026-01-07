import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisRequest, AIAnalysisResponse } from '@/types';

export const dynamic = 'force-dynamic';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json();
    const { type, data } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let systemPrompt = '';
    let contextData: Record<string, unknown> = {};

    if (type === 'platform') {
      systemPrompt = `Sen GymBoost platformunun süper yönetici AI asistanısın.

## GÖREV
Platform genelinde performans analizi yap. Tüm salonları, üyeleri, gelirleri değerlendir.

## ANALİZ ODAKLARI
1. GELİR TRENDLERİ: Aylık/haftalık değişimler, salon bazlı karşılaştırmalar
2. ÜYE BÜYÜMESI: Yeni kayıtlar, kayıp oranları, aktiflik durumu
3. UYARILAR: Kritik sorunlar, düşük performanslı salonlar
4. FIRSATLAR: Büyüme potansiyeli, iyileştirme önerileri

## FORMAT
JSON olarak cevap ver:
{
  "analysis": "Genel platform durumu özeti (2-3 cümle)",
  "insights": ["Bulgu 1", "Bulgu 2", "Bulgu 3"],
  "recommendations": ["Öneri 1", "Öneri 2", "Öneri 3"]
}`;

      // Fetch platform data
      const [gymsResult, membersResult, paymentsResult] = await Promise.all([
        supabase.from('gyms').select('id, name, settings').order('created_at'),
        supabase.from('users').select('id, gym_id, status, created_at', { count: 'exact' }).eq('role', 'member'),
        supabase.from('payments').select('amount, gym_id, created_at').eq('status', 'completed').gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
      ]);

      contextData = {
        totalGyms: gymsResult.data?.length || 0,
        totalMembers: membersResult.count || 0,
        activeMembers: membersResult.data?.filter(m => m.status === 'active').length || 0,
        monthlyRevenue: paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        ...data // Include any additional data passed from frontend
      };

    } else if (type === 'health') {
      systemPrompt = `Sen GymBoost platformunun sistem sağlığı AI asistanısın.

## GÖREV
Sistem performansını, hata loglarını ve servis durumunu analiz et.

## ANALİZ ODAKLARI
1. GECİKME ANALİZİ: API yanıt süreleri, trend değişimleri
2. HATA ORANLARI: Kritik hatalar, tekrar eden sorunlar
3. SERVİS DURUMU: Veritabanı, auth, storage, harici API'ler
4. STABİLİTE: 7 günlük trend, uptime yüzdesi

## FORMAT
JSON olarak cevap ver:
{
  "analysis": "Sistem durumu özeti (2-3 cümle)",
  "insights": ["Bulgu 1", "Bulgu 2", "Bulgu 3"],
  "recommendations": ["Öneri 1", "Öneri 2", "Öneri 3"]
}`;

      // Fetch system health data
      const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      const [logsResult, errorCountResult] = await Promise.all([
        supabase.from('system_logs').select('event_type, message, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('system_logs').select('id', { count: 'exact' }).eq('event_type', 'error').gte('created_at', sevenDaysAgo)
      ]);

      const totalLogs = logsResult.data?.length || 0;
      const errorCount = errorCountResult.count || 0;
      const errorRate = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(2) : 0;

      contextData = {
        errorRate: `${errorRate}%`,
        totalErrors7d: errorCount,
        recentLogs: logsResult.data?.slice(0, 10).map(l => ({ type: l.event_type, message: l.message })),
        ...data // Include latency data, uptime etc from frontend
      };
    }

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nVERİ:\n${JSON.stringify(contextData, null, 2)}` }]
        }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json'
        }
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error('Gemini API Error');
    }

    const result = await geminiResponse.json();
    let aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Clean markdown if present
    const jsonMatch = aiText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) aiText = jsonMatch[1];

    const parsed = JSON.parse(aiText);

    return NextResponse.json({
      success: true,
      analysis: parsed.analysis || 'Analiz tamamlandı.',
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || []
    } as AIAnalysisResponse);

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({
      success: false,
      analysis: '',
      insights: [],
      recommendations: [],
      error: error.message || 'Analiz sırasında hata oluştu.'
    } as AIAnalysisResponse, { status: 500 });
  }
}
