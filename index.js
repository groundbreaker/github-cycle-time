const Promise = require('bluebird');
const axios = require('axios');
const moment = require('moment');


class CycleTime {
  constructor (GITHUB_ORG, GITHUB_TOKEN) {
    this.BASE_URL = 'https://api.github.com';
    this.GITHUB_ORG = GITHUB_ORG;

    this.Client = axios.create({
      baseURL: this.BASE_URL,
      timeout: 1000,
      headers: {
        'Accept': 'application/vnd.github.mockingbird-preview',
        'Authorization': `token ${GITHUB_TOKEN}`
      }
    });
  }

  formatTickets(response) {
    return response.data.map((ticket) => {
      return {
        _timeline: ticket.timeline_url.replace(this.BASE_URL, ''),
        id: ticket.id,
        opened: ticket.created_at,
        reopened: null,
        assigned: null,
        closed: null,
        reaction_time: null,
        cycle_time: null,
        lead_time: null
      }
    });
  }

  processTimeline(ticket, timeline) {
    timeline.forEach((tl) => {
      switch(tl.event) {
        case 'closed':
          ticket.closed = tl.created_at;
          break;
        case 'reopened':
          ticket.reopened = tl.created_at;
          break;
        case 'assigned':
          ticket.assigned = tl.created_at;
          break;
        default:
          break;
      }
    });
    delete ticket._timeline;
    return ticket;
  }

  calculateDuration(start, end) {
    start = new moment(start);
    end = new moment(end);

    if (start.isValid() && end.isValid()) {
      return moment.duration(end.diff(start)).as('seconds');
    } else {
      return 0;
    }
  }

  calculateTimes(ticket) {
    ticket.reaction_time = this.calculateDuration(ticket.opened, ticket.assigned);
    ticket.cycle_time = this.calculateDuration(ticket.assigned, ticket.closed);
    ticket.lead_time = this.calculateDuration(ticket.opened, ticket.closed);
    return ticket;
  }

  processTickets(tickets) {
    return tickets.map(this.calculateTimes);
  }

  enhanceTickets(tickets) {
    return tickets.map(this.getTimeline);
  }

  getTimeline(ticket) {
    return this.Client.get(ticket._timeline)
      .then((response) => {
        return this.processTimeline(ticket, response.data);
      })
  }

  getTickets() {
    let ticketParams = { params: { state: 'all', per_page: 100 } };
    return this.Client.get(`/orgs/${this.GITHUB_ORG}/issues`, ticketParams);
  }

  data() {
    return this.getTickets()
      .then(this.formatTickets)
      .then(this.enhanceTickets)
      .then(this.processTickets)
      .then(Promise.all);
  }
};

module.exports = CycleTime;
