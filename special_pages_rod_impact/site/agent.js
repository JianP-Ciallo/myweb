const DASH_SCOPE_ENDPOINT = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const API_KEY_STORAGE = "lsprepost_special_qwen_api_key";
const DEFAULT_MODEL = "qwen-plus";

const apiKeyInput = document.getElementById("apiKeyInput");
const modelSelect = document.getElementById("modelSelect");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const clearChatButton = document.getElementById("clearChatButton");
const agentStatus = document.getElementById("agentStatus");

const systemPrompt = [
  "你是 lsprepost-mcp 的 GitHub Pages 特供页面智能体。",
  "当前页面是静态网页，不能运行 Python 后端、不能启动 MCP Server、不能写入 workspace、不能打开 LS-PrePost。",
  "当前展示场景是 rod_impact_plate：实心圆柱杆以初始速度冲击固定钢板。",
  "你可以解释场景参数、LS-DYNA/LS-PrePost 建模思路、结果文件含义和本地运行步骤。",
  "当用户要求生成 model.k、运行后端或打开 LS-PrePost 时，提醒用户下载完整本地版并运行 start_web_app.cmd。",
  "回答要简洁、工程化，避免编造求解结果。"
].join("\n");

function setStatus(text) {
  agentStatus.textContent = text;
}

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setBusy(isBusy) {
  sendButton.disabled = isBusy;
  chatInput.disabled = isBusy;
  sendButton.textContent = isBusy ? "发送中..." : "发送";
}

function getApiKey() {
  return apiKeyInput.value.trim();
}

function saveApiKey() {
  const apiKey = getApiKey();
  if (apiKey) {
    sessionStorage.setItem(API_KEY_STORAGE, apiKey);
  } else {
    sessionStorage.removeItem(API_KEY_STORAGE);
  }
}

function loadApiKey() {
  const saved = sessionStorage.getItem(API_KEY_STORAGE);
  if (saved) {
    apiKeyInput.value = saved;
    setStatus("API Key 已从当前浏览器会话读取。");
  }
}

function ensureDefaultModel() {
  if (!modelSelect.value) {
    modelSelect.value = DEFAULT_MODEL;
  }
}

function collectMessages(userText) {
  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        "页面上下文：GitHub Pages 静态工作台，展示 rod_impact_plate 圆柱杆冲击钢板。",
        "下载链接：../downloads/lsprepost-mcp-special-rod-impact.zip。",
        `用户问题：${userText}`
      ].join("\n")
    }
  ];
}

async function callQwen(apiKey, model, userText) {
  const response = await fetch(DASH_SCOPE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: collectMessages(userText),
      temperature: 0.3
    })
  });

  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`接口返回了非 JSON 内容：${responseText.slice(0, 180)}`);
  }

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || response.statusText;
    throw new Error(`千问接口请求失败：${message}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("千问接口没有返回可显示的回复内容。");
  }
  return content;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const apiKey = getApiKey();
  const userText = chatInput.value.trim();
  const model = modelSelect.value;

  if (!apiKey) {
    addMessage("error", "请先输入阿里千问 API Key。");
    setStatus("缺少 API Key。");
    return;
  }

  if (!userText) {
    setStatus("请输入一个问题。");
    return;
  }

  saveApiKey();
  addMessage("user", userText);
  chatInput.value = "";
  setBusy(true);
  setStatus(`正在请求 ${model}...`);

  try {
    const answer = await callQwen(apiKey, model, userText);
    addMessage("assistant", answer);
    setStatus("回复完成。");
  } catch (error) {
    addMessage("error", `${error.message}\n如果浏览器拦截跨域请求，请下载本地版或配置自己的代理服务。`);
    setStatus("请求失败。");
  } finally {
    setBusy(false);
  }
});

apiKeyInput.addEventListener("change", saveApiKey);

clearChatButton.addEventListener("click", () => {
  chatMessages.innerHTML = "";
  addMessage("assistant", "对话已清空。你可以继续询问 rod_impact_plate 场景、参数或本地运行步骤。");
  setStatus("对话已清空。");
});

loadApiKey();
ensureDefaultModel();
