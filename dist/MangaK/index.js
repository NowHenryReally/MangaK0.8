"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaK = exports.MangaKInfo = void 0;
const types_1 = require("@paperback/types");
// ─── Extension Info ───────────────────────────────────────────────────────────
exports.MangaKInfo = {
    version: '1.0.0',
    name: 'MangaK',
    icon: 'icon.png',
    author: 'YourName',
    authorWebsite: 'https://github.com/NowHenryReally',
    description: 'Extension for MangaK.io — manga, manhwa, and manhua.',
    contentRating: types_1.ContentRating.MATURE,
    websiteBaseURL: 'https://mangak.io',
    sourceTags: [],
    intents: types_1.SourceIntents.MANGA_CHAPTERS | types_1.SourceIntents.HOMEPAGE_SECTIONS,
};
const BASE_URL = 'https://mangak.io';
function parseChapterNum(slug, fallback) {
    const m = slug.match(/(\d+)(?:-(\d+))?(?!.*\d)/);
    return m ? parseFloat(`${m[1]}${m[2] ? '.' + m[2] : ''}`) : fallback;
}
// ─── Extension Class ──────────────────────────────────────────────────────────
class MangaK extends types_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 15000,
        });
    }
    getMangaShareUrl(mangaId) {
        return `${BASE_URL}/${mangaId}`;
    }
    // ── Manga Details ──────────────────────────────────────────────────────────
    async getMangaDetails(mangaId) {
        const request = App.createRequest({
            url: `${BASE_URL}/${mangaId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        // ↓ Adjust these selectors after inspecting the title page DOM in DevTools
        const titles = [$('h1.series-title, h1.entry-title').first().text().trim() || mangaId];
        const image = $('img.series-cover, .thumb img').first().attr('src') ?? '';
        const desc = $('.series-summary, .summary__content').first().text().trim();
        const author = $('.author-name, .artist-name').first().text().trim();
        const statusText = $('.status, .series-status').first().text().toLowerCase();
        const status = statusText.includes('completed') ? '1' : '0';
        const genres = [];
        // ↓ Adjust genre selector in DevTools
        $('.genres a, .genre-item').each((_, el) => {
            const label = $(el).text().trim();
            if (label)
                genres.push(App.createTag({ id: label.toLowerCase(), label }));
        });
        const tagSections = genres.length
            ? [App.createTagSection({ id: 'genres', label: 'Genres', tags: genres })]
            : [];
        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles,
                image,
                desc,
                author,
                status,
                tags: tagSections,
            }),
        });
    }
    // ── Chapter List ───────────────────────────────────────────────────────────
    async getChapters(mangaId) {
        const request = App.createRequest({
            url: `${BASE_URL}/${mangaId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters = [];
        // ↓ Adjust selector to match the actual chapter list rows in DevTools
        $('.chapter-list li, .chapters-list .wp-manga-chapter').each((index, el) => {
            const anchor = $(el).find('a').first();
            const href = anchor.attr('href') ?? '';
            const name = anchor.text().trim();
            const chapterId = href
                .replace(`/${mangaId}/`, '')
                .replace(/\/$/, '');
            const chapNum = parseChapterNum(chapterId, index + 1);
            // ↓ Adjust date selector if present
            const dateText = $(el).find('.chapter-date, .chapter-time').text().trim();
            const time = dateText ? new Date(dateText) : new Date();
            if (chapterId) {
                chapters.push(App.createChapter({
                    id: chapterId,
                    chapNum,
                    name,
                    langCode: '🇬🇧',
                    time,
                    sortingIndex: index,
                }));
            }
        });
        return chapters.reverse();
    }
    // ── Chapter Details ────────────────────────────────────────────────────────
    // CONFIRMED from DOM: images live in #images, plain src, no lazy loading
    async getChapterDetails(mangaId, chapterId) {
        const request = App.createRequest({
            url: `${BASE_URL}/${mangaId}/${chapterId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const pages = [];
        $('#images img').each((_, el) => {
            const src = ($(el).attr('src') ?? '').trim();
            if (src && !src.startsWith('data:'))
                pages.push(src);
        });
        return App.createChapterDetails({
            id: chapterId,
            mangaId,
            pages,
        });
    }
    // ── Search ─────────────────────────────────────────────────────────────────
    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const term = encodeURIComponent(query.title ?? '');
        const request = App.createRequest({
            url: `${BASE_URL}/search?q=${term}&page=${page}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const results = [];
        // ↓ Adjust selector to match search result cards in DevTools
        $('.c-tabs-item__content, .search-results .manga-item, .c-image-hover').each((_, el) => {
            const anchor = $(el).find('a').first();
            const href = anchor.attr('href') ?? '';
            const mangaId = href.replace(BASE_URL, '').replace(/^\/|\/$/g, '');
            const title = $(el).find('.post-title h3, .title').text().trim();
            const image = $(el).find('img').attr('src') ??
                $(el).find('img').attr('data-src') ??
                '';
            if (mangaId && title) {
                results.push(App.createPartialSourceManga({ mangaId, title, image }));
            }
        });
        const hasNextPage = !!$('a.next, .nav-links .next').length;
        return App.createPagedResults({
            results,
            metadata: hasNextPage ? { page: page + 1 } : undefined,
        });
    }
    // ── Home Page Sections ─────────────────────────────────────────────────────
    async getHomePageSections(sectionCallback) {
        const latestSection = App.createHomeSection({
            id: 'latest',
            title: 'Latest Updates',
            containsMoreItems: true,
            type: types_1.HomeSectionType.singleRowNormal,
        });
        const popularSection = App.createHomeSection({
            id: 'popular',
            title: 'Trending',
            containsMoreItems: true,
            type: types_1.HomeSectionType.singleRowNormal,
        });
        sectionCallback(latestSection);
        sectionCallback(popularSection);
        const response = await this.requestManager.schedule(App.createRequest({ url: `${BASE_URL}/home`, method: 'GET' }), 1);
        const $ = this.cheerio.load(response.data);
        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text());
            const pp = nextData.props.pageProps;
            latestSection.items = (pp.latest?.items ?? []).map((item) => App.createPartialSourceManga({
                mangaId: item.slug,
                title: item.name,
                image: item.cover,
            }));
            sectionCallback(latestSection);
            popularSection.items = (pp.popularItems ?? []).map((item) => App.createPartialSourceManga({
                mangaId: item.slug,
                title: item.name,
                image: item.cover,
            }));
            sectionCallback(popularSection);
        }
        catch {
            // Fallback HTML scrape
            const items = [];
            $('article.group').each((_, el) => {
                const anchor = $(el).find('a').first();
                const mangaId = (anchor.attr('href') ?? '').replace(/^\/|\/$/g, '');
                const title = $(el).find('h3').text().trim();
                const image = $(el).find('img').attr('src') ?? '';
                if (mangaId && title) {
                    items.push(App.createPartialSourceManga({ mangaId, title, image }));
                }
            });
            latestSection.items = items;
            popularSection.items = items;
            sectionCallback(latestSection);
            sectionCallback(popularSection);
        }
    }
    // ── View More ──────────────────────────────────────────────────────────────
    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        const urlMap = {
            latest: `${BASE_URL}/latest?page=${page}`,
            popular: `${BASE_URL}/ranking?page=${page}`,
        };
        const url = urlMap[homepageSectionId];
        if (!url)
            return App.createPagedResults({ results: [] });
        const response = await this.requestManager.schedule(App.createRequest({ url, method: 'GET' }), 1);
        const $ = this.cheerio.load(response.data);
        const results = [];
        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text());
            const pp = nextData.props.pageProps;
            const items = pp.latest?.items ?? pp.items ?? [];
            for (const item of items) {
                results.push(App.createPartialSourceManga({
                    mangaId: item.slug,
                    title: item.name,
                    image: item.cover,
                }));
            }
            const hasNext = pp.latest?.pagination?.has_next ?? false;
            return App.createPagedResults({
                results,
                metadata: hasNext ? { page: page + 1 } : undefined,
            });
        }
        catch {
            $('article.group').each((_, el) => {
                const anchor = $(el).find('a').first();
                const mangaId = (anchor.attr('href') ?? '').replace(/^\/|\/$/g, '');
                const title = $(el).find('h3').text().trim();
                const image = $(el).find('img').attr('src') ?? '';
                if (mangaId && title) {
                    results.push(App.createPartialSourceManga({ mangaId, title, image }));
                }
            });
            return App.createPagedResults({ results });
        }
    }
}
exports.MangaK = MangaK;
//# sourceMappingURL=index.js.map