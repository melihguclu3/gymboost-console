export async function sendResendEmail(to: string, subject: string, html: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        console.error('RESEND_API_KEY veya RESEND_FROM_EMAIL tanımlı değil.');
        return { ok: false, error: 'E-posta servisi yapılandırılmamış.' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to,
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            console.error('Resend Error:', body);
            return { ok: false, error: `E-posta gönderilemedi.` };
        }

        return { ok: true };
    } catch (error) {
        console.error('Resend Fetch Error:', error);
        return { ok: false, error: 'E-posta servisine erişilemedi.' };
    }
}
