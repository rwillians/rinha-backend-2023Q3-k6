# Testes de carga com a ferramente K6

Testes de stress e de breaking point para a Rinha de Backend 2023Q3, escritos utilizando [K6](https://k6.io) (ferramenta de teste) e [Faker](https://www.npmjs.com/package/@faker-js/faker) (lib de geração de carga).


## TL;DR:

> *Note*
> Supondo que você esteja rodando Linux, pelo meno como subsystem.

1.  Clone como submodule:

    ```sh
    git submodule add -b main https://github.com/rwillians/rinha-backend-2023Q3-k6 .k6
    ```

3.  Abra para o diretório onde o submodule foi adicionado:

    ```sh
    cd .k6
    ```

2.  Use [`asdf-vm`](https://github.com/asdf-vm/asdf) para instalar NodeJS (ou se certifique de ter uma versão recente já instalada):

    ```sh
    asdf install
    ```

5.  Instale os pacotes necessário com o comando:

    ```sh
    npm install
    ```

4.  Gere a carga de teste:

    ```sh
    ./gerar-carga
    ```

5.  Instale o CLI do K6 ([instruções aqui](https://k6.io/docs/get-started/installation/)).

    > **Note**
    > Voce pode -- e recomendo -- conectar seu CLI do K6 com sua conta do Grafana Cloud, onde você poderá ver aqueles relatórios bonitinhos com gráficos e tals. A conta pode ser o plano gratuito mesmo.
    >
    > Para conectar ou criar sua conta, execute o comando `k6 login`.

6.  Suba sua API;

7.  Quando usa API estiver pronta para receber requisições, execute o teste com o comando:

    ```sh
    k6 run tests/teste-de-breakpoint.js
    ```

    Caso você tenha conectado sua conta do Grafana Cloud, utilize o comando:

    ```sh
    k6 run --out=cloud tests/teste-de-breakpoint.js
    ```

Para executar o teste de estresse, é a mesma coisa mas ao invés de rodar `k6 run tests/teste-de-breakpoint.js` você rodará `k6 run tests/teste-de-stress.js`.


