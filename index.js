const Promise = require('bluebird');
const octokit = require('@octokit/rest');
const math = require('mathjs')
const moment = require('moment');
const defaults = require('defaults');
const store = require('abstract-blob-store');
const momentDurationSetup = require('moment-duration-format');
const jsonParse = require('json-parse-stream');
momentDurationSetup(moment);


const getIssues = async (client, opts) => {
  let response = await client.issues.getForOrg(opts)
  let {data} = response
  while (client.hasNextPage(response)) {
    response = await client.getNextPage(response)
    data = data.concat(response.data)
  }
  return data
}

class CycleTime {

  constructor (options = {}) {
    this.options = defaults(options, {
      baseUrl: 'https://api.github.com',
      cache: new store(),
      org: null,
      token: null
    });

    if (this.options.org === null) {
      new Error('Missing Required Option: `org`');
    }

    if (!this.options.token === null) {
      new Error('Missing Required Option: `token`');
    }

    this.Client = octokit({
      baseUrl: this.options.baseUrl,
    });

    this.Client.authenticate({
      type: 'token',
      token: this.options.token
    });
  }

  _cache(key, p) {
    return new Promise((resolve, reject) => {
      this.options.cache.exists(key, (err, exists) => {
        if (err) reject(err);
        if (exists) {
          console.log('cache hit');
          let data = [];
          this.options.cache.createReadStream(key)
            .on('data', (chunk) => {
              data.push(chunk.toString());
            })
            .on('end', () => {
              return resolve(JSON.parse(data.join('')));
            });
        } else {
          console.log('cache miss');
          return resolve(p.then((data) => {
            this.options.cache.createWriteStream(key)
              .write(JSON.stringify(data), 'utf8')
              .end();
            return data;
          }));
        }
      });
    });
  }

  _clear(key) {
    this.options.cache.remove(key);
  }

  _format(data) {
    let tickets = data.map((ticket) => {
      return {
        id: ticket.number,
        org: this.options.org,
        repos: ticket.repository.name,
        opened: ticket.created_at,
        reopened: null,
        assigned: null,
        closed: null,
        reaction_time: null,
        cycle_time: null,
        lead_time: null
      }
    });
    return tickets;
  }

  _process(ticket, timeline) {
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

  _duration(start, end) {
    start = new moment(start);
    end = new moment(end);

    if (start.isValid() && end.isValid()) {
      return moment.duration(end.diff(start)).as('seconds');
    } else {
      return 0;
    }
  }

  _times(ticket) {
    ticket.reaction_time = this._duration(ticket.opened, ticket.assigned);
    ticket.cycle_time = this._duration(ticket.assigned, ticket.closed);
    ticket.lead_time = this._duration(ticket.opened, ticket.closed);
    return ticket;
  }

  _aggregate(data, type) {
    let agg = data.map(v => v[type]);
    return [math.mean(agg.slice(0)), math.median(agg.slice(0))];
  }

  _calculate(tickets) {
    return tickets.map((ticket) => {
      return this._times(ticket)
    });
  }

  _timeline(ticket) {
    let opts = { owner: ticket.org, number: ticket.id, repo: ticket.repos }
    let key = `github-cycle-time_timeline-${ticket.org}-${ticket.repos}-${ticket.id}.json`;
    return this._cache(key, this.Client.issues.getEventsTimeline(opts)
      .then((response) => {
        return this._process(ticket, response.data)
      }).catch(error => error)
    );
  }

  _enhance(tickets) {
    return tickets.map((ticket) => {
      setTimeout(()=>{}, 100);
      return this._timeline(ticket);
    });
  }

  _fetch(since) {
    let opts = { org: this.options.org, filter: 'all', state: 'all', direction: 'asc', per_page: 100, page: 1, since: since };
    return this._cache('github-cycle-time_fetch.json', getIssues(this.Client, opts));
  }

  _humanize(duration_in_seconds) {
    return moment
      .duration(duration_in_seconds, 'seconds')
      .format({
        template: "w[W] d[D] h[H] m[M]",
        precision: 1,
        trim: true
      });
  }

  tickets(since) {
    return this._fetch(since)
      .then(tickets => this._format(tickets))
      .then(tickets => this._enhance(tickets))
      .then(Promise.all)
      .then(tickets => this._calculate(tickets));
  }

  metrics(since) {
    return this.tickets(since)
      .then((data) => {
        let [rt_mean, rt_median] = this._aggregate(data, 'reaction_time');
        let [ct_mean, ct_median] = this._aggregate(data, 'cycle_time');
        let [lt_mean, lt_median] = this._aggregate(data, 'lead_time');

        return {
          org: this.options.org,
          reaction_time_mean: rt_mean,
          reaction_time_median: rt_median,
          reaction_time_mean_human: this._humanize(rt_mean),
          reaction_time_median_human: this._humanize(rt_median),
          cycle_time_mean: ct_mean,
          cycle_time_median: ct_median,
          cycle_time_mean_human: this._humanize(ct_mean),
          cycle_time_median_human: this._humanize(ct_median),
          lead_time_mean: lt_mean,
          lead_time_median: lt_median,
          lead_time_mean_human: this._humanize(lt_mean),
          lead_time_median_human: this._humanize(lt_median)
        }
      });
  }
};

module.exports = CycleTime;
