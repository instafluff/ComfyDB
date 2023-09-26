import { Document as mongoDocument, MongoClientOptions } from "mongodb";

type SortDirection = "asc" | "ascending" | "desc" | "descending";

export type WhereClauses<T extends mongoDocument> = {
    [K in keyof T]?: WhereClause<T[K]>
}

interface QueryPresetOptions<T extends mongoDocument> {
    sortBy?: string;
    sort?: SortDirection;
    limit?: number;
    start?: number;
    where?: WhereClauses<T> | null;
    key?: string | null;
    by?: number,
}

interface LimitQuerySelection {
    limit: number;
    count?: never;
}

export type SearchQueryRequest<T extends mongoDocument> = QueryPresetOptions<T> & Partial<LimitQuerySelection>;

interface CountQuerySelection {
    limit?: never;
    count: number;
}

type LimitingQuerySelection = LimitQuerySelection | CountQuerySelection;

interface OrderByQuerySort {
    sortBy?: string;
    orderBy: string;
}

export type SearchQuery<T extends mongoDocument> = Partial<QueryPresetOptions<T>> & Partial<LimitingQuerySelection> & Partial<OrderByQuerySort>;



export interface ConnectionProperties extends MongoClientOptions {
    url?: string,
    dbname?: string,
}

export type WhereClause<T> = PickOne<CaseInsensiteKeys<WhereClauseOptions<T>>>;

type CaseInsensiteKeys<T> = {
    [K in keyof T as Lowercase<string & K>]: T[K];
} & T;

interface WhereClauseOptions<T> {
    eq: T,
    equals: T,
    equal: T,
    is: T,
    isequal: T,
    isequalto: T,
    "=": T,
    // -
    ne: T,
    not: T,
    notequals: T,
    notequal: T,
    doesntequal: T,
    isnot: T,
    isnt: T,
    isnotequal: T,
    isnotequalto: T,
    "!": T,
    "!=": T,
    "<>": T,
    // -
    before: T,
    lessthan: T,
    lt: T,
    "<": T,
    // -
    after: T,
    greaterthan: T,
    gt: T,
    ">": T,
    // -
    contains: T,
    includes: T,
    starts: T,
    startsWith: T,
    begins: T,
    beginswith: T,
    prefix: T,
    // -
    ends: T,
    endswith: T,
    suffix: T,
}


type PickOne<Intf> = {
    [K in keyof Intf]: RequireOne<{
        [P in keyof Intf]?: P extends K ? Intf[P] : never
    }, K>
}[keyof Intf]

type RequireOne<T, Key extends keyof T> = T & { [P in Key]-?: T[P] }

