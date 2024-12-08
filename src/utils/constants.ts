import { PublicKey } from '@solana/web3.js';

type Server = 'Kamino' | 'Save' | 'Drift';

// Markets
type Market = {
  pubkey: PublicKey;
  label: string;
  server: Server;
  lut?: PublicKey;
};
export const MARKETS: Record<string, Market> = {
  MAIN_KAMINO: {
    pubkey: new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'),
    label: 'Main Market',
    server: 'Kamino',
    lut: new PublicKey('284iwGtA9X9aLy3KsyV8uT2pXLARhYbiSi5SiM2g47M2'),
  },
  JLP_KAMINO: {
    pubkey: new PublicKey('DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek'),
    label: 'JLP Market',
    server: 'Kamino',
    lut: new PublicKey('GprZNyWk67655JhX6Rq9KoebQ6WkQYRhATWzkx2P2LNc'),
  },
  JITO_KAMINO: {
    pubkey: new PublicKey('H6rHXmXoCQvq8Ue81MqNh7ow5ysPa1dSozwW3PU1dDH6'),
    label: 'Jito Market',
    server: 'Kamino',
    lut: new PublicKey('2Z5H2YKm7KJ4X7HwQpZzD9Hb7tQG2Z7aR1g4kC8Z6J2d'),
  },
  MAIN_SAVE: {
    pubkey: new PublicKey('4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY'),
    label: 'Main Market',
    server: 'Save',
  },
  JLP_SAVE: {
    pubkey: new PublicKey('7XttJ7hp83u5euzT7ybC5zsjdgKA4WPbQHVS27CATAJH'),
    label: 'JLP Market',
    server: 'Save',
  },
} as const;

// Token Mints
export type Token = {
  pubkey: PublicKey;
  label: string;
  id: string;
  reserve?: PublicKey;
  reserveJlp?: PublicKey;
  market: Array<keyof typeof MARKETS>;
};

export const TOKENS: Record<string, Token> = {
  JUPSOL: {
    pubkey: new PublicKey('jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v'),
    label: 'JUPSOL',
    id: 'jupiter-staked-sol',
    reserve: new PublicKey('d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q'),
    market: ['MAIN_KAMINO', 'MAIN_SAVE'],
  },
  JUPITER: {
    pubkey: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
    label: 'JUP',
    id: 'jupiter-exchange-solana',
    market: ['MAIN_KAMINO', 'MAIN_SAVE'],
  },
  JLP: {
    pubkey: new PublicKey('27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4'),
    label: 'JLP',
    id: 'jupiter-perpetuals-liquidity-provider-token',
    reserve: new PublicKey('DdTmCCjv7zHRD1hJv3E8bpnSEQBzdKkzB1j9ApXX5QoP'),
    market: ['JLP_KAMINO', 'JLP_SAVE'],
  },
  SOL: {
    pubkey: new PublicKey('So11111111111111111111111111111111111111112'),
    label: 'SOL',
    id: 'solana',
    reserve: new PublicKey('d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q'),
    market: ['MAIN_KAMINO', 'MAIN_SAVE', 'JITO_KAMINO'],
  },
  hubSOL: {
    pubkey: new PublicKey('HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX'),
    label: 'hubSOL',
    id: 'solanahub-staked-sol',
    reserve: new PublicKey('d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q'),
    market: ['MAIN_KAMINO'],
  },
  USDS: {
    pubkey: new PublicKey('USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA'),
    label: 'USDS',
    id: 'usds',
    market: ['MAIN_KAMINO', 'MAIN_SAVE', 'JLP_SAVE'],
  },
  PYUSD: {
    pubkey: new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
    label: 'PYUSD',
    id: 'paypal-usd',
    reserve: new PublicKey('2gc9Dm1eB6UgVYFBUN9bWks6Kes9PbWSaPaa9DqyvEiN'),
    market: ['MAIN_KAMINO', 'JLP_KAMINO'],
  },
  USDC: {
    pubkey: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    label: 'USDC',
    id: 'usd-coin',
    reserve: new PublicKey('BHUi32TrEsfN2U821G4FprKrR4hTeK4LCWtA3BFetuqA'),
    reserveJlp: new PublicKey('Ga4rZytCpq1unD4DbEJ5bkHeUz9g3oh9AAFEi6vSauXp'),
    market: ['MAIN_KAMINO', 'JLP_KAMINO', 'MAIN_SAVE', 'JLP_SAVE'],
  },
} as const;

// Obligations
type Obligation = {
  pubkey: PublicKey;
  label: string;
  market: keyof typeof MARKETS;
  server: Server;
};
export const OBLIGATIONS: Record<string, Obligation> = {
  MAIN_KAMINO: {
    pubkey: new PublicKey('BaXVzHSXVtyo381T5ouvReMe8yWZ5dyjxzVESSz1y1RG'),
    label: 'hubSOL / USDS',
    market: 'MAIN_KAMINO',
    server: 'Kamino',
  },
  JLP_KAMINO: {
    pubkey: new PublicKey('FNEEaUB7ofVuSX3pmPa4bvyWYg4Vd8K93udrohbAPVxq'),
    label: 'JLP / USDC',
    market: 'JLP_KAMINO',
    server: 'Kamino',
  },
  JITO_KAMINO: {
    pubkey: new PublicKey('4reVLzoLVGis15oaGXfAkftyRe21emmy9iANbmfHUAWo'),
    label: 'SOL + JTO',
    market: 'JITO_KAMINO',
    server: 'Kamino',
  },
  MAIN_SAVE: {
    pubkey: new PublicKey('C3w5saYQG1BfovVacQ3M6KfcPKoR81BTBSsBUyQK77qd'),
    label: 'USDS + JUPSOL / SOL',
    market: 'MAIN_SAVE',
    server: 'Save',
  },
  JLP_SAVE: {
    pubkey: new PublicKey('BZdy56m6vkc2FPUhSdBB51rGLrZbDKt3fcAaV4gWuwWs'),
    label: 'USDS',
    market: 'JLP_SAVE',
    server: 'Save',
  },
} as const;

// RPC Configuration
export const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';
export const PREFERRED_RPC_KEY = 'preferred_rpc';

// Time constants
export const PRICE_REFRESH_INTERVAL = 30000; // 30 seconds in milliseconds
export const PRICE_UPDATE_INTERVAL = 100; // 100ms for smooth progress animation
export const STATUS_REFRESH_INTERVAL = 60000; // 60 seconds in milliseconds

// Other
export const JUP_QUOTE_BUFFER_BPS = 1000;
export const USER_ADDRESS = new PublicKey('58kZBjjtHShTtXFmygr3ZT8VSU4dH28PanRAdouHbToh');

// UI Options derived from constants
export const MARKET_OPTIONS = Object.values(MARKETS).map(market => ({
  label: market.label,
  value: market.pubkey.toString(),
}));

export const MINT_OPTIONS = Object.values(TOKENS).map(token => ({
  label: token.label,
  value: token.pubkey.toString(),
}));

export const OBLIGATION_OPTIONS = Object.values(OBLIGATIONS).map(obligation => ({
  label: obligation.label,
  value: obligation.pubkey.toString(),
  market: obligation.market,
}));
