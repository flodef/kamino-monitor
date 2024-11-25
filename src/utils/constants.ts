import { PublicKey } from '@solana/web3.js';

// Markets
export const MAIN_MARKET = new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
export const MAIN_MARKET_LUT = new PublicKey('284iwGtA9X9aLy3KsyV8uT2pXLARhYbiSi5SiM2g47M2');
export const JLP_MARKET = new PublicKey('DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek');
export const JLP_MARKET_LUT = new PublicKey('GprZNyWk67655JhX6Rq9KoebQ6WkQYRhATWzkx2P2LNc');
export const JITO_MARKET = new PublicKey('H6rHXmXoCQvq8Ue81MqNh7ow5ysPa1dSozwW3PU1dDH6');
export const JITO_MARKET_LUT = new PublicKey('2Z5H2YKm7KJ4X7HwQpZzD9Hb7tQG2Z7aR1g4kC8Z6J2d');

// Token Mints
export const PYUSD_MINT = new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo');
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const JUPSOL_MINT = new PublicKey('jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v');
export const JLP_MINT = new PublicKey('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4');
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const USDS_MINT = new PublicKey('USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA');

// Token Reserves
export const USDC_RESERVE = new PublicKey('BHUi32TrEsfN2U821G4FprKrR4hTeK4LCWtA3BFetuqA');
export const SOL_RESERVE = new PublicKey('d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q');
export const PYUSD_RESERVE = new PublicKey('2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN');
export const USDC_RESERVE_JLP_MARKET = new PublicKey(
  'Ga4rZytCpq1unD4DbEJ5bkHeUz9g3oh9AAFEi6vSauXp'
);
export const JUPSOL_RESERVE = new PublicKey('d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q');
export const JLP_RESERVE_JLP_MARKET = new PublicKey('DdTmCCjv7zHRD1hJv3E8bpnSEQBzdKkzB1j9ApXX5QoP');

// RPC Configuration
export const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';
export const PREFERRED_RPC_KEY = 'preferred_rpc';

// Other
export const JUP_QUOTE_BUFFER_BPS = 1000;
export const MAIN_OBLIGATION = new PublicKey('BaXVzHSXVtyo381T5ouvReMe8yWZ5dyjxzVESSz1y1RG');
export const JITO_OBLIGATION = new PublicKey('4reVLzoLVGis15oaGXfAkftyRe21emmy9iANbmfHUAWo');
export const USER_ADDRESS = new PublicKey('58kZBjjtHShTtXFmygr3ZT8VSU4dH28PanRAdouHbToh');
