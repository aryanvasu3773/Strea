// ── Connection test ───────────────────────────────────────────────────────────
async function testConnection(url) {
    try {
        // Test connection directly to the AnikotoTV URL
        const response = await axios_1.default.get(url, {
            timeout: 8_000,
        });

        // axios exposes the final URL after any redirects (e.g., http to https upgrade)
        const finalUrl = response.request?.res?.responseUrl;
        let resolvedUrl = url;
        if (finalUrl) {
            const parsed = new URL(finalUrl);
            resolvedUrl = `${parsed.protocol}//${parsed.host}`;
        }
        return { ok: true, resolvedUrl };
    }
    catch {
        return { ok: false, resolvedUrl: url };
    }
}
