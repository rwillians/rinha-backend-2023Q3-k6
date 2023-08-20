import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
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
    criaBuscaPesquisa: {
      executor: 'constant-vus',
      duration: '60s',
      vus: 1,
      exec: 'criaBuscaPesquisa'
    }
  }
};

const pessoas = new SharedArray('pessoas-payloads.tsv', function () {
  return open('../resources/pessoas-payloads.tsv').split('\n').slice(1);
});

const termosDeBusca = new SharedArray('termos-busca.tsv', function () {
  return open('../resources/termos-busca.tsv').split('\n').slice(1);
});

export function criaBuscaPesquisa () {
  const payload = pessoas[exec.scenario.iterationInTest]; // sequencial

  const criaRes = http.post('http://127.0.0.1:9999/pessoas', payload, {
    headers: { 'Content-Type': 'application/json' },
    responseCallback: http.expectedStatuses(201, 422),
    tags: { name: 'CriarPessoa' }
  });

  // busca
  if (criaRes.status === 201) {
    const location = criaRes.headers['Location'];
    const [,, id] = location.split('/');

    http.get(url`http://127.0.0.1:9999/pessoas/${id}`, {
      responseCallback: http.expectedStatuses(200),
      tags: { name: 'Busca' }
    });
  }

  // pesquisa valida
  const termo = encodeURIComponent(termosDeBusca[exec.scenario.iterationInTest]);

  http.get(url`http://127.0.0.1:9999/pessoas?pagina=0&limite=5&t=${termo}`, {
    responseCallback: http.expectedStatuses(200),
    tags: { name: 'PesquisaValida' }
  });

  // pesquisa invalida
  http.get(`http://127.0.0.1:9999/pessoas`, {
    responseCallback: http.expectedStatuses(400),
    tags: { name: 'PesquisaInvalida' }
  });
}


export function handleSummary(data) {
  return {
    'results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { enableColors: true })
  };
}
