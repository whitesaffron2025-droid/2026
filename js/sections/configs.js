window.CampaignSectionConfigs = {
  residents: {
    title: 'Residents',
    filters: ['address', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'remarks', 'action'],
    actionLabel: 'Update'
  },
  assign: {
    title: 'Assign Voters',
    filters: ['address', 'assignCategory', 'assigner', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'assignedTo', 'remarks', 'action'],
    actionLabel: 'Assign'
  },
  calls: {
    title: 'Call Center',
    filters: ['address', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'callStatus', 'remarks', 'action'],
    actionLabel: 'Call'
  },
  votes: {
    title: 'Votes',
    filters: ['address', 'voteStatus', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'voteStatus', 'remarks', 'action'],
    actionLabel: 'Vote'
  },
  visits: {
    title: 'Visits',
    filters: ['address', 'visitStatus', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'visitStatus', 'remarks', 'action'],
    actionLabel: 'Visit'
  },
  transport: {
    title: 'Transport',
    filters: ['address', 'transportStatus', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'transportStatus', 'remarks', 'action'],
    actionLabel: 'Transport'
  },
  reports: {
    title: 'Reports',
    filters: ['address', 'party'],
    columns: ['photo', 'nameId', 'address', 'mobile', 'party', 'remarks', 'action'],
    actionLabel: 'Update'
  }
};
