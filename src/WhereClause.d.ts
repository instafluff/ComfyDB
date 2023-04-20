export type WhereClause<T> = PickOne<WhereClauseOptions<T>>;

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
    startswith: T,
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
