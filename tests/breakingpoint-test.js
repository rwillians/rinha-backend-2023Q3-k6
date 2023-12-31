import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { SharedArray } from 'k6/data';
import { url } from 'k6/http';
import exec from 'k6/execution';
import http from 'k6/http';

export const options = {
  thresholds: {
    'http_req_failed{expected_response:true}': ['rate<0.01'],
    'http_req_duration{name:CriarPessoa}': ['p(99)<100'],
    'http_req_duration{name:Busca}': ['p(99)<100'],
    'http_req_duration{name:PesquisaValida}': ['p(99)<100'],
    'http_req_duration{name:PesquisaInvalida}': ['p(99)<100'],
  },
  summaryTrendStats: ['count', 'min', 'avg', 'med', 'max', 'p(95)', 'p(99)'],
  scenarios: {
    cria_e_talves_busca_pessoa: {
      executor: 'ramping-vus',
      stages: [
        { duration: '300s', target: 84 }
      ],
      startVUs: 1,
      exec: 'criarETalvezBuscarPessoa'
    },
    pesquisa_valida: {
      executor: 'ramping-vus',
      stages: [
        { duration: '300s', target: 14 },
      ],
      startVUs: 1,
      exec: 'pesquisaValida'
    },
    pesquisa_invalida: {
      executor: 'ramping-vus',
      stages: [
        { duration: '300s', target: 2 },
      ],
      startVUs: 1,
      exec: 'pesquisaInvalida'
    }
  }
};

const pessoas = new SharedArray('pessoas-payloads.jsonl', function () {
  return open('../resources/pessoas-payloads.jsonl').split('\n').slice(1);
});

const termosDeBusca = new SharedArray('termos-busca.tsv', function () {
  return open('../resources/termos-busca.tsv').split('\n').slice(1);
});

export function criarETalvezBuscarPessoa () {
  const payload = pessoas[exec.scenario.iterationInTest]; // sequencial

  const res = http.post(url`http://127.0.0.1:9999/pessoas`, payload, {
    headers: { 'Content-Type': 'application/json' },
    responseCallback: http.expectedStatuses(201, 422),
    tags: { name: 'CriarPessoa' }
  });

  if (res.status !== 201) {
    return;
  }

  const location = res.headers['Location'];
  const [,, id] = location.split('/');

  http.get(url`http://127.0.0.1:9999/pessoas/${id}`, {
    responseCallback: http.expectedStatuses(200),
    tags: { name: 'Busca' }
  });
}

export function pesquisaValida () {
  const termo = encodeURIComponent(termosDeBusca[exec.scenario.iterationInTest]);

  http.get(url`http://127.0.0.1:9999/pessoas?pagina=0&limite=50&t=${termo}`, {
    responseCallback: http.expectedStatuses(200),
    tags: { name: 'PesquisaValida' }
  });
}

export function pesquisaInvalida () {
  http.get(url`http://127.0.0.1:9999/pessoas`, {
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
