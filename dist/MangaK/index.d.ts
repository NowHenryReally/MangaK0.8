import { Source, Chapter, ChapterDetails, HomeSection, SearchRequest, PagedResults, SourceInfo, SourceManga } from '@paperback/types';
export declare const MangaKInfo: SourceInfo;
export declare class MangaK extends Source {
    readonly requestManager: import("@paperback/types").RequestManager;
    getMangaShareUrl(mangaId: string): string;
    getMangaDetails(mangaId: string): Promise<SourceManga>;
    getChapters(mangaId: string): Promise<Chapter[]>;
    getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails>;
    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults>;
    getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void>;
    getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults>;
}
