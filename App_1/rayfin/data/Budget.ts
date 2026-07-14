import { entity, role, text, decimal, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class Budget {
  @uuid() id!: string;
  @text({ min: 1, max: 40 }) category!: string;
  @decimal() monthlyLimit!: number;
  @text({ max: 128 }) user_id!: string;
}
