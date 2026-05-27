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
    version:        '1.0.2',
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

    // ── Resolve slug → internal ID ─────────────────────────────────────────────

    private async resolveId(slug: string): Promise<string> {
        // First try scraping the manga page __NEXT_DATA__
        const request  = App.createRequest({ url: `${BASE_URL}/${slug}`, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text())
            const pp       = nextData?.props?.pageProps ?? {}
            const manga    = pp?.manga ?? pp?.title ?? pp?.comic ?? pp?.series
            if (manga?.id) return manga.id as string

            for (const val of Object.values(pp)) {
                const v = val as any
                if (v && typeof v === 'object' && v.slug === slug && v.id) {
                    return v.id as string
                }
            }
        } catch { /* fall through */ }

        // Fallback: search API with shortened slug
        const shortQuery = slug.split('-').slice(0, 4).join(' ')
        const searchReq  = App.createRequest({
            url:    `${API_URL}/titles/search?q=${encodeURIComponent(shortQuery)}&limit=20`,
            method: 'GET',
        })
        const searchRes = await this.requestManager.schedule(searchReq, 1)
        const json      = JSON.parse(searchRes.data as string)
        const items     = json?.data?.items ?? []
        const match     = items.find((i: any) => i.slug === slug)
        if (match) return match.id as string

        throw new Error(`Could not resolve ID for slug: ${slug}`)
    }

    // ── Manga Details ──────────────────────────────────────────────────────────

    override async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const shortQuery = mangaId.split('-').slice(0, 4).join(' ')
        const searchReq  = App.createRequest({
            url:    `${API_URL}/titles/search?q=${encodeURIComponent(shortQuery)}&limit=20`,
            method: 'GET',
        })
        const searchRes = await this.requestManager.schedule(searchReq, 1)
        const json      = JSON.parse(searchRes.data as string)
        const items     = json?.data?.items ?? []
        const details   = items.find((i: any) => i.slug === mangaId) ?? items[0] ?? {}

        const title  = details?.name ?? mangaId
        const cover  = details?.cover ?? ''
        const desc   = details?.summary ?? ''
        const status = (details?.status ?? '').toLowerCase().includes('completed') ? '1' : '0'

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
                author: '',
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
            const urlParts  = (item.url as string).replace(/^\//, '').split('/')
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

        chapters.sort((a, b) => a.chapNum - b.chapNum)
        chapters.forEach((ch, i) => { ch.sortingIndex = i })
        return chapters
    }

    // ── Chapter Details ────────────────────────────────────────────────────────

    override async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = App.createRequest({
            url:     `${BASE_URL}/${mangaId}/${chapterId}`,
            method:  'GET',
            headers: { 'Referer': BASE_URL },
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

        const latestReq  = App.createRequest({
            url:    `${API_URL}/titles/search?sort=latest&page=1&limit=24`,
            method: 'GET',
        })
        const latestRes  = await this.requestManager.schedule(latestReq, 1)
        const latestJson = JSON.parse(latestRes.data as string)

        latestSection.items = (latestJson?.data?.items ?? []).map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   item.cover ?? '',
            })
        )
        sectionCallback(latestSection)

        const popReq  = App.createRequest({
            url:    `${API_URL}/titles/search?sort=views&page=1&limit=24`,
            method: 'GET',
        })
        const popRes  = await this.requestManager.schedule(popReq, 1)
        const popJson = JSON.parse(popRes.data as string)

        popularSection.items = (popJson?.data?.items ?? []).map((item: any) =>
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