import http from 'k6/http';

export const options = {
  discardResponseBodies: true,
  scenarios: {
    arrival_rate: {
      executor: 'constant-arrival-rate',
      rate: 20000,
      timeUnit: '1s',
      duration: '3s',
      preAllocatedVUs: 1000,
      maxVUs: 2500,
    },
  },
};

export default function () {
  http.get('http://r.localhost/dev1', {
    redirects: 0,
    headers: { 'Connection': 'keep-alive' },
  });
}
