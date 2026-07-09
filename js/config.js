window.CampaignConfig = {
  supabaseUrl: 'https://tkuivkhghmeljcuqwwdy.supabase.co',
  supabaseKey: 'sb_publishable_pBOO7h7_TBtfDhv_vYqEFw_MCpHFkq-',
  tableName: '2026',
  pageSize: 20,
  batchSize: 1000,
  parties: ['PNC', 'MDP'],
  statuses: {
    vote: ['not-decided', 'will-vote', 'not-vote'],
    phone: ['need-call', 'called', 'busy', 'not-answer', 'disconnected', 'wrong-number', 'out-of-coverage'],
    d2d: ['not-visited', 'reach', 'not-home', 'live-in-another-place'],
    reach: ['not-reached', 'reached'],
    support: ['normal', 'not-guaranteed', 'guaranteed'],
    transport: ['not-needed', 'need-transport', 'arranged', 'picked-up']
  }
};
