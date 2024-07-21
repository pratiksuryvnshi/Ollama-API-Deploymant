import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
    ],
};

export default function () {
    let res = http.post('http://hostip/generate', JSON.stringify({
        prompt: 'Hello World',
        options: { num_tokens: 10 }
    }), { headers: { 'Content-Type': 'application/json' } });

    check(res, {
        'is status 200': (r) => r.status === 200,
    });
    sleep(1);
}

