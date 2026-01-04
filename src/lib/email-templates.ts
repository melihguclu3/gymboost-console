export function getEmailTemplate(title: string, message: string, code?: string, link?: string, linkText?: string) {
    return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; padding: 40px 20px; color: #ffffff; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="margin-bottom: 30px;">
                <h1 style="color: #f97316; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">GYMBOOST</h1>
                <div style="width: 40px; height: 2px; background: #f97316; margin: 10px auto;"></div>
            </div>
            
            <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">${title}</h2>
            
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 30px; font-weight: 500;">
                ${message}
            </p>

            ${code ? `
                <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                    <h1 style="color: #f97316; letter-spacing: 8px; font-size: 36px; font-weight: 900; margin: 0; font-family: monospace;">${code}</h1>
                </div>
            ` : ''}

            ${link ? `
                <a href="${link}" style="display: inline-block; background: linear-gradient(to right, #ea580c, #dc2626); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);">
                    ${linkText || 'DEVAM ET'}
                </a>
            ` : ''}

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #27272a;">
                <p style="font-size: 11px; color: #52525b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
                    Bu işlem sizin tarafınızdan yapılmadıysa lütfen bu e-postayı dikkate almayın.
                </p>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <p style="font-size: 10px; color: #3f3f46; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">
                © 2026 GYMBOOST APP • TÜM HAKLARI SAKLIDIR
            </p>
        </div>
    </div>
    `;
}