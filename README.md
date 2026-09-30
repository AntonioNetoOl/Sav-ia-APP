# Savóia APP

Aplicativo mobile do ecossistema Savóia, desenvolvido para centralizar a experiência de usuários e associados em uma única interface.

## Visão geral

O projeto reúne fluxos de autenticação, cadastro, recuperação de acesso, área do sócio, pagamentos, fidelidade, perfil e acesso a informações institucionais.

O backend da aplicação é mantido separadamente em:

`AntonioNetoOl/Savoia_API`

## Stack

- React Native
- Expo
- JavaScript / TypeScript
- React Navigation
- Axios
- AsyncStorage
- Expo Router e componentes nativos do ecossistema Expo

## Funcionalidades presentes

- login e cadastro de usuários;
- verificação de e-mail;
- recuperação e redefinição de senha;
- navegação autenticada;
- home do aplicativo;
- área do sócio;
- pagamentos;
- informações de fidelidade e benefícios;
- perfil do usuário;
- menu institucional;
- acesso a informações de subsedes;
- integração com API REST.

## Estrutura principal

```text
src/
├── api/          clientes de integração com a API
├── components/   componentes reutilizáveis
├── constants/    configurações e links externos
├── hooks/        hooks da aplicação
├── navigation/   configuração de navegação
├── screens/      telas e fluxos do aplicativo
└── utils/        armazenamento, máscaras e utilitários
```

## Executar localmente

### Pré-requisitos

- Node.js
- npm
- ambiente compatível com Expo
- backend `Savoia_API` disponível para os fluxos integrados

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
```

Também estão disponíveis:

```bash
npm run android
npm run ios
npm run web
```

A configuração de comunicação com a API pode ser consultada em:

`src/constants/config.js`

## Testes da área do sócio

Com Node.js 22 e as dependências do lockfile instaladas (`npm ci`), execute `npm test`. A suíte usa Jest 29, o preset Expo 54 e React Native Testing Library 14; `test-renderer` 1.1 acompanha o React 19.1 do app. São dependências de desenvolvimento, sem alteração do SDK ou de dependências diretas de produção.

Os 32 testes renderizam a tela e a navegação, simulando apenas HTTP, armazenamento e recursos nativos do ambiente de testes. Cobrem falha do resumo, carregamento, nova tentativa, resposta inválida, sessão expirada, retorno ao login, troca de sessão e respostas atrasadas. Também preservam os três estados associativos válidos e o tratamento separado de falhas do catálogo de planos. Validam a apresentação de vencimento, último lançamento e recorrência, dados financeiros ausentes ou inválidos e navegação para o histórico de demonstração e de volta. Não acessam o backend nem o banco e não substituem testes em dispositivo Android/iOS.

A tela recarrega ao ganhar foco e descarta o resumo ao sair ou iniciar outra consulta. Erros não são apresentados como `nao_socio`; os botões de associação só aparecem após um resumo válido. Um `401` remove apenas o token usado pela requisição, para que respostas antigas não encerrem uma sessão nova.

## Pagamentos na área do sócio

O cartão usa `payments.nextChargeDueAt`, `payments.latestStatus` e `payments.recurrenceEnabled` de GET `/api/member/summary`. Vencimento e situação do último lançamento são apresentados separadamente: um lançamento pago não comprova que o próximo vencimento esteja quitado. Datas válidas em `YYYY-MM-DD` ou ISO UTC retornado pela API preservam o dia informado, independentemente do fuso do aparelho.

Campos explicitamente nulos indicam ausência de vencimento ou lançamento informado; campos ausentes, inválidos ou status desconhecidos ficam indisponíveis. Recorrência só é apresentada como ativa/desativada quando o campo é booleano. Essas informações não alteram o estado associativo. A API ainda não fornece dias de atraso ou prazo de tolerância; o aplicativo não calcula essas regras.

GET `/api/me/payments` e GET `/api/me/payment-cards` ainda retornam exemplos no backend. O acesso ao histórico e a tela Pagamentos identificam a demonstração. Checkout, cobrança automática e cadastro real de cartão dependem da integração financeira futura.

## Status

Projeto em desenvolvimento e evolução contínua, com integração entre aplicativo, autenticação, domínio de associados, pagamentos e fidelidade.

## Objetivo técnico

Além da aplicação em si, este repositório demonstra organização de um projeto mobile com separação de responsabilidades, componentes reutilizáveis, navegação, persistência local e integração com uma API REST externa.

## Desenvolvimento com Codex

- [Instruções para agentes](AGENTS.md)
- [Harness de engenharia](docs/engineering/harness-engenharia.md)
- [Adoção de Ponytail, skills e TDD](docs/engineering/adocao-codex.md)
