(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const byId = id => document.getElementById(id);
  const welcome = byId('welcomeDialog');
  if (welcome) {
    const open = () => { if (!welcome.open) welcome.showModal(); };
    const close = () => welcome.close();
    byId('openWelcome').addEventListener('click', open);
    byId('enterWorkbench').addEventListener('click', close);
    byId('closeWelcome').addEventListener('click', close);
    open();
    return;
  }

  const page = document.body.dataset.defensePage;
  if (!page) return;

  const frame = $('.defense-model-frame');
  const viewButton = id => frame?.contentDocument?.getElementById(id);
  const useView = id => viewButton(id)?.click();
  const roof = visible => {
    const checkbox = viewButton('showRoof');
    if (checkbox && checkbox.checked !== visible) checkbox.click();
  };
  function activate(element, handler) {
    if (!element) return;
    element.dataset.defenseEnabled = 'true';
    element.disabled = false;
    element.addEventListener('click', handler);
  }
  function text(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value;
  }

  const views = {
    fitView:'fitDemo', fitScene:'fitDemo', isoView:'fitDemo', topView:'topView',
    frontView:'frontView', view3d:'fitDemo', viewPlan:'topView', savePng:'captureDemo',
  };
  for (const [button, action] of Object.entries(views)) activate(byId(button), () => useView(action));

  const toggleRoof = byId('showRoof') ?? byId('refinedRoof');
  toggleRoof?.addEventListener('change', () => roof(toggleRoof.checked));
  frame?.addEventListener('load', () => { if (toggleRoof) roof(toggleRoof.checked); });
  for (const button of $$('[data-view]')) {
    const actions = { whole:'fitDemo', floor:'topView', plan:'topView', front:'frontView' };
    if (!(button.dataset.view in actions)) continue;
    activate(button, () => {
      for (const peer of $$('[data-view]')) peer.classList.toggle('active', peer === button);
      roof(button.dataset.view !== 'floor');
      if (toggleRoof) toggleRoof.checked = button.dataset.view !== 'floor';
      useView(actions[button.dataset.view]);
      text('#viewState', button.textContent);
    });
  }
  if (page === 'building') {
    text('#templateSummary', '三层阳台住宅 · 16.8 × 12.0 m');
    byId('level')?.addEventListener('change', event => useView(event.target.selectedIndex ? 'topView' : 'fitDemo'));
    for (const id of ['showWindows','showStairs','showGround','showLabels','section']) {
      const field = byId(id);
      if (field) field.disabled = true;
    }
  }

  for (const tab of $$('[data-tab]')) activate(tab, () => {
    for (const peer of $$('[data-tab]')) {
      const active = peer === tab;
      peer.classList.toggle('active', active);
      peer.setAttribute('aria-selected', String(active));
    }
    for (const pane of $$('[data-pane]')) pane.hidden = pane.dataset.pane !== tab.dataset.tab;
  });

  if (page === 'modeling') {
    const inspector = byId('rightInspector');
    activate(byId('toggleTaskPanel'), event => {
      inspector.hidden = !inspector.hidden;
      event.currentTarget.setAttribute('aria-expanded', String(!inspector.hidden));
    });
    for (const tab of $$('[data-inspector-target]')) activate(tab, () => {
      for (const peer of $$('[data-inspector-target]')) {
        const selected = peer === tab;
        peer.classList.toggle('active', selected);
        peer.setAttribute('aria-selected', String(selected));
        byId(peer.dataset.inspectorTarget)?.classList.toggle('hidden', !selected);
      }
    });
    activate(byId('fullscreenView'), () => byId('modelViewport').requestFullscreen()?.catch(() => {}));

    const projectName = byId('projectName');
    projectName.addEventListener('input', () => text('#contextProject', projectName.value.trim() || '未填写'));
    const hint = byId('viewerHint');
    const empty = byId('resultEmptyState');
    for (const tab of $$('[data-viewport-mode]')) activate(tab, () => {
      const results = tab.dataset.viewportMode === 'results';
      for (const peer of $$('[data-viewport-mode]')) {
        const selected = peer === tab;
        peer.classList.toggle('active', selected);
        peer.setAttribute('aria-selected', String(selected));
      }
      byId('modelViewport').classList.toggle('result-mode', results);
      hint.hidden = results;
      empty.classList.toggle('hidden', !results);
    });

    const resourceButtons = $$('[data-resource-panel]');
    const selectResource = selected => {
      for (const button of resourceButtons) {
        const active = button === selected;
        button.setAttribute('aria-selected', String(active));
        button.classList.toggle('active', active);
        byId(button.dataset.resourcePanel).classList.toggle('hidden', !active);
      }
    };
    for (const button of resourceButtons) activate(button, () => {
      selectResource(button.getAttribute('aria-selected') === 'true' ? null : button);
    });
    for (const button of $$('[data-close-resource]')) activate(button, () => selectResource(null));

    activate(byId('resolve'), () => {
      const invalid = $$('[data-model-parameter]').find(field => !field.reportValidity());
      text('#modelingStatus', invalid ? '请检查尺寸参数' : '参数表单已检查');
    });
    activate(byId('generate'), () => {
      text('#modelingStatus', '生成模型需在本地工作台完成');
    });
    const mode = byId('modelMode');
    mode?.addEventListener('change', () => {
      byId('controlledScenePanel')?.classList.toggle('hidden', mode.value !== 'controlled');
      byId('assemblyPanel')?.classList.toggle('hidden', mode.value !== 'assembly');
    });
  }

  if (page === 'refined') {
    const stepTitle = $('[data-refined-step-title]');
    const fields = $('[data-refined-schema-fields]') ?? $('#refinedBlastConfigPanel');
    const notes = [
      '浏览建筑整体与洞口外观。', '查看三层住宅的立面与层数示例。', '查看连接配置所在步骤。',
      '浏览外墙、门窗与阳台的可视示例。', '查看材料与截面配置所在步骤。', '查看网格、地面与范围所在步骤。',
      '查看工况与输出配置所在步骤。', '查看检查与生成所在步骤。',
    ];
    const detail = document.createElement('p');
    detail.className = 'defense-note';
    detail.textContent = notes[0];
    fields?.prepend(detail);
    for (const button of $$('[data-refined-section]')) activate(button, () => {
      const index = Number(button.dataset.refinedSection) - 1;
      for (const peer of $$('[data-refined-section]')) peer.classList.toggle('is-active', peer === button);
      if (stepTitle) stepTitle.textContent = String(index + 1).padStart(2,'0') + ' · ' + button.querySelector('small').textContent;
      detail.textContent = notes[index];
    });
    for (const tab of $$('[data-refined-inspector-tab]')) activate(tab, () => {
      for (const peer of $$('[data-refined-inspector-tab]')) {
        peer.setAttribute('aria-selected', String(peer === tab));
        peer.tabIndex = peer === tab ? 0 : -1;
      }
      for (const pane of $$('[data-refined-inspector-panel]')) pane.hidden = pane.dataset.refinedInspectorPanel !== tab.dataset.refinedInspectorTab;
    });
    const layer = $('[data-refined-layer-popover]');
    const layerToggle = $('[data-refined-layer-toggle]');
    function toggleLayer(open) {
      layer.hidden = !open;
      layerToggle.setAttribute('aria-expanded', String(open));
    }
    for (const button of $$('[data-refined-camera]')) {
      const actions = {iso:'fitDemo', front:'frontView', top:'topView'};
      activate(button, () => useView(actions[button.dataset.refinedCamera]));
    }
    activate(layerToggle, () => toggleLayer(layer.hidden));
    activate($('[data-refined-layer-close]'), () => toggleLayer(false));
    activate($('[data-refined-preview]'), () => useView('fitDemo'));
    activate($('[data-refined-assessment]'), () => { window.location.href = './damage_assessment_demo.html'; });
    text('[data-refined-layer-count]', '1/1');
  }

  if (page === 'assessment') {
    const examples = {
      complete: ['字段齐全','构件明细已登记','区域明细已登记'],
      partial: ['部分字段缺失','构件明细已登记','区域明细待补充'],
      blocked: ['关键字段缺失','等待构件数据','等待区域数据'],
    };
    const select = $('[data-demo-mode]');
    const update = () => {
      const [overall, building, ground] = examples[select.value];
      text('[data-demo-status]','已载入固定展示样例');
      text('[data-demo-overall]', overall);
      text('[data-demo-building]', building);
      text('[data-demo-ground]', ground);
      text('[data-demo-ground-metrics]', ground + ' · 示例');
      text('[data-demo-components]', building + '；' + ground);
      text('[data-demo-limitations]', '样例用于展示字段状态、明细与报告入口。');
      text('[data-demo-rules]', '展示样例采用固定状态。');
      text('[data-demo-identity]', '项目展示 · 固定样例');
      text('[data-demo-detail]', '此处展示选中构件的结果字段。');
      $('.demo-shell').dataset.demoState = 'ready';
    };
    activate($('[data-demo-evaluate]'), update);
    activate($('[data-demo-fit]'), () => useView('fitDemo'));
    const wallToggle = $('[data-demo-hide-walls]');
    if (wallToggle) {
      wallToggle.parentElement.lastChild.textContent = '隐藏屋面';
      wallToggle.addEventListener('change', () => roof(!wallToggle.checked));
    }
    update();
  }

  for (const button of $$('button:not([data-defense-enabled])')) {
    if (button.closest('dialog') || button.type === 'reset') continue;
    button.disabled = true;
    button.title = '工程操作可在原工作台使用';
  }
  for (const file of $$('input[type="file"]')) file.disabled = true;
  for (const form of $$('form:not([method="dialog"])')) form.addEventListener('submit', event => event.preventDefault());
  for (const element of $$('[role="status"]:not(#modelingStatus)')) {
    if (/正在载入|等待加载|正在初始化/.test(element.textContent)) element.textContent = '静态样例已就绪';
  }
})();
