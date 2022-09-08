import Settings from '../settings/settings';

// Different item status depending on integrated or standalone

let integrated = Settings.getIntegrated();

export const None = 0;
export const Active = ( integrated ? 1 : 12 );
export const Inactive = 2;
export const TempUnavail = ( integrated ? 3 : 17 );
export const DiscByHome = ( integrated ? 4 : 13 );
export const DiscByDealer = 5;
export const DiscByVendor = 15
export const NotInThisWarehouse = ( integrated ? 7 : 19 );
export const SoldoutForSeason = ( integrated ? 8 : 18 );
