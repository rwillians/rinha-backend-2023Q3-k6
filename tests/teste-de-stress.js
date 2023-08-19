import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { group } from 'k6';
import { SharedArray } from 'k6/data';
import { url } from 'k6/http';
import exec from 'k6/execution';
import http from 'k6/http';

export const options = {
  thresholds: {
    'http_req_failed{expected_response:true}': ['rate<0.01'],
    'http_req_duration{name:CriarPessoa}': ['p(99)<251'],
    'http_req_duration{name:Busca}': ['p(99)<251'],
    'http_req_duration{name:PesquisaValida}': ['p(99)<1001'],
    'http_req_duration{name:PesquisaInvalida}': ['p(99)<251'],
  },
  summaryTrendStats: ['count', 'min', 'avg', 'med', 'max', 'p(95)', 'p(99)'],
  scenarios: {
    CriaEBuscaPessoa: {
      executor: 'ramping-vus',
      stages: [
        { duration: '180s', target: 72 },
        { duration: '180s', target: 72 },
        { duration: '45s', target: 0 },
      ],
      startVUs: 4,
      exec: 'criarEBuscarPessoa',
      gracefulRampDown: '3s'
    },
    PesquisaValida: {
      executor: 'ramping-vus',
      stages: [
        { duration: '180s', target: 12 },
        { duration: '180s', target: 12 },
        { duration: '45s', target: 0}
      ],
      startVUs: 1,
      exec: 'pesquisaValida',
      gracefulRampDown: '3s'
    },
    PesquisaInvalida: {
      executor: 'ramping-vus',
      stages: [
        { duration: '180s', target: 2 },
        { duration: '180s', target: 2 },
        { duration: '45s', target: 0 }
      ],
      startVUs: 1,
      exec: 'pesquisaInvalida',
      gracefulRampDown: '3s'
    }
  }
};

const pessoas = new SharedArray('pessoas-payloads.tsv', function () {
  return open('../resources/pessoas-payloads.tsv').split('\n').slice(1);
});

const termosDeBusca = new SharedArray('termos-busca.tsv', function () {
  return open('../resources/termos-busca.tsv').split('\n').slice(1);
});

export function criarEBuscarPessoa () {
  group('Cria pessoa', () => {
    const payload = pessoas[exec.scenario.iterationInTest]; // sequencial

    const res = http.post('http://127.0.0.1:9999/pessoas', payload, {
      headers: { 'Content-Type': 'application/json' },
      responseCallback: http.expectedStatuses(201, 422),
      tags: { name: 'CriarPessoa' }
    });

    if (res.status !== 201) {
      return;
    }

    const location = res.headers['Location'];
    const [,, id] = location.split('/');

    group('Busca pessoa criada', () => {
      const res = http.get(url`http://127.0.0.1:9999/pessoas/${id}`, {
        responseCallback: http.expectedStatuses(200),
        tags: { name: 'Busca' }
      });
    })
  })
}

export function pesquisaValida () {
  group('Pesquisa termo em /pessoas?t={termo}', () => {
    const termo = encodeURIComponent(termosDeBusca[exec.scenario.iterationInTest]);

    const res = http.get(url`http://127.0.0.1:9999/pessoas?pagina=0&limite=5&t=${termo}`, {
      responseCallback: http.expectedStatuses(200),
      tags: { name: 'PesquisaValida' }
    });

    // if (res.status !== 200) {
    //   return;
    // }

    // group('Busca pessoas retornadas na pesquisa', () => {
    //   const requests = JSON
    //     .parse(res.body)
    //     .resultados
    //     .map(({ id }) => [
    //       'GET',
    //       url`http://127.0.0.1:9999/pessoas/${id}`,
    //       null,
    //       { responseCallback: http.expectedStatuses(200) }
    //     ])
    //
    //   const reqsLength = requests.length
    //
    //   if (reqsLength === 0) {
    //     return;
    //   }
    //
    //   http.batch(requests)
    // })
  })
}

export function pesquisaInvalida () {
  group('Pesquisa inválida', () => {
    const res = http.get(`http://127.0.0.1:9999/pessoas`, {
      responseCallback: http.expectedStatuses(400),
      tags: { name: 'PesquisaInvalida' }
    });
  })
}

export function handleSummary(data) {
  return {
    'data/results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { enableColors: true })
  };
}