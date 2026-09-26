/**
 * AUTH.JS - Gerenciador de Autenticação Microsoft 365 / Entra ID (SSO)
 * Utiliza a biblioteca oficial @azure/msal-browser para autenticação segura
 * no GitHub Pages ou em qualquer servidor estático.
 */

class MicrosoftAuthManager {
  constructor() {
    this.clientId = (localStorage.getItem('ms_client_id') || '').trim();

    // Auto-correção para evitar o erro "could not resolve endpoints" caso 'tenant' tenha sido digitado literalmente
    let rawTenant = (localStorage.getItem('ms_tenant_id') || '').trim();
    if (!rawTenant || rawTenant.toLowerCase() === 'tenant' || rawTenant.toLowerCase() === '{tenant}') {
      rawTenant = 'organizations'; // Endpoint universal corporativo Microsoft 365
      localStorage.setItem('ms_tenant_id', 'organizations');
    }
    this.tenantId = rawTenant;

    this.msalInstance = null;
    this.currentUser = null;
    this.isDemoBypassed = sessionStorage.getItem('dash_demo_bypass') === 'true';

    this.init();
  }

  async init() {
    this.setupUIEventListeners();
    await this.initMsal();
    this.checkCurrentSession();
    this.updateRedirectUriNotice();
  }

