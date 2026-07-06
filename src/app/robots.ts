export default function robots() {
    return {
        rules: { userAgent: '*', allow: '/', disallow: ['/workspaces/', '/dashboard/'] },
        sitemap: 'https://mannabooks.co.ke/sitemap.xml',
    };
}
