(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeColor = void 0;
var BadgeColor;
(function (BadgeColor) {
    BadgeColor["BLUE"] = "default";
    BadgeColor["GREEN"] = "success";
    BadgeColor["GREY"] = "info";
    BadgeColor["YELLOW"] = "warning";
    BadgeColor["RED"] = "danger";
})(BadgeColor = exports.BadgeColor || (exports.BadgeColor = {}));

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],5:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
/**
* @deprecated Use {@link PaperbackExtensionBase}
*/
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    async getTags() {
        // @ts-ignore
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = exports.SourceIntents = void 0;
var SourceIntents;
(function (SourceIntents) {
    SourceIntents[SourceIntents["MANGA_CHAPTERS"] = 1] = "MANGA_CHAPTERS";
    SourceIntents[SourceIntents["MANGA_TRACKING"] = 2] = "MANGA_TRACKING";
    SourceIntents[SourceIntents["HOMEPAGE_SECTIONS"] = 4] = "HOMEPAGE_SECTIONS";
    SourceIntents[SourceIntents["COLLECTION_MANAGEMENT"] = 8] = "COLLECTION_MANAGEMENT";
    SourceIntents[SourceIntents["CLOUDFLARE_BYPASS_REQUIRED"] = 16] = "CLOUDFLARE_BYPASS_REQUIRED";
    SourceIntents[SourceIntents["SETTINGS_UI"] = 32] = "SETTINGS_UI";
})(SourceIntents = exports.SourceIntents || (exports.SourceIntents = {}));
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],7:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./ByteArray"), exports);
__exportStar(require("./Badge"), exports);
__exportStar(require("./interfaces"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./HomeSectionType"), exports);
__exportStar(require("./PaperbackExtensionBase"), exports);

},{"./Badge":1,"./ByteArray":2,"./HomeSectionType":3,"./PaperbackExtensionBase":4,"./Source":5,"./SourceInfo":6,"./interfaces":15}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],15:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./ChapterProviding"), exports);
__exportStar(require("./CloudflareBypassRequestProviding"), exports);
__exportStar(require("./HomePageSectionsProviding"), exports);
__exportStar(require("./MangaProgressProviding"), exports);
__exportStar(require("./MangaProviding"), exports);
__exportStar(require("./RequestManagerProviding"), exports);
__exportStar(require("./SearchResultsProviding"), exports);

},{"./ChapterProviding":8,"./CloudflareBypassRequestProviding":9,"./HomePageSectionsProviding":10,"./MangaProgressProviding":11,"./MangaProviding":12,"./RequestManagerProviding":13,"./SearchResultsProviding":14}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],60:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./DynamicUI/Exports/DUIBinding"), exports);
__exportStar(require("./DynamicUI/Exports/DUIForm"), exports);
__exportStar(require("./DynamicUI/Exports/DUIFormRow"), exports);
__exportStar(require("./DynamicUI/Exports/DUISection"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIButton"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIHeader"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIInputField"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUILabel"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUILink"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIMultilineLabel"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUINavigationButton"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIOAuthButton"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUISecureInputField"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUISelect"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUIStepper"), exports);
__exportStar(require("./DynamicUI/Rows/Exports/DUISwitch"), exports);
__exportStar(require("./Exports/ChapterDetails"), exports);
__exportStar(require("./Exports/Chapter"), exports);
__exportStar(require("./Exports/Cookie"), exports);
__exportStar(require("./Exports/HomeSection"), exports);
__exportStar(require("./Exports/IconText"), exports);
__exportStar(require("./Exports/MangaInfo"), exports);
__exportStar(require("./Exports/MangaProgress"), exports);
__exportStar(require("./Exports/PartialSourceManga"), exports);
__exportStar(require("./Exports/MangaUpdates"), exports);
__exportStar(require("./Exports/PBCanvas"), exports);
__exportStar(require("./Exports/PBImage"), exports);
__exportStar(require("./Exports/PagedResults"), exports);
__exportStar(require("./Exports/RawData"), exports);
__exportStar(require("./Exports/Request"), exports);
__exportStar(require("./Exports/SourceInterceptor"), exports);
__exportStar(require("./Exports/RequestManager"), exports);
__exportStar(require("./Exports/Response"), exports);
__exportStar(require("./Exports/SearchField"), exports);
__exportStar(require("./Exports/SearchRequest"), exports);
__exportStar(require("./Exports/SourceCookieStore"), exports);
__exportStar(require("./Exports/SourceManga"), exports);
__exportStar(require("./Exports/SecureStateManager"), exports);
__exportStar(require("./Exports/SourceStateManager"), exports);
__exportStar(require("./Exports/Tag"), exports);
__exportStar(require("./Exports/TagSection"), exports);
__exportStar(require("./Exports/TrackedMangaChapterReadAction"), exports);
__exportStar(require("./Exports/TrackerActionQueue"), exports);

},{"./DynamicUI/Exports/DUIBinding":17,"./DynamicUI/Exports/DUIForm":18,"./DynamicUI/Exports/DUIFormRow":19,"./DynamicUI/Exports/DUISection":20,"./DynamicUI/Rows/Exports/DUIButton":21,"./DynamicUI/Rows/Exports/DUIHeader":22,"./DynamicUI/Rows/Exports/DUIInputField":23,"./DynamicUI/Rows/Exports/DUILabel":24,"./DynamicUI/Rows/Exports/DUILink":25,"./DynamicUI/Rows/Exports/DUIMultilineLabel":26,"./DynamicUI/Rows/Exports/DUINavigationButton":27,"./DynamicUI/Rows/Exports/DUIOAuthButton":28,"./DynamicUI/Rows/Exports/DUISecureInputField":29,"./DynamicUI/Rows/Exports/DUISelect":30,"./DynamicUI/Rows/Exports/DUIStepper":31,"./DynamicUI/Rows/Exports/DUISwitch":32,"./Exports/Chapter":33,"./Exports/ChapterDetails":34,"./Exports/Cookie":35,"./Exports/HomeSection":36,"./Exports/IconText":37,"./Exports/MangaInfo":38,"./Exports/MangaProgress":39,"./Exports/MangaUpdates":40,"./Exports/PBCanvas":41,"./Exports/PBImage":42,"./Exports/PagedResults":43,"./Exports/PartialSourceManga":44,"./Exports/RawData":45,"./Exports/Request":46,"./Exports/RequestManager":47,"./Exports/Response":48,"./Exports/SearchField":49,"./Exports/SearchRequest":50,"./Exports/SecureStateManager":51,"./Exports/SourceCookieStore":52,"./Exports/SourceInterceptor":53,"./Exports/SourceManga":54,"./Exports/SourceStateManager":55,"./Exports/Tag":56,"./Exports/TagSection":57,"./Exports/TrackedMangaChapterReadAction":58,"./Exports/TrackerActionQueue":59}],61:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./generated/_exports"), exports);
__exportStar(require("./base/index"), exports);
__exportStar(require("./compat/DyamicUI"), exports);

},{"./base/index":7,"./compat/DyamicUI":16,"./generated/_exports":60}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaK = exports.MangaKInfo = void 0;
const types_1 = require("@paperback/types");
exports.MangaKInfo = {
    version: '1.0.4',
    name: 'MangaK',
    icon: 'icon.png',
    author: 'NowHenryReally',
    authorWebsite: 'https://github.com/NowHenryReally',
    description: 'Extension for MangaK.io — manga, manhwa, and manhua.',
    contentRating: types_1.ContentRating.MATURE,
    websiteBaseURL: 'https://mangak.io',
    sourceTags: [],
    intents: types_1.SourceIntents.MANGA_CHAPTERS | types_1.SourceIntents.HOMEPAGE_SECTIONS,
};
const BASE_URL = 'https://mangak.io';
const API_URL = 'https://api.mangak.io';
class MangaK extends types_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 20000,
        });
    }
    apiHeaders() {
        return {
            'Origin': BASE_URL,
            'Referer': BASE_URL + '/',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        };
    }
    getMangaShareUrl(mangaId) {
        return `${BASE_URL}/${mangaId}`;
    }
    // ── Resolve slug → internal ID ─────────────────────────────────────────────
    async resolveId(slug) {
        const request = App.createRequest({ url: `${BASE_URL}/${slug}`, method: 'GET' });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text());
            const pp = nextData?.props?.pageProps ?? {};
            if (pp.mangaHsid)
                return pp.mangaHsid;
            if (pp.initialManga?.id)
                return pp.initialManga.id;
            const manga = pp?.manga ?? pp?.title ?? pp?.comic ?? pp?.series;
            if (manga?.id)
                return manga.id;
        }
        catch { /* fall through */ }
        const shortQuery = slug.split('-').slice(0, 4).join(' ');
        const searchReq = App.createRequest({
            url: `${API_URL}/titles/search?q=${encodeURIComponent(shortQuery)}&limit=20`,
            method: 'GET',
            headers: this.apiHeaders(),
        });
        const searchRes = await this.requestManager.schedule(searchReq, 1);
        const json = JSON.parse(searchRes.data);
        const items = json?.data?.items ?? [];
        const match = items.find((i) => i.slug === slug);
        if (match)
            return match.id;
        throw new Error(`Could not resolve ID for slug: ${slug}`);
    }
    // ── Manga Details ──────────────────────────────────────────────────────────
    async getMangaDetails(mangaId) {
        // Scrape manga page directly — initialManga in __NEXT_DATA__ has everything
        const request = App.createRequest({ url: `${BASE_URL}/${mangaId}`, method: 'GET' });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        let details = {};
        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text());
            details = nextData?.props?.pageProps?.initialManga ?? {};
        }
        catch { /* fall through */ }
        // Fallback to search API if initialManga not found
        if (!details.name) {
            const shortQuery = mangaId.split('-').slice(0, 4).join(' ');
            const searchReq = App.createRequest({
                url: `${API_URL}/titles/search?q=${encodeURIComponent(shortQuery)}&limit=20`,
                method: 'GET',
                headers: this.apiHeaders(),
            });
            const searchRes = await this.requestManager.schedule(searchReq, 1);
            const json = JSON.parse(searchRes.data);
            const items = json?.data?.items ?? [];
            details = items.find((i) => i.slug === mangaId) ?? items[0] ?? {};
        }
        const title = details?.name ?? mangaId;
        const cover = details?.cover ?? '';
        const desc = details?.summary ?? details?.description ?? '';
        const status = (details?.status ?? '').toLowerCase().includes('completed') ? '1' : '0';
        const author = details?.author ?? '';
        const genres = (details?.genres ?? []).map((g) => {
            const label = typeof g === 'string' ? g : (g.name ?? '');
            return App.createTag({ id: label.toLowerCase(), label });
        });
        const tagSections = genres.length
            ? [App.createTagSection({ id: 'genres', label: 'Genres', tags: genres })]
            : [];
        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title],
                image: cover,
                desc,
                author,
                status,
                tags: tagSections,
            }),
        });
    }
    // ── Chapter List ───────────────────────────────────────────────────────────
    async getChapters(mangaId) {
        const id = await this.resolveId(mangaId);
        const request = App.createRequest({
            url: `${API_URL}/titles/${id}/chapters?cv=0`,
            method: 'GET',
            headers: this.apiHeaders(),
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = JSON.parse(response.data);
        const items = json?.data?.chapters ?? [];
        const chapters = [];
        items.forEach((item, index) => {
            const urlParts = item.url.replace(/^\//, '').split('/');
            const slugPart = urlParts.slice(1).join('/');
            if (!slugPart)
                return;
            // Store internal ID and slug separated by | so getChapterDetails can use both
            const chapterId = `${item.id}|${slugPart}`;
            const chapNum = typeof item.chapter_number === 'number'
                ? item.chapter_number
                : index + 1;
            chapters.push(App.createChapter({
                id: chapterId,
                chapNum,
                name: item.name ?? slugPart,
                langCode: '🇬🇧',
                time: item.updated_at ? new Date(item.updated_at) : new Date(),
                sortingIndex: index,
            }));
        });
        chapters.sort((a, b) => a.chapNum - b.chapNum);
        chapters.forEach((ch, i) => { ch.sortingIndex = i; });
        return chapters;
    }
    // ── Chapter Details ────────────────────────────────────────────────────────
    async getChapterDetails(mangaId, chapterId) {
        const parts = chapterId.split('|');
        const internalChapterId = parts[0];
        const slugPart = parts.slice(1).join('|');
        // Try scraping __NEXT_DATA__ from chapter page first
        const pageReq = App.createRequest({
            url: `${BASE_URL}/${mangaId}/${slugPart}`,
            method: 'GET',
        });
        const pageRes = await this.requestManager.schedule(pageReq, 1);
        const $ = this.cheerio.load(pageRes.data);
        let images = [];
        try {
            const nextData = JSON.parse($('#__NEXT_DATA__').text());
            images = nextData?.props?.pageProps?.initialChapter?.images ?? [];
        }
        catch { /* fall through */ }
        // Fallback: use API
        if (images.length === 0) {
            const titleId = await this.resolveId(mangaId);
            const apiReq = App.createRequest({
                url: `${API_URL}/titles/${titleId}/chapters/${internalChapterId}`,
                method: 'GET',
                headers: this.apiHeaders(),
            });
            const apiRes = await this.requestManager.schedule(apiReq, 1);
            const json = JSON.parse(apiRes.data);
            images = json?.data?.chapter?.images ?? [];
        }
        // Paperback 0.8 supports setting image request headers via App.createRequestObject
        // Wrap each image URL with a Referer header
        const pages = images.map((url) => App.createRequestObject({
            url,
            method: 'GET',
            headers: { 'Referer': BASE_URL + '/' },
        }));
        return App.createChapterDetails({
            id: chapterId,
            mangaId,
            pages: pages,
        });
    }
    // ── Search ─────────────────────────────────────────────────────────────────
    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const term = encodeURIComponent(query.title ?? '');
        const request = App.createRequest({
            url: `${API_URL}/titles/search?q=${term}&page=${page}&limit=24`,
            method: 'GET',
            headers: this.apiHeaders(),
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = JSON.parse(response.data);
        const items = json?.data?.items ?? [];
        const results = items.map((item) => App.createPartialSourceManga({
            mangaId: item.slug,
            title: item.name,
            image: item.cover ?? '',
        }));
        const pagination = json?.data?.pagination ?? {};
        const hasNext = pagination.has_next ?? false;
        return App.createPagedResults({
            results,
            metadata: hasNext ? { page: page + 1 } : undefined,
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
        // Fallback: scrape homepage __NEXT_DATA__ if API unreachable
        const homeReq = App.createRequest({ url: `${BASE_URL}/home`, method: 'GET' });
        const homeRes = await this.requestManager.schedule(homeReq, 1);
        const homeHtml = homeRes.data;
        const $home = this.cheerio.load(homeHtml);
        let latestItems = [];
        let popularItems = [];
        try {
            const nextData = JSON.parse($home('#__NEXT_DATA__').text());
            const pp = nextData?.props?.pageProps ?? {};
            latestItems = pp?.latest?.items ?? [];
            popularItems = pp?.popularItems ?? [];
        }
        catch { /* ignore */ }
        // Try API for latest if scrape failed
        if (latestItems.length === 0) {
            try {
                const latestReq = App.createRequest({
                    url: `${API_URL}/titles/search?sort=latest&page=1&limit=24`,
                    method: 'GET',
                    headers: this.apiHeaders(),
                });
                const latestRes = await this.requestManager.schedule(latestReq, 1);
                const latestJson = JSON.parse(latestRes.data);
                latestItems = latestJson?.data?.items ?? [];
            }
            catch { /* ignore */ }
        }
        // Try API for popular if scrape failed
        if (popularItems.length === 0) {
            try {
                const popReq = App.createRequest({
                    url: `${API_URL}/titles/search?sort=views&page=1&limit=24`,
                    method: 'GET',
                    headers: this.apiHeaders(),
                });
                const popRes = await this.requestManager.schedule(popReq, 1);
                const popJson = JSON.parse(popRes.data);
                popularItems = popJson?.data?.items ?? [];
            }
            catch { /* ignore */ }
        }
        latestSection.items = latestItems.map((item) => App.createPartialSourceManga({
            mangaId: item.slug,
            title: item.name,
            image: item.cover ?? '',
        }));
        sectionCallback(latestSection);
        popularSection.items = popularItems.map((item) => App.createPartialSourceManga({
            mangaId: item.slug,
            title: item.name,
            image: item.cover ?? '',
        }));
        sectionCallback(popularSection);
    }
    // ── View More ──────────────────────────────────────────────────────────────
    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        const sortMap = {
            latest: 'latest',
            popular: 'views',
        };
        const sort = sortMap[homepageSectionId] ?? 'latest';
        const request = App.createRequest({
            url: `${API_URL}/titles/search?sort=${sort}&page=${page}&limit=24`,
            method: 'GET',
            headers: this.apiHeaders(),
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = JSON.parse(response.data);
        const items = json?.data?.items ?? [];
        const results = items.map((item) => App.createPartialSourceManga({
            mangaId: item.slug,
            title: item.name,
            image: item.cover ?? '',
        }));
        const hasNext = json?.data?.pagination?.has_next ?? false;
        return App.createPagedResults({
            results,
            metadata: hasNext ? { page: page + 1 } : undefined,
        });
    }
}
exports.MangaK = MangaK;

},{"@paperback/types":61}]},{},[62])(62)
});
