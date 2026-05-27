import {
    Source,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    SourceInfo,
    PartialSourceManga,
    TagSection,
    Tag,
    HomeSectionType,
    ContentRating,
    SourceIntents,
    SourceManga,
} from '@paperback/types'

// ─── Extension Info ───────────────────────────────────────────────────────────

export const MangaKInfo: SourceInfo = {
    version:        '1.0.0',
    name:           'MangaK',
    icon:           'icon.png',
    author:         'YourName',
    authorWebsite:  'https://github.com/NowHenryReally',
    description:    'Extension for MangaK.io — manga, manhwa, and manhua.',
    contentRating:  ContentRating.MATURE,
    websiteBaseURL: 'https://mangak.io',
    sourceTags:     [],
    intents:        SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS,
}

const BASE_URL = 'https://mangak.io'

interface MangaKItem {
    slug:   string
    name:   string
    cover:  string
    status: string
}

function parseChapterNum(slug: string, fallback: number): number {
    const m = slug.match(/(\d+)(?:-(\d+))?(?!.*\d)/)
    return m ? parseFloat(`${m[1]!}${m[2] ? '.' + m[2] : ''}`) : fallback
}

// ─── Extension Class ──────────────────────────────────────────────────────────

export class MangaK extends Source {

    readonly requestManager = App.createRequestManager({
        requestsPerSecond: 3,
        requestTimeout:    15000,
    })

    override getMangaShareUrl(mangaId: string): string {
        return `${BASE_URL}/${mangaId}`
    }

    // ── Manga Details ──────────────────────────────────────────────────────────

