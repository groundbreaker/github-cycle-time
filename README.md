@groundbreaker/github-cycle-time
================================

Calculates Reaction/Lead/Cycle Time from your Organization's GitHub issues.

## Getting Started

Add as a dependency to your project:

    yarn add @groundbreaker/github-cycle-time

  or

    npm install @groundbreaker/github-cycle-time

## Usage

### Creating an instance of CycleTime

```js
const CycleTime = require('@groundbreaker/github-cycle-time');

// assuming you have stored your configuration in the environment...
service = new CycleTime({ org: process.env.GITHUB_ORG, token: process.env.GITHUB_TOKEN });
```

### Options

  - `org` (string) - Github Organization name. **Required**
  - `token` (string) - Github Personal Access Token. **Required**
  - `baseUrl` (string) - Github API Base URL. Defaults to `https://api.github.com`. __Optional__
  - `cache` (blob-store) - An object that implements the [abstract-blob-store](https://github.com/maxogden/abstract-blob-store) API. Defaults to `MemBlobs`, an in-memory reference implementation that ships with `abstract-blob-store`. You will get better results with [fs-blob-store](https://github.com/mafintosh/fs-blob-store), [s3-blob-store](https://github.com/jb55/s3-blob-store), or one of the [other blob-store implementations](https://github.com/maxogden/abstract-blob-store#some-modules-that-use-this).

---

## API

### CycleTime#tickets(since)

This provides access to all of the tickets in your organization, summarized with event timestamps, and cycle durations. Must be called with a ISO8601 timestamp string argument, which filters issues that were created on or after this date. This method returns a `Promise`, and must be used with `then()` or `async`/`await`.

#### Example

```js
const CycleTime = require('@groundbreaker/github-cycle-time');
service = new CycleTime({ org: process.env.GITHUB_ORG, token: process.env.GITHUB_TOKEN });

service.tickets('2018-08-01T00:00:00Z')
.then((data) => {
  // do something with data
  console.log(data);
})
.catch((error) => {
  console.error(error);
});
```

#### Return Value

```js
[
  {
    id: 1,
    opened: '1978-01-13T09:11:00Z',
    assigned: '1978-01-14T09:11:00Z',
    closed: '1978-01-16T09:11:00Z',
    reopened: '1978-01-15T09:11:00Z',
    reaction_time: 86400,
    cycle_time: 172800,
    lead_time: 259200
  }
]
```

  - All dates are _ISO 8601_ strings, in the UTC timezone.
  - All durations are in _seconds_, and may be expressed as decimals.
  - Some events may have a `null` value, e.g. `closed` is `null` because the issue is still open.

### CycleTime#metrics(since)

This provides an aggregation of the cycle durations for all the tickets in your organization returned by `CycleTime#tickets(since)`. Must be called with a ISO8601 timestamp string argument, which filters issues that were created on or after this date. This method returns a `Promise`, and must be used with `then()` or `async`/`await`.


```js
const CycleTime = require('@groundbreaker/github-cycle-time');
service = new CycleTime({ org: process.env.GITHUB_ORG, token: process.env.GITHUB_TOKEN });

service.metrics('2018-08-01T00:00:00Z')
.then((data) => {
  // do something with data
  console.log(data);
})
.catch((error) => {
  console.error(error);
});
```

#### Return Value

```js
{
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
```

  - All durations are in _seconds_, and may be expressed as decimals.
  - All `*_mean` values are straight averages, and should be interpreted as the _effective_ cycle times.
  - All `*_median` values find the middle value, effectively throwing away outliers, and should be seens as the _typical_ cycle times.
  - All `*_human` values are formatted duration strings, with weeks (`W`) as the largest unit of measure, and minutes (`M`) as the smallest unit of measure. Units with a `0` value are not shown in the output.

---

### Meta

  - [Examples](examples/README.md)
  - [Code of Conduct](CODE_OF_CONDUCT.md)
  - [License](LICENSE)
  - [Contributors](AUTHORS)
