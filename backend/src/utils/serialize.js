import { Prisma } from '@prisma/client';

export function serialize(value) {
    return JSON.parse(
        JSON.stringify(value, (_, v) => {
            if (v instanceof Prisma.Decimal) {
                return v.toNumber();
            }

            if (typeof v === 'bigint') {
                return Number(v);
            }

            return v;
        })
    );
}
