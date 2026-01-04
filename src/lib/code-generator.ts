export function generateTimeBasedCode(gymId: string, timestamp: number = Date.now()): string {
    // 30 saniyelik zaman dilimi
    const timeBlock = Math.floor(timestamp / 30000);
    const input = `${gymId}:${timeBlock}`;

    // Basit bir hash fonksiyonu (DJB2 benzeri)
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i); /* hash * 33 + c */
    }

    // Pozitif yap ve 6 haneli sayıya çevir
    const code = (Math.abs(hash) % 1000000).toString().padStart(6, '0');

    // Okunabilirlik için araya boşluk koy: "123 456"
    return `${code.substring(0, 3)} ${code.substring(3)}`;
}

export function verifyTimeBasedCode(gymId: string, code: string): boolean {
    const cleanCode = code.replace(/\s/g, '');
    const now = Date.now();

    // Şu anki ve bir önceki zaman dilimini kontrol et (ağ gecikmesi için tolerans)
    const currentCode = generateTimeBasedCode(gymId, now).replace(/\s/g, '');
    const prevCode = generateTimeBasedCode(gymId, now - 30000).replace(/\s/g, '');

    return cleanCode === currentCode || cleanCode === prevCode;
}
