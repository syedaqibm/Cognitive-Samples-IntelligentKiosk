import { entity, role, text, decimal, date, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class Expense {
  @uuid() id!: string;
  @text({ min: 1, max: 200 }) description!: string;
  @decimal() amount!: number;
  @text({ min: 1, max: 40 }) category!: string;
  @date() spentAt!: Date;
  @text({ max: 128 }) user_id!: string;
}
