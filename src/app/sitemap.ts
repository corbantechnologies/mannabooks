// src/app/sitemap.ts
import { INDUSTRIES_DATA } from "@/lib/data/industries";

export default function sitemap() {
    const baseUrls = [
        { url: 'https://mannabooks.co.ke', lastModified: new Date() },
        { url: 'https://mannabooks.co.ke/features', lastModified: new Date() },
        { url: 'https://mannabooks.co.ke/pricing', lastModified: new Date() },
        { url: 'https://mannabooks.co.ke/industries', lastModified: new Date() },
        { url: 'https://mannabooks.co.ke/use-cases', lastModified: new Date() },
        { url: 'https://mannabooks.co.ke/guide', lastModified: new Date() },
        { url: 'https://mannabooks.co.ke/contact', lastModified: new Date() },
    ];

    const industryUrls = INDUSTRIES_DATA.map((ind) => ({
        url: `https://mannabooks.co.ke/industries/${ind.slug}`,
        lastModified: new Date(),
    }));

    return [...baseUrls, ...industryUrls];
}
