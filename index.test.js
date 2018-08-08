const test = require('blue-tape');
const sepia = require('sepia')

const CycleTime = require('./index.js');

const testData = {
  tickets: [{
    id: 1,
    created_at: "1978-01-13T09:11:00Z",
    timeline_url: "https://api.github.com/repos/:owner/:repos/issues/1/timeline",
    unused_field: true
  }],

  formatted: [
    {
      _timeline: "/repos/:owner/:repos/issues/1/timeline",
      id: 1,
      opened: '1978-01-13T09:11:00Z',
      assigned: null,
      closed: null,
      reopened: null,
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
      opened: '1978-01-13T09:11:00Z',
      assigned: '1978-01-14T09:11:00Z',
      closed: '1978-01-16T09:11:00Z',
      reopened: '1978-01-15T09:11:00Z',
      reaction_time: null,
      cycle_time: null,
      lead_time: null
    }
  ],

  final: {
    id: 345284913,
    opened: '2018-07-27T16:12:51Z',
    reopened: null,
    assigned: '2018-07-27T16:12:51Z',
    closed: '2018-07-28T08:34:41Z',
    reaction_time: 0,
    cycle_time: 58910,
    lead_time: 58910
  }
};

test("github-cycle-time", (t) => {
  let service = new CycleTime('groundbreaker', '5ca1ab1e0ddba11')
  t.ok(service instanceof CycleTime, 'it is an instance of CycleTime');
  t.equals(service.BASE_URL, 'https://api.github.com', 'it has a base url');

  t.ok(service.formatTickets({ data: testData.tickets }), 'it can format tickets');
  t.deepEquals(service.formatTickets({ data: testData.tickets }), testData.formatted, 'it formats tickets properly');

  t.ok(service.processTimeline(testData.formatted[0], testData.timeline), 'it can process the timeline for a ticket');
  t.deepEquals(service.processTimeline(testData.formatted[0], testData.timeline), testData.withTimeline[0], 'it updates the ticket with the timeline');

  t.ok(service.calculateDuration(testData.formatted[0].opened, testData.formatted[0].closed), 'it can calculate duration');
  t.equals(service.calculateDuration(null, testData.formatted[0].opened), 0, 'it returns 0 if start is null');
  t.equals(service.calculateDuration(testData.formatted[0].opened, null), 0, 'it returns 0 if end is null');
  t.equals(service.calculateDuration(null, null), 0, 'it returns 0 if start and end is null');
  t.deepEquals(service.calculateDuration(testData.formatted[0].opened, testData.formatted[0].closed), 259200, 'it calculates the duration properly');

  t.ok(service.calculateTimes(testData.withTimeline[0]), 'it can calculate times');
  t.equals(service.calculateTimes(testData.withTimeline[0]).reaction_time, 86400, 'it can calculate reaction time properly');
  t.equals(service.calculateTimes(testData.withTimeline[0]).cycle_time, 172800, 'it can calculate cycle time properly');
  t.equals(service.calculateTimes(testData.withTimeline[0]).lead_time, 259200, 'it can calculate lead time properly');

  service.data()
    .then((tickets) => {
      t.ok(tickets.length >= 1, 'it returns 1 or more tickets');
      t.deepEquals(tickets[0], testData.final, 'it processes tickets properly');
    })
    .catch((error) => {
      return error;
    });

  t.end();
});