  // Obtém a URL exata de redirecionamento limpa (sem query strings ou hash)
  getCleanRedirectUri() {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:8080/';
    }
    return window.location.origin + window.location.pathname;
  }

  // Configura a instância oficial da biblioteca MSAL
  async initMsal() {
    if (typeof msal === 'undefined') {
      console.warn("MSAL.js não foi carregado pelo CDN.");
      return;
    }

    const safeTenant = (!this.tenantId || this.tenantId.toLowerCase() === 'tenant') ? 'organizations' : this.tenantId;
    const redirectUrl = this.getCleanRedirectUri();

    const msalConfig = {
      auth: {
        clientId: this.clientId || '00000000-0000-0000-0000-000000000000',
        authority: `https://login.microsoftonline.com/${safeTenant}`,
        redirectUri: redirectUrl
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
      }
    };

    try {
      this.msalInstance = new msal.PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();
    } catch (e) {
      console.warn("Aviso na inicialização do MSAL:", e);
    }
  }

  // Atualiza aviso de URL de redirecionamento para o usuário
  updateRedirectUriNotice() {
    const codeEl = document.getElementById('current-redirect-uri-display');
    const warningFileEl = document.getElementById('azure-file-protocol-warning');

    const exactUri = this.getCleanRedirectUri();

    if (codeEl) codeEl.innerText = exactUri;

    if (warningFileEl) {
      if (window.location.protocol === 'file:') {
        warningFileEl.classList.remove('hidden');
      } else {
        warningFileEl.classList.add('hidden');
      }
    }
  }

  // Verifica se o usuário já possui sessão ativa salva
  checkCurrentSession() {
    if (this.isDemoBypassed) {
      this.showDashboard({
        name: "Usuário Demonstração",
        username: "demo@kindbrasil.com.br",
        isDemo: true
      });
      return;
    }

    if (this.msalInstance) {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        this.currentUser = accounts[0];
        this.showDashboard(this.currentUser);
        return;
      }
    }

    this.showLoginScreen();
  }

  // Efetua login interativo com popup oficial da Microsoft
  async login() {
    // 1. Verificação se está rodando em file://
    if (window.location.protocol === 'file:') {
      alert(
        "Atenção: A Microsoft exige que a aplicação rode via servidor web (HTTP ou HTTPS).\n\n" +
        "Ela NÃO permite autenticação em arquivos abertos diretamente como 'file://'.\n\n" +
        "Como testar o login localmente:\n" +
        "1. No seu terminal, execute:\n   python3 -m http.server 8080\n\n" +
        "2. Acesse no navegador: http://localhost:8080/\n\n" +
        "Ou publique o projeto no GitHub Pages e acesse pela URL pública HTTPS."
      );
      return;
    }

    // 2. Verificação do Client ID
    if (!this.clientId || this.clientId === '00000000-0000-0000-0000-000000000000') {
      this.openAzureConfigModal("Por favor, informe o Client ID (ID do Aplicativo) gerado no Azure da sua empresa.");
      return;
    }

    if (!this.msalInstance) {
      await this.initMsal();
    }

    const loginRequest = {
      scopes: ["User.Read"]
    };

    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      this.currentUser = response.account;
      sessionStorage.removeItem('dash_demo_bypass');
      this.showDashboard(this.currentUser);
    } catch (err) {
      console.error("Erro no login Microsoft:", err);

      const fullError = `${err?.errorCode || ''} ${err?.message || ''} ${err?.errorMessage || ''} ${err?.subError || ''}`;

      // Tratamento do erro AADSTS500113 (No reply address is registered)
      if (fullError.includes('AADSTS500113') || fullError.toLowerCase().includes('no reply address') || fullError.toLowerCase().includes('reply address')) {
        const exactUri = this.getCleanRedirectUri();
        this.openAzureConfigModal(
          `⚠️ Erro AADSTS500113 (Endereço de resposta não cadastrado no Azure)\n\n` +
          `A Microsoft exige que a URL exata abaixo seja registrada no Azure Portal:\n` +
          `👉 ${exactUri}\n\n` +
          `Como resolver em 1 minuto:\n` +
          `1. Acesse o portal.azure.com e abra seu registro de aplicativo;\n` +
          `2. No menu lateral, clique em 'Autenticação' (Authentication);\n` +
          `3. Na plataforma 'Aplicativo de página única' (SPA), clique em 'Adicionar URI' e cole a URL acima;\n` +
          `4. Clique em 'Salvar' no topo da página e tente entrar novamente.`
        );
        return;
      }

      // Tratamento do erro de endpoints
      if (fullError.includes('could not resolve endpoints') || fullError.includes('openid_config_error') || fullError.includes('/tenant/')) {
        this.tenantId = 'organizations';
        localStorage.setItem('ms_tenant_id', 'organizations');
        await this.initMsal();
        alert("O Tenant ID era inválido e foi corrigido para 'organizations' (padrão corporativo).\n\nPor favor, clique em 'Entrar com a Conta Microsoft' novamente.");
        return;
      }

      if (err.errorCode === 'popup_window_error' || err.message?.includes('popup')) {
        alert("Janela pop-up bloqueada pelo navegador do celular. Tentando redirecionamento...");
        this.msalInstance.loginRedirect(loginRequest);
      } else {
        alert(`Falha na autenticação Microsoft: ${err.message || 'Erro desconhecido'}`);
      }
    }
  }

  // Logout oficial da conta Microsoft
  async logout() {
    sessionStorage.removeItem('dash_demo_bypass');
    if (this.msalInstance && this.currentUser && !this.currentUser.isDemo) {
      try {
        await this.msalInstance.logoutPopup({
          account: this.currentUser
        });
      } catch (e) {
        console.warn("Erro no logout popup:", e);
      }
    }
    this.currentUser = null;
    this.showLoginScreen();
  }

  bypassToDemo() {
    this.isDemoBypassed = true;
    sessionStorage.setItem('dash_demo_bypass', 'true');
    this.showDashboard({
      name: "Acesso de Teste (Demo)",
      username: "visitante@kindbrasil.com.br",
      isDemo: true
    });
  }

  showLoginScreen() {
    const loginScreen = document.getElementById('login-gatekeeper');
    const appHeader = document.querySelector('header');
    const appNav = document.querySelector('nav');
    const appMain = document.querySelector('main');

    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appHeader) appHeader.classList.add('hidden');
    if (appNav) appNav.classList.add('hidden');
    if (appMain) appMain.classList.add('hidden');
  }

  showDashboard(user) {
    const loginScreen = document.getElementById('login-gatekeeper');
    const appHeader = document.querySelector('header');
    const appNav = document.querySelector('nav');
    const appMain = document.querySelector('main');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (appHeader) appHeader.classList.remove('hidden');
    if (appNav) appNav.classList.remove('hidden');
    if (appMain) appMain.classList.remove('hidden');

    this.updateUserHeaderUI(user);

    if (window.dashApp) {
      window.dashApp.updateAllViews();
    }
  }

  updateUserHeaderUI(user) {
    const nameEl = document.getElementById('user-profile-name');
    const emailEl = document.getElementById('user-profile-email');
    const avatarEl = document.getElementById('user-profile-avatar');

    const displayName = user.name || user.username || "Usuário";
    const displayEmail = user.username || user.email || "";

    if (nameEl) nameEl.innerText = displayName;
    if (emailEl) emailEl.innerText = displayEmail;

    if (avatarEl) {
      const initials = displayName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatarEl.innerText = initials || 'U';
    }
  }

  openAzureConfigModal(alertMsg = '') {
    const modal = document.getElementById('modal-azure-config');
    const inputClient = document.getElementById('azure-client-id-input');
    const inputTenant = document.getElementById('azure-tenant-id-input');
    const msgEl = document.getElementById('azure-modal-alert');

    this.updateRedirectUriNotice();

    if (inputClient) inputClient.value = this.clientId;
    if (inputTenant) {
      inputTenant.value = (this.tenantId && this.tenantId.toLowerCase() !== 'tenant') ? this.tenantId : 'organizations';
    }

    if (msgEl) {
      if (alertMsg) {
        msgEl.innerText = alertMsg;
        msgEl.classList.remove('hidden');
      } else {
        msgEl.classList.add('hidden');
      }
    }

    if (modal) modal.classList.remove('hidden');
  }

  closeAzureConfigModal() {
    const modal = document.getElementById('modal-azure-config');
    if (modal) modal.classList.add('hidden');
  }

  saveAzureConfig(clientId, tenantId) {
    const cleanClient = clientId.trim();
    let cleanTenant = (tenantId || '').trim();

    if (!cleanTenant || cleanTenant.toLowerCase() === 'tenant' || cleanTenant.toLowerCase() === '{tenant}') {
      cleanTenant = 'organizations';
    }

    this.clientId = cleanClient;
    this.tenantId = cleanTenant;

    localStorage.setItem('ms_client_id', this.clientId);
    localStorage.setItem('ms_tenant_id', this.tenantId);

    alert("Configurações salvas com sucesso! A aplicação será reinicializada.");
    this.closeAzureConfigModal();
    window.location.reload();
  }

  setupUIEventListeners() {
    const btnLoginMs = document.getElementById('btn-ms-login');
    if (btnLoginMs) {
      btnLoginMs.addEventListener('click', () => this.login());
    }

    const btnDemo = document.getElementById('btn-bypass-demo');
    if (btnDemo) {
      btnDemo.addEventListener('click', () => this.bypassToDemo());
    }

    const btnLogout = document.getElementById('btn-user-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logout());
    }

    const btnOpenAzureConfig = document.getElementById('btn-open-azure-config');
    const btnCloseAzureConfig = document.getElementById('btn-close-azure-config');
    const btnSaveAzureConfig = document.getElementById('btn-save-azure-config');
    const btnCopyUri = document.getElementById('btn-copy-redirect-uri');

    if (btnOpenAzureConfig) {
      btnOpenAzureConfig.addEventListener('click', () => this.openAzureConfigModal());
    }

    if (btnCloseAzureConfig) {
      btnCloseAzureConfig.addEventListener('click', () => this.closeAzureConfigModal());
    }

    if (btnSaveAzureConfig) {
      btnSaveAzureConfig.addEventListener('click', () => {
        const inputClient = document.getElementById('azure-client-id-input');
        const inputTenant = document.getElementById('azure-tenant-id-input');
        this.saveAzureConfig(
          inputClient ? inputClient.value : '',
          inputTenant ? inputTenant.value : ''
        );
      });
    }

    if (btnCopyUri) {
      btnCopyUri.addEventListener('click', () => {
        const uri = this.getCleanRedirectUri();
        navigator.clipboard.writeText(uri).then(() => {
          btnCopyUri.innerText = "Copiado!";
          setTimeout(() => { btnCopyUri.innerText = "Copiar URL"; }, 2000);
        });
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new MicrosoftAuthManager();
});
