github-cycle-time
=================

Calculates Reaction/Lead/Cycle Time from your GitHub issues.

## Getting Started

Add as a dependency to your project:

    yarn add github-cycle-time

  or

    npm install github-cycle-time

### Example


```js
const CycleTime = require('github-cycle-time');

// assuming you have stored your configuration in the environment...
service = new CycleTime(process.env.GITHUB_ORG, process.env.GITHUB_TOKEN);
service.data()
  .then((tickets) => {
    // do something with tickets
    tickets.forEach((ticket) => {
      console.log(ticket);
    });
  })
  .catch((error) => {
    console.error(error);
  });
```

`CycleTime#data` returns something like this:

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

Keep in mind that:

  - All dates are _ISO 8601_.
  - All durations are in _seconds_.

---

### Meta

  - [Code of Conduct](CODE_OF_CONDUCT.md)
  - [License](LICENSE)
  - [Contributors](AUTHORS)
