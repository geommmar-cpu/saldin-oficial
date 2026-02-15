export const BANK_DOMAINS: Record<string, string> = {
    nubank: "nubank.com.br",
    inter: "inter.co",
    itau: "itau.com.br",
    bradesco: "bradesco.com.br",
    bb: "bb.com.br",
    "banco do brasil": "bb.com.br",
    santander: "santander.com.br",
    caixa: "caixa.gov.br",
    "c6 bank": "c6bank.com.br",
    c6: "c6bank.com.br",
    btg: "btgpactual.com",
    neon: "neon.com.br",
    original: "original.com.br",
    picpay: "picpay.com",
    "mercado pago": "mercadopago.com.br",
    next: "next.me",
    pan: "bancopan.com.br",
    "pagbank": "pagseguro.uol.com.br",
    "pagseguro": "pagseguro.uol.com.br",
    xp: "xpi.com.br",
    rico: "rico.com.vc",
    will: "willbank.com.br",
    citi: "citibank.com.br",
    safra: "safra.com.br",
    "banrisul": "banrisul.com.br",
    "modalmais": "modalmais.com.br",
    "digio": "digio.com.br",
    "bmg": "bancobmg.com.br",
    "daycoval": "daycoval.com.br",
    "votorantim": "bancovotorantim.com.br",
    "bv": "bv.com.br",
    "uniprime": "uniprime.com.br",
    "sicredi": "sicredi.com.br",
    "sicoob": "sicoob.com.br",
    "ame": "amedigital.com",
    // Subscriptions
    netflix: "netflix.com",
    spotify: "spotify.com",
    disney: "disneyplus.com",
    prime: "amazon.com",
    amazon: "amazon.com",
    hbo: "hbomax.com",
    max: "max.com",
    apple: "apple.com",
    youtube: "youtube.com",
    google: "google.com",
    microsoft: "microsoft.com",
    office: "office.com",
    adobe: "adobe.com",
    canva: "canva.com",
    figma: "figma.com",
    github: "github.com",
    notion: "notion.so",
    zoom: "zoom.us",
    slack: "slack.com",
    discord: "discord.com",
    twitch: "twitch.tv",
    steam: "steampowered.com",
    epic: "epicgames.com",
    psn: "playstation.com",
    playstation: "playstation.com",
    xbox: "xbox.com",
    nintendo: "nintendo.com",
    globo: "globoplay.globo.com",
    globoplay: "globoplay.globo.com",
    deezer: "deezer.com",
    tidal: "tidal.com",
    crunchyroll: "crunchyroll.com",
    paramount: "paramountplus.com",
    star: "starplus.com",
    mercadolivre: "mercadolivre.com.br",
    ifood: "ifood.com.br",
    uber: "uber.com",
    rappi: "rappi.com.br",
    gympass: "gympass.com",
    wellhub: "wellhub.com",
    totalpass: "totalpass.com.br",
    smartfit: "smartfit.com.br",
    bluefit: "bluefit.com.br",
};

export function getBankLogoUrl(name: string): string | null {
    const normalizedName = name.toLowerCase().trim();

    // If it looks like a domain already, use it directly
    if (normalizedName.includes(".") && !normalizedName.includes(" ")) {
        return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${normalizedName}&size=128`;
    }

    let domain = null;
    for (const [key, value] of Object.entries(BANK_DOMAINS)) {
        if (normalizedName.includes(key)) {
            domain = value;
            break;
        }
    }
    if (!domain) return null;
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;
}
