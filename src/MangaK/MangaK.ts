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
    version:        '1.0.11',
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

const BASE_URL  = 'https://mangak.io'
const API_URL   = 'https://api.mangak.io'
const PROXY_URL = 'https://mangak-proxy.stevenlam987.workers.dev'

function parseChapNum(name: string, apiNum: number, fallback: number): number {
    const m = (name ?? '').match(/(\d+(?:\.\d+)?)/)
    return m ? parseFloat(m[1]!) : (apiNum ?? fallback)
}

export class MangaK extends Source {

    readonly requestManager = App.createRequestManager({
        requestsPerSecond: 3,
        requestTimeout:    20000,
    })

    private apiHeaders(): Record<string, string> {
        return {
            'Origin':     BASE_URL,
            'Referer':    BASE_URL + '/',
            'Accept':     'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        }
    }

    private proxyImage(url: string): string {
        if (!url) return url
        return `${PROXY_URL}?url=${encodeURIComponent(url)}`
    }

    override getMangaShareUrl(mangaId: string): string {
        return `${BASE_URL}/${mangaId}`
    }

    private slugToQueries(slug: string): string[] {
        const words        = slug.split('-')
        const longWords    = words.filter(w => w.length > 1)
        return [
            slug.replace(/-/g, ' '),                    // a i doctor
            slug.replace(/-/g, '.'),                    // a.i.doctor
            longWords.join(' '),                        // doctor (skip single-letter words)
            words.slice(0, 4).join(' '),                // first 4 words
            words.slice(0, 2).join(' '),                // first 2 words
            longWords.slice(0, 4).join(' '),            // first 4 long words
        ].filter((q, i, arr) => q.trim() && arr.indexOf(q) === i) // deduplicate
    }

    // ── Resolve slug → internal ID ─────────────────────────────────────────────

    private async resolveId(slug: string): Promise<string> {
        const request  = App.createRequest({ url: `${BASE_URL}/${slug}`, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text())
            const pp       = nextData?.props?.pageProps ?? {}
            if (pp.mangaHsid) return pp.mangaHsid as string
            if (pp.initialManga?.id) return pp.initialManga.id as string
            const manga = pp?.manga ?? pp?.title ?? pp?.comic ?? pp?.series
            if (manga?.id) return manga.id as string
        } catch { /* fall through */ }

        for (const q of this.slugToQueries(slug)) {
            try {
                const searchReq = App.createRequest({
                    url:     `${API_URL}/titles/search?q=${encodeURIComponent(q)}&limit=20`,
                    method:  'GET',
                    headers: this.apiHeaders(),
                })
                const searchRes = await this.requestManager.schedule(searchReq, 1)
                const json      = JSON.parse(searchRes.data as string)
                const items     = json?.data?.items ?? []
                const match     = items.find((i: any) => i.slug === slug)
                if (match) return match.id as string
            } catch { /* try next */ }
        }

        throw new Error(`Could not resolve ID for slug: ${slug}`)
    }

    // ── Manga Details ──────────────────────────────────────────────────────────

    override async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request  = App.createRequest({ url: `${BASE_URL}/${mangaId}`, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        const $        = this.cheerio.load(response.data as string)

        let details: any = {}
        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text())
            details = nextData?.props?.pageProps?.initialManga ?? {}
        } catch { /* fall through */ }

        if (!details.name) {
            for (const q of this.slugToQueries(mangaId)) {
                try {
                    const searchReq = App.createRequest({
                        url:     `${API_URL}/titles/search?q=${encodeURIComponent(q)}&limit=20`,
                        method:  'GET',
                        headers: this.apiHeaders(),
                    })
                    const searchRes = await this.requestManager.schedule(searchReq, 1)
                    const json      = JSON.parse(searchRes.data as string)
                    const items     = json?.data?.items ?? []
                    const match     = items.find((i: any) => i.slug === mangaId)
                    if (match) { details = match; break }
                } catch { /* try next */ }
            }
        }

        const title  = details?.name ?? mangaId
        const cover  = this.proxyImage(details?.cover ?? '')
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
            url:     `${API_URL}/titles/${id}/chapters?cv=0`,
            method:  'GET',
            headers: this.apiHeaders(),
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items: any[] = json?.data?.chapters ?? []

        const chapters: Chapter[] = []

        items.forEach((item: any, index: number) => {
            const urlParts  = (item.url as string).replace(/^\//, '').split('/')
            const slugPart  = urlParts.slice(1).join('/')
            if (!slugPart) return
            const chapterId = `${item.id}|${slugPart}`

            const chapNum = parseChapNum(
                item.name ?? '',
                item.chapter_number,
                index + 1
            )

            chapters.push(App.createChapter({
                id:           chapterId,
                chapNum,
                name:         item.name ?? slugPart,
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
        const parts             = chapterId.split('|')
        const internalChapterId = parts[0]!
        const slugPart          = parts.slice(1).join('|')

        const pageReq = App.createRequest({
            url:    `${BASE_URL}/${mangaId}/${slugPart}`,
            method: 'GET',
        })
        const pageRes = await this.requestManager.schedule(pageReq, 1)
        const $       = this.cheerio.load(pageRes.data as string)

        let images: string[] = []

        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text())
            images = nextData?.props?.pageProps?.initialChapter?.images ?? []
        } catch { /* fall through */ }

        if (images.length === 0) {
            const titleId = await this.resolveId(mangaId)
            const apiReq  = App.createRequest({
                url:     `${API_URL}/titles/${titleId}/chapters/${internalChapterId}`,
                method:  'GET',
                headers: this.apiHeaders(),
            })
            const apiRes = await this.requestManager.schedule(apiReq, 1)
            const json   = JSON.parse(apiRes.data as string)
            images = json?.data?.chapter?.images ?? []
        }

        const pages = images.map((url: string) => this.proxyImage(url))
        return App.createChapterDetails({ id: chapterId, mangaId, pages })
    }

    // ── Search ─────────────────────────────────────────────────────────────────

    override async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1
        const term = encodeURIComponent(query.title ?? '')

        const request = App.createRequest({
            url:     `${API_URL}/titles/search?q=${term}&page=${page}&limit=24`,
            method:  'GET',
            headers: this.apiHeaders(),
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items: any[] = json?.data?.items ?? []

        const results: PartialSourceManga[] = items.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   this.proxyImage(item.cover ?? ''),
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

        const homeReq = App.createRequest({ url: `${BASE_URL}/home`, method: 'GET' })
        const homeRes = await this.requestManager.schedule(homeReq, 1)
        const $home   = this.cheerio.load(homeRes.data as string)

        let latestItems: any[]  = []
        let popularItems: any[] = []

        try {
            const nextData = JSON.parse($home('#__NEXT_DATA__').text())
            const pp       = nextData?.props?.pageProps ?? {}
            latestItems  = pp?.latest?.items ?? []
            popularItems = pp?.popularItems ?? []
        } catch { /* ignore */ }

        if (latestItems.length === 0) {
            try {
                const latestReq = App.createRequest({
                    url:     `${API_URL}/titles/search?sort=latest&page=1&limit=24`,
                    method:  'GET',
                    headers: this.apiHeaders(),
                })
                const latestRes = await this.requestManager.schedule(latestReq, 1)
                latestItems = JSON.parse(latestRes.data as string)?.data?.items ?? []
            } catch { /* ignore */ }
        }

        if (popularItems.length === 0) {
            try {
                const popReq = App.createRequest({
                    url:     `${API_URL}/titles/search?sort=views&page=1&limit=24`,
                    method:  'GET',
                    headers: this.apiHeaders(),
                })
                const popRes = await this.requestManager.schedule(popReq, 1)
                popularItems = JSON.parse(popRes.data as string)?.data?.items ?? []
            } catch { /* ignore */ }
        }

        latestSection.items = latestItems.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   this.proxyImage(item.cover ?? ''),
            })
        )
        sectionCallback(latestSection)

        popularSection.items = popularItems.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   this.proxyImage(item.cover ?? ''),
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
            url:     `${API_URL}/titles/search?sort=${sort}&page=${page}&limit=24`,
            method:  'GET',
            headers: this.apiHeaders(),
        })
        const response = await this.requestManager.schedule(request, 1)
        const json     = JSON.parse(response.data as string)
        const items: any[] = json?.data?.items ?? []

        const results: PartialSourceManga[] = items.map((item: any) =>
            App.createPartialSourceManga({
                mangaId: item.slug,
                title:   item.name,
                image:   this.proxyImage(item.cover ?? ''),
            })
        )

        const hasNext = json?.data?.pagination?.has_next ?? false
        return App.createPagedResults({
            results,
            metadata: hasNext ? { page: page + 1 } : undefined,
        })
    }
}