    override async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request = App.createRequest({
            url:    `${BASE_URL}/${mangaId}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        // ↓ Adjust these selectors after inspecting the title page DOM in DevTools
        const titles     = [$('h1.series-title, h1.entry-title').first().text().trim() || mangaId]
        const image      = $('img.series-cover, .thumb img').first().attr('src') ?? ''
        const desc       = $('.series-summary, .summary__content').first().text().trim()
        const author     = $('.author-name, .artist-name').first().text().trim()
        const statusText = $('.status, .series-status').first().text().toLowerCase()
        const status     = statusText.includes('completed') ? '1' : '0'

        const genres: Tag[] = []
        // ↓ Adjust genre selector in DevTools
        $('.genres a, .genre-item').each((_: number, el: any) => {
            const label = $(el).text().trim()
            if (label) genres.push(App.createTag({ id: label.toLowerCase(), label }))
        })

        const tagSections: TagSection[] = genres.length
            ? [App.createTagSection({ id: 'genres', label: 'Genres', tags: genres })]
            : []

        return App.createSourceManga({
            id:        mangaId,
            mangaInfo: App.createMangaInfo({
                titles,
                image,
                desc,
                author,
                status,
                tags: tagSections,
            }),
        })
    }

    // ── Chapter List ───────────────────────────────────────────────────────────

    override async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = App.createRequest({
            url:    `${BASE_URL}/${mangaId}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        const chapters: Chapter[] = []

        // ↓ Adjust selector to match the actual chapter list rows in DevTools
        $('.chapter-list li, .chapters-list .wp-manga-chapter').each(
            (index: number, el: any) => {
                const anchor = $(el).find('a').first()
                const href   = anchor.attr('href') ?? ''
                const name   = anchor.text().trim()

                const chapterId = href
                    .replace(`/${mangaId}/`, '')
                    .replace(/\/$/, '')

                const chapNum = parseChapterNum(chapterId, index + 1)

                // ↓ Adjust date selector if present
                const dateText = $(el).find('.chapter-date, .chapter-time').text().trim()
                const time     = dateText ? new Date(dateText) : new Date()

                if (chapterId) {
                    chapters.push(App.createChapter({
                        id:           chapterId,
                        chapNum,
                        name,
                        langCode:     '🇬🇧',
                        time,
                        sortingIndex: index,
                    }))
                }
            }
        )

        return chapters.reverse()
    }

    // ── Chapter Details ────────────────────────────────────────────────────────
    // CONFIRMED from DOM: images live in #images, plain src, no lazy loading

    override async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = App.createRequest({
            url:    `${BASE_URL}/${mangaId}/${chapterId}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        const pages: string[] = []

        $('#images img').each((_: number, el: any) => {
            const src = ($(el).attr('src') ?? '').trim()
            if (src && !src.startsWith('data:')) pages.push(src)
        })

        return App.createChapterDetails({
            id:      chapterId,
            mangaId,
            pages,
        })
    }

    // ── Search ─────────────────────────────────────────────────────────────────

    override async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1
        const term = encodeURIComponent(query.title ?? '')

        const request = App.createRequest({
            url:    `${BASE_URL}/search?q=${term}&page=${page}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        const results: PartialSourceManga[] = []

        // ↓ Adjust selector to match search result cards in DevTools
        $('.c-tabs-item__content, .search-results .manga-item, .c-image-hover').each(
            (_: number, el: any) => {
                const anchor  = $(el).find('a').first()
                const href    = anchor.attr('href') ?? ''
                const mangaId = href.replace(BASE_URL, '').replace(/^\/|\/$/g, '')
                const title   = $(el).find('.post-title h3, .title').text().trim()
                const image   =
                    $(el).find('img').attr('src') ??
                    $(el).find('img').attr('data-src') ??
                    ''

                if (mangaId && title) {
                    results.push(App.createPartialSourceManga({ mangaId, title, image }))
                }
            }
        )

        const hasNextPage = !!$('a.next, .nav-links .next').length

        return App.createPagedResults({
            results,
            metadata: hasNextPage ? { page: page + 1 } : undefined,
        })
    }

    // ── Home Page Sections ─────────────────────────────────────────────────────

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const latestSection = App.createHomeSection({
            id:                'latest',
            title:             'Latest Updates',
            containsMoreItems: true,
            type:              HomeSectionType.singleRowNormal,
        })
        const popularSection = App.createHomeSection({
            id:                'popular',
            title:             'Trending',
            containsMoreItems: true,
            type:              HomeSectionType.singleRowNormal,
        })

        sectionCallback(latestSection)
        sectionCallback(popularSection)

        const response = await this.requestManager.schedule(
            App.createRequest({ url: `${BASE_URL}/home`, method: 'GET' }),
            1
        )
        const $ = this.cheerio.load(response.data as string)

        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text()) as {
                props: {
                    pageProps: {
                        latest?:       { items: MangaKItem[] }
                        popularItems?: MangaKItem[]
                    }
                }
            }
            const pp = nextData.props.pageProps

            latestSection.items = (pp.latest?.items ?? []).map((item: MangaKItem) =>
                App.createPartialSourceManga({
                    mangaId: item.slug,
                    title:   item.name,
                    image:   item.cover,
                })
            )
            sectionCallback(latestSection)

            popularSection.items = (pp.popularItems ?? []).map((item: MangaKItem) =>
                App.createPartialSourceManga({
                    mangaId: item.slug,
                    title:   item.name,
                    image:   item.cover,
                })
            )
            sectionCallback(popularSection)

        } catch {
            // Fallback HTML scrape
            const items: PartialSourceManga[] = []
            $('article.group').each((_: number, el: any) => {
                const anchor  = $(el).find('a').first()
                const mangaId = (anchor.attr('href') ?? '').replace(/^\/|\/$/g, '')
                const title   = $(el).find('h3').text().trim()
                const image   = $(el).find('img').attr('src') ?? ''
                if (mangaId && title) {
                    items.push(App.createPartialSourceManga({ mangaId, title, image }))
                }
            })
            latestSection.items  = items
            popularSection.items = items
            sectionCallback(latestSection)
            sectionCallback(popularSection)
        }
    }

    // ── View More ──────────────────────────────────────────────────────────────

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1

        const urlMap: Record<string, string> = {
            latest:  `${BASE_URL}/latest?page=${page}`,
            popular: `${BASE_URL}/ranking?page=${page}`,
        }

        const url = urlMap[homepageSectionId]
        if (!url) return App.createPagedResults({ results: [] })

        const response = await this.requestManager.schedule(
            App.createRequest({ url, method: 'GET' }),
            1
        )
        const $ = this.cheerio.load(response.data as string)
        const results: PartialSourceManga[] = []

        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text()) as {
                props: {
                    pageProps: {
                        latest?: { items: MangaKItem[]; pagination?: { has_next: boolean } }
                        items?:  MangaKItem[]
                    }
                }
            }
            const pp    = nextData.props.pageProps
            const items = pp.latest?.items ?? pp.items ?? []

            for (const item of items) {
                results.push(App.createPartialSourceManga({
                    mangaId: item.slug,
                    title:   item.name,
                    image:   item.cover,
                }))
            }

            const hasNext = pp.latest?.pagination?.has_next ?? false
            return App.createPagedResults({
                results,
                metadata: hasNext ? { page: page + 1 } : undefined,
            })

        } catch {
            $('article.group').each((_: number, el: any) => {
                const anchor  = $(el).find('a').first()
                const mangaId = (anchor.attr('href') ?? '').replace(/^\/|\/$/g, '')
                const title   = $(el).find('h3').text().trim()
                const image   = $(el).find('img').attr('src') ?? ''
                if (mangaId && title) {
                    results.push(App.createPartialSourceManga({ mangaId, title, image }))
                }
            })
            return App.createPagedResults({ results })
        }
    }
}