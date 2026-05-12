export interface BotConfig {
  botName: string;
  botId: string;
  clientId: string;
  clientSecret: string;
}

export const BOTS: Record<string, BotConfig> = {
  'EPSON-CF-LATIN-AMERICA-DEV': {
    botName: 'Dev Customer Facing Epson Latin America',
    botId: 'st-75d5df8f-acc0-51ef-a26d-05f30594fff8',
    clientId: 'cs-6cdca5ed-1bae-58b6-911a-94ee9f2da6c1',
    clientSecret: 'I0ZRI0W4mUqBUBqh4Cb4U12elpASD27QgkMwzKihgWc=',
  },
  'EPSON-CF-BRAZIL-DEV': {
    botName: 'Dev Customer Facing Epson Brazil',
    botId: 'st-5c05705e-9234-55ae-9be4-c504b4ebddf1',
    clientId: 'cs-8679d28a-ddd3-5943-abee-40109d0b4645',
    clientSecret: 'kI8oXDLtz/yld6dDL1Z5uoq6nWEzK1pEx86hS5Gpx9A=',
  },
};

Object.freeze(BOTS);