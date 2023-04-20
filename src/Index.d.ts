import { Document as mongoDocument, MongoClientOptions } from "mongodb";
import { WhereClause } from "./WhereClause";

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



interface ConnectionProperties extends MongoClientOptions {
    url: string,
    dbname: string,
}

