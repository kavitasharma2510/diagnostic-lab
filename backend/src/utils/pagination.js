export function buildPagination(page = 1, perPage = 15) {
    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.min(100, Math.max(1, Number(perPage) || 15));
    const skip = (currentPage - 1) * limit;

    return { currentPage, limit, skip };
}

export async function paginatedList(countQuery, findQuery) {
    return Promise.all([countQuery, findQuery]);
}

export function paginatedResponse(data, total, page, perPage) {
    const lastPage = Math.max(1, Math.ceil(total / perPage));

    return {
        data,
        meta: {
            current_page: page,
            per_page: perPage,
            total,
            last_page: lastPage,
        },
    };
}
