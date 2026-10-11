# Dashboard Executivo Kind Brasil (Mobile First) - 24/09/2026

Aplicação web mobile-first de alta performance desenvolvida para acompanhamento gerencial e operacional de **Faturamento**, **Metas (Budget, Forecast, Lundi)**, **Performance pelos 10 Mercados** e **Produção Industrial**, com autenticação corporativa segura via **Microsoft 365 (SSO / Entra ID)** e integração com planilhas Excel hospedadas no **SharePoint**.

---

## 🔐 Autenticação Corporativa Microsoft 365 (SSO)

O projeto conta com autenticação oficial baseada na biblioteca **MSAL.js** (`@azure/msal-browser`), permitindo que a aplicação seja hospedada diretamente no **GitHub Pages** (ou qualquer servidor estático) com segurança de nível corporativo:

- **Sem necessidade de banco de senhas inseguro no Git**: A autenticação é delegada diretamente para a nuvem da Microsoft.
- **Suporte a Dois Fatores (MFA)**: Garante que apenas colaboradores autorizados da empresa consigam acessar os números estratégicos.
- **Modo Demonstração Integrado**: Permite acesso rápido de visualização para testes e apresentações.
- **Controle de Perfil**: Exibe o avatar, nome e e-mail corporativo do usuário logado no cabeçalho com botão de logout seguro.

