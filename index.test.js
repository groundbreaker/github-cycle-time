const test = require('tape');
const store = require('fs-blob-store');
cache = new store({ path: process.cwd() + '/fixtures' })

const CycleTime = require('./index.js');

const testData = {
  tickets: [{
    number: 1,
    repository: { name: 'test' },
    created_at: "1978-01-13T09:11:00Z",
    timeline_url: "https://api.github.com/repos/:owner/:repos/issues/1/timeline",
    unused_field: true
  }],

  formatted: [
    {
      id: 1,
      org: 'groundbreaker',
      repos: 'test',
      opened: '1978-01-13T09:11:00Z',
      reopened: null,
      assigned: null,
      closed: null,
      reaction_time: null,
      cycle_time: null,
      lead_time: null
    }
  ],

  timeline: [
    {
      event: 'assigned',
      created_at: '1978-01-14T09:11:00Z'
    },
    {
      event: 'closed',
      created_at: '1978-01-16T09:11:00Z'
    },
    {
      event: 'reopened',
      created_at: '1978-01-15T09:11:00Z'
    },
    {
      event: 'unused',
      created_at: '1978-01-13T09:11:00Z'
    }
  ],

  withTimeline: [
    {
      id: 1,
      org: 'groundbreaker',
      repos: 'test',
      opened: '1978-01-13T09:11:00Z',
      reopened: '1978-01-15T09:11:00Z',
      assigned: '1978-01-14T09:11:00Z',
      closed: '1978-01-16T09:11:00Z',
      reaction_time: null,
      cycle_time: null,
      lead_time: null
    }
  ],

  final: {
    id: 43,
    org: 'groundbreaker',
    repos: 'github-cycle-time',
    opened: '2018-05-02T21:47:19Z',
    reopened: null,
    assigned: '2018-05-02T21:47:27Z',
    closed: '2018-08-03T18:55:25Z',
    reaction_time: 8,
    cycle_time: 8024878,
    lead_time: 8024886
  },

  forAgg: [
    {
      id: 345284913,
      opened: '2018-07-27T16:12:51Z',
      reopened: null,
      assigned: '2018-07-27T16:12:51Z',
      closed: '2018-07-28T08:34:41Z',
      reaction_time: 0,
      cycle_time: 58910,
      lead_time: 58910
    },
    {
      id: 1,
      opened: '1978-01-13T09:11:00Z',
      assigned: '1978-01-14T09:11:00Z',
      closed: '1978-01-16T09:11:00Z',
      reopened: '1978-01-15T09:11:00Z',
      reaction_time: 86400,
      cycle_time: 172800,
      lead_time: 259200
    },
    {
      id: 3,
      opened: '1978-01-13T09:11:00Z',
      assigned: '1978-01-13T10:11:00Z',
      closed: '1978-01-13T23:11:00Z',
      reopened: null,
      reaction_time: 3600,
      cycle_time: 46800,
      lead_time: 50400
    },
    {
      id: 4,
      opened: '1978-01-13T09:11:00Z',
      assigned: '1978-01-13T9:11:00Z',
      closed: '1978-01-14T09:11:00Z',
      reopened: null,
      reaction_time: 0,
      cycle_time: 86400,
      lead_time: 86400
    }
  ],

  aggFinal: {
    org: 'groundbreaker',
    reaction_time_mean: 8,
    reaction_time_median: 8,
    reaction_time_mean_human: '0.1M',
    reaction_time_median_human: '0.1M',
    cycle_time_mean: 8024878,
    cycle_time_median: 8024878,
    cycle_time_mean_human: '13W 1D 21H 8.0M',
    cycle_time_median_human: '13W 1D 21H 8.0M',
    lead_time_mean: 8024886,
    lead_time_median: 8024886,
    lead_time_mean_human: '13W 1D 21H 8.1M',
    lead_time_median_human: '13W 1D 21H 8.1M'
  }
};


test("github-cycle-time#_utils", async (t) => {
  let service = new CycleTime({ org: 'groundbreaker', token: process.env.GITHUB_TOKEN, cache: cache });
  // '5ca1ab1e0ddba11'
  t.ok(service instanceof CycleTime, 'it is an instance of CycleTime');

  t.ok(service._format(testData.tickets), 'it can format tickets');
  t.deepEquals(service._format(testData.tickets), testData.formatted, 'it formats tickets properly');

  t.ok(service._process(testData.formatted[0], testData.timeline), 'it can process the timeline for a ticket');
  t.deepEquals(service._process(testData.formatted[0], testData.timeline), testData.withTimeline[0], 'it updates the ticket with the timeline');

  t.ok(service._duration(testData.formatted[0].opened, testData.formatted[0].closed), 'it can calculate duration');
  t.equals(service._duration(null, testData.formatted[0].opened), 0, 'it returns 0 if start is null');
  t.equals(service._duration(testData.formatted[0].opened, null), 0, 'it returns 0 if end is null');
  t.equals(service._duration(null, null), 0, 'it returns 0 if start and end is null');
  t.deepEquals(service._duration(testData.formatted[0].opened, testData.formatted[0].closed), 259200, 'it calculates the duration properly');

  t.ok(service._times(testData.withTimeline[0]), 'it can calculate times');
  t.equals(service._times(testData.withTimeline[0]).reaction_time, 86400, 'it can calculate reaction time properly');
  t.equals(service._times(testData.withTimeline[0]).cycle_time, 172800, 'it can calculate cycle time properly');
  t.equals(service._times(testData.withTimeline[0]).lead_time, 259200, 'it can calculate lead time properly');

  t.ok(service._aggregate(testData.forAgg, 'reaction_time'), 'it can aggregate reaction times');
  t.equals(service._aggregate(testData.forAgg, 'reaction_time')[0], 22500,'it calculates the mean reaction time properly');
  t.equals(service._aggregate(testData.forAgg, 'reaction_time')[1], 1800,'it calculates the median reaction time properly');

  t.ok(service._aggregate(testData.forAgg, 'cycle_time'), 'it can aggregate cycle times');
  t.equals(service._aggregate(testData.forAgg, 'cycle_time')[0], 91227.5,'it calculates the mean cycle time properly');
  t.equals(service._aggregate(testData.forAgg, 'cycle_time')[1], 72655,'it calculates the median cycle time properly');

  t.ok(service._aggregate(testData.forAgg, 'lead_time'), 'it can aggregate lead times');
  t.equals(service._aggregate(testData.forAgg, 'lead_time')[0], 113727.5,'it calculates the mean lead time properly');
  t.equals(service._aggregate(testData.forAgg, 'lead_time')[1], 72655,'it calculates the median lead time properly');

  t.ok(service._humanize(113727.5), 'it can _humanize durations');
  t.equals(service._humanize(113727.5), '1D 7H 35.5M','it _humanizes durations properly');

  let tickets = await service.tickets('2018-08-01T00:00:00Z');
  t.ok(tickets.length >= 1, 'it returns 1 or more tickets');
  t.deepEquals(tickets[0], testData.final, 'it processes tickets properly');

  let metrics = await service.metrics('2018-08-01T00:00:00Z');
  t.ok(metrics, 'it can calculate org metrics');
  t.deepEquals(metrics, testData.aggFinal, 'it calculates org metrics properly');

  t.end();
});
