const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen3.6-plus';

const systemPrompt = `你是一个专业的学习笔记整理助手。请根据用户提供的原始笔记或要求，输出结构化内容。通常包含：
1. 【核心摘要】：用一两句话总结核心主旨。
2. 【知识点梳理】：用 Markdown 列表或表格清晰列出重点。
3. 【复习测试】：生成 2-3 个自测问答题。
对于用户后续修改要求，如“更简短”“更适合考试复习”“改成表格”，请基于上下文直接输出修改后的最终结果。`;

const state = {
  apiKey: '',
  chatHistory: [{ role: 'system', content: systemPrompt }],
  isLoading: false,
  theme: 'light'
};

const els = {
  apiKeyInput: document.querySelector('#apiKeyInput'),
  toggleKeyBtn: document.querySelector('#toggleKeyBtn'),
  clearKeyBtn: document.querySelector('#clearKeyBtn'),
  noteInput: document.querySelector('#noteInput'),
  sendBtn: document.querySelector('#sendBtn'),
  resetChatBtn: document.querySelector('#resetChatBtn'),
  chatWindow: document.querySelector('#chatWindow'),
  errorBox: document.querySelector('#errorBox'),
  loadingBox: document.querySelector('#loadingBox'),
  conversationStatus: document.querySelector('#conversationStatus'),
  themeToggleBtn: document.querySelector('#themeToggleBtn'),
  helpBtn: document.querySelector('#helpBtn'),
  helpDialog: document.querySelector('#helpDialog'),
  closeHelpBtn: document.querySelector('#closeHelpBtn')
};

function init() {
  if (window.marked) {
    marked.setOptions({ breaks: true, gfm: true });
  }

  bindEvents();
  renderMessages();
  updateControls();
  applyTheme('light');
  refreshIcons();
}

function bindEvents() {
  els.clearKeyBtn.addEventListener('click', clearApiKey);
  els.toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  els.themeToggleBtn.addEventListener('click', toggleTheme);
  els.sendBtn.addEventListener('click', handleSend);
  els.resetChatBtn.addEventListener('click', resetConversation);
  els.helpBtn.addEventListener('click', () => els.helpDialog.showModal());
  els.closeHelpBtn.addEventListener('click', () => els.helpDialog.close());

  els.noteInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSend();
    }
  });

  document.querySelectorAll('[data-suggestion]').forEach((button) => {
    button.addEventListener('click', () => {
      els.noteInput.value = button.dataset.suggestion;
      els.noteInput.focus();
    });
  });
}

function clearApiKey() {
  state.apiKey = '';
  els.apiKeyInput.value = '';
  hideError();
  flashStatus('已清除');
}

function toggleApiKeyVisibility() {
  const isPassword = els.apiKeyInput.type === 'password';
  els.apiKeyInput.type = isPassword ? 'text' : 'password';
  els.toggleKeyBtn.innerHTML = isPassword ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
  refreshIcons();
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  els.themeToggleBtn.innerHTML = theme === 'dark'
    ? '<i data-lucide="sun"></i>浅色'
    : '<i data-lucide="moon"></i>黑色';
  els.themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? '切换浅色界面' : '切换黑色界面');
  refreshIcons();
}