### ⚙️ Como Ativar o Login Microsoft da sua Empresa (Gratuito):
1. Acesse o [Portal do Azure](https://portal.azure.com) com a sua conta corporativa;
2. Vá em **Microsoft Entra ID** (antigo Azure Active Directory) -> **Registros de aplicativo (App registrations)**;
3. Clique em **Novo registro (New registration)**:
   - **Nome**: *Kind Brasil Dashboard* (ou nome de sua preferência);
   - **Tipos de conta com suporte**: Selecione *Contas neste diretório organizacional (Locatário único)*;
   - **URI de redirecionamento**: Selecione a plataforma **SPA (Single-Page Application)** e informe a URL do seu GitHub Pages (ex: `https://seu-usuario.github.io/seu-repositorio/`) ou `http://localhost:8080/`;
4. Clique em **Registrar**;
5. Copie o **ID do Aplicativo (cliente)** / Application (client) ID;
6. No dashboard, clique no link **"Configurar Azure / Entra ID"** e cole o Client ID. As credenciais ficam salvas de forma segura no navegador!

---

## 📱 Destaques do Design Mobile First

- **Projetado para Smartphones & Tablets**: Visualização nítida em telas verticais com cards de toque, numerais tabulares (*JetBrains Mono*) e tipografia moderna (*Plus Jakarta Sans*).
- **Lundi por Mercado**: Acompanhamento visual dos **10 segmentos de mercado** com régua de **meta temporal em 78%** e opção de alternar para visualização por fábrica.
- **Rolagem Horizontal Inteligente**: Os gráficos diários de 30 dias contam com área de rolagem touch deslizante no celular, evitando esmagamento das colunas.
- **Gráficos Interativos em Chart.js**:
  - Meta diária ajustada de Faturamento: **3.177** (R$ mil)
  - Meta diária ajustada de Produção: **82,9 T** (Toneladas)
- **Filtros Simultâneos**: Permite cruzar qualquer Planta com qualquer um dos 10 Mercados com recálculo instantâneo de todos os gráficos e KPIs.
- **Tabela Diária Analítica**: Detalhamento dos 30 dias por Planta, Mercado, Status (Realizado vs Projetado), Faturamento e Produção.

---

## 📊 Estrutura dos Dados Oficiais (24/09/2026)

### 1. Header & Filtros
- **Data de Referência**: 24/09/2026
- **Planta Selecionada**: Kind Brasil (Consolidado) ou plantas individuais (Atibaia, Campo Magro, Castanhal, Joinville, Manaus, São Simão, Sarzedo, Simões Filho)
- **Mercados Oficiais (10)**:
  1. *Automotive* (Meta: 5.861 | 57,2%)
  2. *Building* (Meta: 4.196 | 60,6%)
  3. *Domestic Appliances* (Meta: 18.783 | 70,2%)
  4. *Fish* (Meta: 1.371 | 62,6%)
  5. *Food* (Meta: 5.150 | 67,8%)
  6. *Furniture* (Meta: 1.336 | 73,5%)
  7. *Health and Pharma* (Meta: 7.480 | 65,0%)
  8. *HVAC* (Meta: 2.269 | 73,0%)
  9. *Industrial solutions* (Meta: 958 | 100,0%)
  10. *Leisure and Sport* (Meta: 1.149 | 67,4%)

### 2. KPIs de Topo
- **Faturamento Realizado**: 32.670 (Dias 1 a 24)
- **Toneladas Realizadas**: 1.053,1 T
- **Carteira de Pedidos**: 19.063 (Dias 25 a 30)
- **Carteira + Fat.**: 51.733
- **Acumulado**: -14%
- **Projetado**: 44.460

### 3. Atingimento de Metas (Donuts)
- **Budget**: 69,3% atingido (Meta: 47.113 | Dif: -14.443)
- **Forecast**: 66,2% atingido (Meta: 49.359 | Dif: -16.689)
- **Lundi**: 67,3% atingido (Meta: 48.553 | Dif: -15.883)
- **Δ Proj. X Lundi**: -4.093

### 4. Produção Industrial (*D-2)
- **Meta Produção**: 1.413,0 T
- **Realizado Produção**: 1016,1 T (Dias 1 a 23 com defasagem \*D-2)
- **Acumulado**: -14%
- **Projetado**: 1.323,7 T
- **Meta Produção Diária Ajustada**: 82,9 T

---

## 🛡️ Distribuição Segura & Sigilo da Base (Modo Visualizador vs Admin)

Para distribuir este relatório para a diretoria e equipes sem compartilhar o link ou permissões da sua planilha do SharePoint:

### 1. Como funciona a proteção:
* **Usuários Finais (Visualizadores)**: Acessam o link comum.
  - ❌ **Não têm acesso ao SharePoint**: Eles não precisam de permissão na sua planilha.
  - ❌ **Não veem botões de configuração**: Botões de fonte de dados, download de modelos e upload de planilhas ficam 100% ocultos.
  - ✅ **Carregamento Instantâneo**: Consomem apenas o arquivo compilado `data.json` que já traz os totais do fechamento.
* **Administrador (Você)**:
  - Ativação simples adicionando `?admin=true` na URL ou clicando **5 vezes** sobre o título *"Kind Brasil"* no topo.
  - Acessa o botão **"Publicar Dados"** para carregar a nova planilha e clicar em **"Baixar data.json"**.

### 2. Fluxo diário de atualização:
1. Abra o painel no modo admin (`?admin=true`);
2. Carregue ou sincronize a planilha atualizada;
3. Clique em **"Baixar data.json"**;
4. Substitua o arquivo `data.json` no seu repositório Git e faça o commit;
5. Todos os visualizadores passarão a ver os novos números atualizados instantaneamente!

---

## 🚀 Como Publicar no GitHub Pages

1. Crie um repositório no GitHub;
2. Suba todos os arquivos do projeto (`index.html`, `app.js`, `auth.js`, `styles.css`, `data.json`);
3. No repositório do GitHub, vá em **Settings** -> **Pages** -> Selecione a branch `main` e a pasta `/ (root)` -> Clique em **Save**;
4. Em 1 minuto o site estará no ar na URL fornecida pelo GitHub!
3. No GitHub, acesse **Settings** -> **Pages** -> em *Branch*, selecione `main` e salve;
4. Sua aplicação estará no ar com a tela de login corporativo pronta para uso!
