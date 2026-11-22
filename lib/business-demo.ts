import type { BusinessToday } from './business-today';
import type { BusinessInsights, BusinessStats, DishLikeCount } from './business-stats';
import type { FollowListPerson } from './profile-privacy';
import { localMenuDate } from './menu-date';

export const DEMO_BUSINESS_ID = 'demo-mi-patio';

/** Solo DEV, sin crear sesión ni escribir cuentas o cifras en el servidor. */
export function getDemoBusinessSnapshot(id: string, day = localMenuDate()): {
  today: BusinessToday; stats: BusinessStats; insights: BusinessInsights;
  dishes: DishLikeCount[]; followers: FollowListPerson[];
} | null {
  if (!__DEV__ || id !== DEMO_BUSINESS_ID) return null;
  const followers = [
    { userId: 'demo-review-sofia', name: 'Sofía R.' },
    { userId: 'demo-review-diego', name: 'Diego M.' },
    { userId: 'demo-review-mariana', name: 'Mariana L.' },
    { userId: 'demo-dev1-1', name: 'Caro M.' },
    { userId: 'demo-dev1-2', name: 'Iván R.' },
    { userId: 'demo-dev1-5', name: 'Sofía P.' },
  ];
  const dishes = [
    { dishName: 'MOLE CON POLLO', displayName: 'Mole con pollo', likes: 34 },
    { dishName: 'CHILES RELLENOS', displayName: 'Chiles rellenos', likes: 23 },
    { dishName: 'ENCHILADAS VERDES', displayName: 'Enchiladas verdes', likes: 17 },
  ];
  const views = [42, 58, 71, 63, 90, 104, 86];
  const week = views.map((value, index) => {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return { day: date.toISOString().slice(0, 10), views: value };
  });
  return {
    stats: { saves: followers.length, dishLikes: 74, reviews: 12 },
    insights: { saves: followers.length, savesWeek: 2, dishLikes: 74, dishLikesWeek: 26 },
    followers, dishes,
    today: { viewsToday: 86, viewsUsual: 64, week, followersToday: 2, dishLikesToday: 8, reviewsToday: 1,
      topDishes: dishes.map((dish) => ({ name: dish.displayName, likes: dish.likes })) },
  };
}