async function handleSend() {
  const apiKey = els.apiKeyInput.value.trim() || state.apiKey;
  const userText = els.noteInput.value.trim();

  if (!apiKey) {
    showError('请输入 API Key。');
    return;
  }

  if (!userText) {
    showError('请输入笔记或修改要求。');
    return;
  }

  state.apiKey = apiKey;
  hideError();
  setLoading(true);

  state.chatHistory.push({ role: 'user', content: userText });
  els.noteInput.value = '';
  renderMessages();

  try {
    const reply = await callLLM(state.chatHistory, apiKey);
    state.chatHistory.push({ role: 'assistant', content: reply });
    renderMessages();
  } catch (error) {
    state.chatHistory.pop();
    renderMessages();
    showError(getFriendlyErrorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function callLLM(messages, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    let message = `请求失败：${response.status}`;

    try {
      const data = await response.json();
      message = data.error?.message || data.message || message;
    } catch (_) {
      message = response.statusText || message;
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('模型返回为空，请稍后重试。');
  }

  return content;
}

function renderMessages() {
  const visibleMessages = state.chatHistory.filter((message) => message.role !== 'system');

  if (visibleMessages.length === 0) {
    els.chatWindow.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i data-lucide="notebook-tabs"></i>
        </div>
        <h3>先放一段笔记进来</h3>
        <p>生成后可继续追问或修改。</p>
      </div>
    `;
  } else {
    els.chatWindow.innerHTML = visibleMessages.map((message) => {
      const isUser = message.role === 'user';
      const label = isUser ? '你' : '助手';
      const icon = isUser ? 'user-round' : 'sparkles';
      const body = isUser ? escapeHtml(message.content) : renderMarkdown(message.content);

      return `
        <article class="message ${isUser ? 'user' : 'assistant'}">
          <div class="message-meta">
            <i data-lucide="${icon}"></i>
            ${label}
          </div>
          <div class="bubble ${isUser ? '' : 'markdown-body'}">${body}</div>
        </article>
      `;
    }).join('');
  }

  updateConversationStatus(visibleMessages);
  scrollLatestMessageIntoView(visibleMessages);
  refreshIcons();
}

function renderMarkdown(text) {
  if (!window.marked || !window.DOMPurify) {
    return escapeHtml(text).replaceAll('\n', '<br>');
  }

  return DOMPurify.sanitize(marked.parse(text));
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resetConversation() {
  state.chatHistory = [{ role: 'system', content: systemPrompt }];
  hideError();
  els.noteInput.value = '';
  renderMessages();
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  els.loadingBox.classList.toggle('hidden', !isLoading);
  updateControls();
}

function updateControls() {
  els.sendBtn.disabled = state.isLoading;
  els.resetChatBtn.disabled = state.isLoading;
  els.clearKeyBtn.disabled = state.isLoading;
  els.noteInput.disabled = state.isLoading;
  els.apiKeyInput.disabled = state.isLoading;
}

function showError(message) {
  els.errorBox.textContent = message;
  els.errorBox.classList.remove('hidden');
}

function hideError() {
  els.errorBox.textContent = '';
  els.errorBox.classList.add('hidden');
}

function flashStatus(message) {
  const previous = els.conversationStatus.textContent;
  els.conversationStatus.textContent = message;
  window.setTimeout(() => {
    els.conversationStatus.textContent = previous;
  }, 1400);
}

function updateConversationStatus(messages) {
  const userTurns = messages.filter((message) => message.role === 'user').length;
  const assistantTurns = messages.filter((message) => message.role === 'assistant').length;

  if (userTurns === 0) {
    els.conversationStatus.textContent = '等待输入';
    els.sendBtn.innerHTML = '<i data-lucide="sparkles"></i>生成';
    return;
  }

  els.conversationStatus.textContent = `${userTurns} 轮输入 · ${assistantTurns} 次生成`;
  els.sendBtn.innerHTML = '<i data-lucide="refresh-cw"></i>继续修改';
}

function getFriendlyErrorMessage(error) {
  if (error.status === 401) {
    return 'API Key 无效，请检查后重试。';
  }

  if (error.status === 429) {
    return '请求过快或额度不足，请稍后重试。';
  }

  if (error.status >= 500) {
    return '服务暂时异常，请稍后重试。';
  }

  if (error instanceof TypeError) {
    return '网络请求失败，请检查连接或浏览器访问权限。';
  }

  return error.message || '请求失败，请稍后重试。';
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function scrollLatestMessageIntoView(messages) {
  if (messages.length === 0) {
    return;
  }

  window.requestAnimationFrame(() => {
    els.chatWindow.scrollTo({
      top: els.chatWindow.scrollHeight,
      behavior: 'smooth'
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
