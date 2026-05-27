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

export const MangaKInfo: SourceInfo = {
    version:        '1.0.1',
    name:           'MangaK',
    icon:           'icon.png',
    author:         'NowHenryReally',
    authorWebsite:  'https://github.com/NowHenryReally',
    description:    'Extension for MangaK.io — manga, manhwa, and manhua.',
    contentRating:  ContentRating.MATURE,
    websiteBaseURL: 'https://mangak.io',
    sourceTags:     [],
    intents:        SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS,
}

const BASE_URL = 'https://mangak.io'
const API_URL  = 'https://api.mangak.io'

export class MangaK extends Source {

    readonly requestManager = App.createRequestManager({
        requestsPerSecond: 3,
        requestTimeout:    15000,
    })

    override getMangaShareUrl(mangaId: string): string {
        return `${BASE_URL}/${mangaId}`
    }

    // Resolve slug to internal ID via search API
    private async resolveId(slug: string): Promise<string> {
        const request = App.createRequest({
            url:    `${API_URL}/titles/search?q=${encodeURIComponent(slug)}&limit=5`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items    = json?.data?.items ?? []
        // Find exact slug match
        const match = items.find((i: any) => i.slug === slug) ?? items[0]
        if (!match) throw new Error(`Could not resolve ID for slug: ${slug}`)
        return match.id as string
    }

    // ── Manga Details ──────────────────────────────────────────────────────────

    override async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const id      = await this.resolveId(mangaId)
        const request = App.createRequest({
            url:    `${API_URL}/meta/manga/${id}`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const data     = json?.data ?? {}

        // Also fetch from HTML for cover/desc fallback
        const htmlReq  = App.createRequest({ url: `${BASE_URL}/${mangaId}`, method: 'GET' })
        const htmlRes  = await this.requestManager.schedule(htmlReq, 1)
        const $        = this.cheerio.load(htmlRes.data as string)

        let nextData: any = {}
        try {
            nextData = JSON.parse($('#__NEXT_DATA__').text())
        } catch { /* ignore */ }

        // Try to get manga info from __NEXT_DATA__ on the manga page
        const pp      = nextData?.props?.pageProps ?? {}
        const details = pp?.manga ?? pp?.title ?? data

        const title  = details?.name  ?? details?.title  ?? mangaId
        const cover  = details?.cover ?? details?.image  ?? ''
        const desc   = details?.summary ?? details?.description ?? ''
        const status = (details?.status ?? '').toLowerCase().includes('completed') ? '1' : '0'
        const author = details?.author ?? ''

        const genres: Tag[] = (details?.genres ?? []).map((g: any) => {
            const label = typeof g === 'string' ? g : (g.name ?? '')
            return App.createTag({ id: label.toLowerCase(), label })
        })

        const tagSections: TagSection[] = genres.length
            ? [App.createTagSection({ id: 'genres', label: 'Genres', tags: genres })]
            : []

        return App.createSourceManga({
            id:        mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title],
                image:  cover,
                desc,
                author,
                status,
                tags:   tagSections,
            }),
        })
    }

    // ── Chapter List ───────────────────────────────────────────────────────────

    override async getChapters(mangaId: string): Promise<Chapter[]> {
        const id      = await this.resolveId(mangaId)
        const request = App.createRequest({
            url:    `${API_URL}/titles/${id}/chapters?cv=0`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items: any[] = json?.data?.chapters ?? []

        const chapters: Chapter[] = []

        items.forEach((item: any, index: number) => {
            // url is like /eleceed/chapter-403 or /eleceed/special-396-5-special
            const urlParts  = (item.url as string).replace(/^\//, '').split('/')
            // chapterId is everything after the manga slug
            const chapterId = urlParts.slice(1).join('/')
            if (!chapterId) return

            const chapNum = typeof item.chapter_number === 'number'
                ? item.chapter_number
                : index + 1

            chapters.push(App.createChapter({
                id:           chapterId,
                chapNum,
                name:         item.name ?? chapterId,
                langCode:     '🇬🇧',
                time:         item.updated_at ? new Date(item.updated_at) : new Date(),
                sortingIndex: index,
            }))
        })

        return chapters
    }

    // ── Chapter Details ────────────────────────────────────────────────────────

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
            url:    `${API_URL}/titles/search?q=${term}&page=${page}&limit=24`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items: any[] = json?.data?.items ?? []

        const results: PartialSourceManga[] = items.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   item.cover ?? '',
            })
        )

        const pagination = json?.data?.pagination ?? {}
        const hasNext    = pagination.has_next ?? false

        return App.createPagedResults({
            results,
            metadata: hasNext ? { page: page + 1 } : undefined,
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

        // Latest
        const latestReq = App.createRequest({
            url:    `${API_URL}/titles/search?sort=latest&page=1&limit=24`,
            method: 'GET',
        })
        const latestRes  = await this.requestManager.schedule(latestReq, 1)
        const latestJson = JSON.parse(latestRes.data as string)
        const latestItems: any[] = latestJson?.data?.items ?? []

        latestSection.items = latestItems.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   item.cover ?? '',
            })
        )
        sectionCallback(latestSection)

        // Popular/Trending
        const popReq = App.createRequest({
            url:    `${API_URL}/titles/search?sort=views&page=1&limit=24`,
            method: 'GET',
        })
        const popRes  = await this.requestManager.schedule(popReq, 1)
        const popJson = JSON.parse(popRes.data as string)
        const popItems: any[] = popJson?.data?.items ?? []

        popularSection.items = popItems.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   item.cover ?? '',
            })
        )
        sectionCallback(popularSection)
    }

    // ── View More ──────────────────────────────────────────────────────────────

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1

        const sortMap: Record<string, string> = {
            latest:  'latest',
            popular: 'views',
        }
        const sort = sortMap[homepageSectionId] ?? 'latest'

        const request = App.createRequest({
            url:    `${API_URL}/titles/search?sort=${sort}&page=${page}&limit=24`,
            method: 'GET',
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items: any[] = json?.data?.items ?? []

        const results: PartialSourceManga[] = items.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   item.cover ?? '',
            })
        )

        const hasNext = json?.data?.pagination?.has_next ?? false
        return App.createPagedResults({
            results,
            metadata: hasNext ? { page: page + 1 } : undefined,
        })
    }
}