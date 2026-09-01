(function () {
  'use strict';

  var PANEL_READY_DELAY_MS = 3000;
  var DEVICE_LEAD_ASK = 'After you press Proceed, within 120 seconds do one of the following:';
  var DEVICE_LEAD_WAIT = 'Within 120 seconds do one of the following:';
  var REBOOT_LEAD_ASK = 'Use the MODE button while the router is powered on:';
  var REBOOT_LEAD_WAIT =
    'If the router does not come back on its own, restart it with the MODE button while it is powered on:';

  var App = null;
  var tarPath = '';
  var running = false;
  var rebootTimer = null;
  var rebootElapsed = 0;
  var panelReadyTimer = null;
  var routerBoard = '';

  function $(id) {
    return document.getElementById(id);
  }

  function val(id) {
    return $(id).value.trim();
  }

  function num(id, fallback) {
    var n = parseInt($(id).value, 10);
    return n >= 1 && n <= 65535 ? n : fallback;
  }

  function show(id) {
    $(id).classList.remove('hidden');
  }

  function hide(id) {
    $(id).classList.add('hidden');
  }

  function applyButtonImage(prefix) {
    var board = routerBoard.replace(/\u00b2/g, '2').replace(/\u00b3/g, '3');
    var ax2 = /hap/i.test(board) && /ax\D*2/i.test(board);
    $(prefix + '-button-img').src = ax2 ? 'hap_ax2_button.jpg' : 'hap_ax3_button.jpg';
    $(prefix + '-button-img').alt = ax2
      ? 'Pressing the MODE button on the top of a hAP ax2'
      : 'Pressing the MODE button on the front of a hAP ax3';
    $(prefix + '-button-caption').textContent = ax2
      ? 'hAP ax2, MODE button on top of the case'
      : 'hAP ax3, MODE button on the front panel next to the USB port';
  }

  function setDeviceWaiting(waiting) {
    $('device-lead').textContent = waiting ? DEVICE_LEAD_WAIT : DEVICE_LEAD_ASK;
    $('device-wait').classList.toggle('hidden', !waiting);
    $('device-actions').classList.toggle('hidden', waiting);
  }

  function setRebootWaiting(waiting) {
    $('reboot-lead').textContent = waiting ? REBOOT_LEAD_WAIT : REBOOT_LEAD_ASK;
    $('reboot-ask').classList.toggle('hidden', waiting);
    $('reboot-wait').classList.toggle('hidden', !waiting);
    $('reboot-actions').classList.toggle('hidden', waiting);
  }

  function hideModals() {
    hide('modal-device');
    hide('modal-reboot');
    hide('modal-storage');
    stopRebootTimer();
  }

  function startRebootTimer() {
    stopRebootTimer();
    rebootElapsed = 0;
    $('reboot-elapsed').textContent = '0';
    var tick = function () {
      rebootElapsed += 1;
      $('reboot-elapsed').textContent = rebootElapsed;
      rebootTimer = setTimeout(tick, 1000);
    };
    rebootTimer = setTimeout(tick, 1000);
  }

  function stopRebootTimer() {
    if (rebootTimer) {
      clearTimeout(rebootTimer);
      rebootTimer = null;
    }
  }

  function init() {
    if (!window.go || !window.runtime || !window.go.main) {
      setTimeout(init, 50);
      return;
    }
    App = window.go.main.App;
    bindRuntimeEvents();
    bindUI();
    showVersion();
  }

  function showVersion() {
    App.AppVersion().then(function (v) {
      $('app-version').textContent = v;
    });
  }

  function bindUI() {
    $('btn-install').addEventListener('click', function () {
      startFlow(false);
    });
    $('btn-uninstall').addEventListener('click', function () {
      show('modal-uninstall');
    });
    $('btn-uninstall-ok').addEventListener('click', function () {
      hide('modal-uninstall');
      startFlow(true);
    });
    $('btn-uninstall-no').addEventListener('click', function () {
      hide('modal-uninstall');
    });
    $('btn-pick-tar').addEventListener('click', function () {
      App.SelectImageTar().then(function (path) {
        if (path) {
          tarPath = path;
          $('tar-path').textContent = path;
          document.querySelector('input[name="source"][value="local"]').checked = true;
        }
      });
    });
    $('btn-cancel').addEventListener('click', function () {
      App.CancelRun();
    });
    $('btn-back').addEventListener('click', backToForm);
    $('btn-again').addEventListener('click', backToForm);
    $('btn-device-ok').addEventListener('click', function () {
      setDeviceWaiting(true);
      App.ConfirmDeviceMode(true);
    });
    $('btn-device-no').addEventListener('click', function () {
      hide('modal-device');
      App.ConfirmDeviceMode(false);
    });
    $('btn-storage-ok').addEventListener('click', function () {
      var picked = document.querySelector('#storage-list input[name="storage"]:checked');
      hide('modal-storage');
      App.ConfirmStorage(picked ? picked.value : '');
    });
    $('btn-storage-no').addEventListener('click', function () {
      hide('modal-storage');
      App.ConfirmStorage('');
    });
    $('btn-reboot-ok').addEventListener('click', function () {
      setRebootWaiting(true);
      startRebootTimer();
      App.ConfirmReboot(true);
    });
    $('btn-reboot-no').addEventListener('click', function () {
      hide('modal-reboot');
      stopRebootTimer();
      App.ConfirmReboot(false);
    });
    $('btn-toggle-password').addEventListener('click', function () {
      var input = $('password');
      var wasHidden = input.type === 'password';
      input.type = wasHidden ? 'text' : 'password';
      $('icon-eye').classList.toggle('hidden', wasHidden);
      $('icon-eye-off').classList.toggle('hidden', !wasHidden);
      this.setAttribute('aria-label', wasHidden ? 'Hide password' : 'Show password');
    });
    $('btn-help').addEventListener('click', function () {
      App.OpenURL('https://docs.s4i.co/hc/nasnet/fa');
    });
    $('btn-telegram').addEventListener('click', function () {
      App.OpenURL('https://t.me/joinNASNETGroup');
    });
    $('btn-github').addEventListener('click', function () {
      App.OpenURL('https://github.com/nasnet-community/nasnet-panel/issues/new?template=bug_report.yml');
    });
  }

  function collectOptions() {
    var source = document.querySelector('input[name="source"]:checked').value;
    return {
      host: val('host'),
      sshPort: num('sshPort', 22),
      user: val('user') || 'admin',
      password: $('password').value,
      version: source === 'release' ? val('version') : '',
      imageTar: source === 'local' ? tarPath : '',
      lanPort: num('lanPort', 8080),
      httpsLanPort: num('httpsLanPort', 8443),
      skipLanBaseline: $('skipLanBaseline').checked,
      dryRun: $('dryRun').checked,
      noRollback: $('noRollback').checked,
    };
  }

  function showFormError(msg) {
    if (msg) {
      $('form-error').textContent = msg;
      show('form-error');
    } else {
      hide('form-error');
    }
  }

  function setFormBusy(busy) {
    $('btn-install').disabled = busy;
    $('btn-uninstall').disabled = busy;
  }

  function startFlow(uninstall) {
    var host = val('host');
    showFormError('');
    if (!host) {
      showFormError('Router IP is required.');
      return;
    }
    var source = document.querySelector('input[name="source"]:checked').value;
    if (!uninstall && source === 'release' && !val('version')) {
      showFormError('Enter a release tag or pick another image source.');
      return;
    }
    if (!uninstall && source === 'local' && !tarPath) {
      showFormError('Pick a local tar file or choose another image source.');
      return;
    }
    setFormBusy(true);
    var winboxPort = num('winboxPort', 8291);
    var sshPort = num('sshPort', 22);
    App.ProbeRouter(host, winboxPort, sshPort)
      .then(function (probe) {
        if (!probe.winbox || !probe.ssh) {
          setFormBusy(false);
          var parts = [];
          if (!probe.winbox) parts.push('Winbox port ' + winboxPort);
          if (!probe.ssh) parts.push('SSH port ' + sshPort);
          showFormError(
            'Cannot reach ' +
              host +
              ' on ' +
              parts.join(' and ') +
              '. Check the address and the ports under Advanced options.'
          );
          return null;
        }
        return uninstall ? App.UninstallSteps() : App.InstallSteps();
      })
      .then(function (steps) {
        if (!steps) return null;
        beginRun(uninstall, steps);
        var opts = collectOptions();
        return uninstall ? App.StartUninstall(opts) : App.StartInstall(opts);
      })
      .catch(function (err) {
        setFormBusy(false);
        if (running) {
          onRunError(String(err));
        } else {
          showFormError(String(err));
        }
      });
  }

  function beginRun(uninstall, steps) {
    running = true;
    clearTimeout(panelReadyTimer);
    $('run-title').textContent = uninstall ? 'Uninstalling' : 'Installing';
    var list = $('steps');
    list.innerHTML = '';
    steps.forEach(function (s) {
      var li = document.createElement('li');
      li.id = 'step-' + s.id;
      li.className = 'pending';
      li.innerHTML =
        '<div class="step-main">' +
        '<span class="step-icon"></span>' +
        '<span class="step-title"></span>' +
        '</div>' +
        '<div class="step-bar hidden"><div></div></div>' +
        '<div class="step-detail hidden"></div>';
      li.querySelector('.step-title').textContent = s.title;
      list.appendChild(li);
    });
    $('log').textContent = '';
    hide('router-info');
    hide('run-error');
    hide('done');
    hide('btn-back');
    show('btn-cancel');
    $('btn-cancel').disabled = false;
    hide('view-form');
    show('view-run');
  }

  function backToForm() {
    running = false;
    clearTimeout(panelReadyTimer);
    setFormBusy(false);
    hide('view-run');
    hideModals();
    show('view-form');
  }

  function setStep(id, status, detail) {
    var li = $('step-' + id);
    if (!li) return;
    li.className = status;
    var icon = li.querySelector('.step-icon');
    if (status === 'success') icon.textContent = '✓';
    else if (status === 'failed') icon.textContent = '✗';
    else if (status === 'skipped') icon.textContent = '–';
    else icon.textContent = '';
    var detailEl = li.querySelector('.step-detail');
    if (detail) {
      detailEl.textContent = detail;
      detailEl.classList.remove('hidden');
    }
    if (status === 'success' || status === 'failed' || status === 'skipped') {
      li.querySelector('.step-bar').classList.add('hidden');
    }
    if (status !== 'running') {
      hideModals();
    }
  }

  function onRunError(message) {
    $('run-error').textContent = message;
    show('run-error');
    hide('btn-cancel');
    show('btn-back');
    hideModals();
  }

  function appendLog(line) {
    var log = $('log');
    log.textContent += line + '\n';
    log.scrollTop = log.scrollHeight;
  }

  function bindRuntimeEvents() {
    window.runtime.EventsOn('install:step', function (data) {
      setStep(data.id, data.status, data.detail);
    });

    window.runtime.EventsOn('install:log', function (line) {
      appendLog(line);
    });

    window.runtime.EventsOn('install:progress', function (data) {
      var li = $('step-' + data.id);
      if (!li) return;
      var bar = li.querySelector('.step-bar');
      bar.classList.remove('hidden');
      bar.firstElementChild.style.width = Math.min(100, data.percent).toFixed(1) + '%';
      if (data.detail) {
        var detailEl = li.querySelector('.step-detail');
        detailEl.textContent = data.detail;
        detailEl.classList.remove('hidden');
      }
    });

    window.runtime.EventsOn('install:sysinfo', function (info) {
      routerBoard = info.board || '';
      var el = $('router-info');
      el.innerHTML = '';
      var facts = [
        'Board: ' + info.board,
        'Arch: ' + info.arch,
        'RouterOS ' + info.version,
        info.freeMb + ' MB free',
      ];
      if (info.storage) {
        facts.push(
          info.storageFreeMb > 0
            ? 'Storage: ' + info.storage + ' (' + info.storageFreeMb + ' MB free)'
            : 'Storage: ' + info.storage
        );
      }
      facts.forEach(function (text) {
        var span = document.createElement('span');
        span.textContent = text;
        el.appendChild(span);
      });
      el.classList.remove('hidden');
    });

    window.runtime.EventsOn('install:device-mode', function () {
      applyButtonImage('device');
      setDeviceWaiting(false);
      show('modal-device');
    });

    window.runtime.EventsOn('install:device-mode-done', function () {
      hide('modal-device');
    });

    window.runtime.EventsOn('install:device-mode-tick', function (data) {
      $('device-remaining').textContent = data.remaining;
      $('device-state').textContent = data.state;
    });

    window.runtime.EventsOn('install:reboot', function (data) {
      if (data && data.reason) {
        $('reboot-reason').textContent = data.reason;
      }
      applyButtonImage('reboot');
      setRebootWaiting(false);
      show('modal-reboot');
    });

    window.runtime.EventsOn('install:storage', function (data) {
      var list = $('storage-list');
      list.textContent = '';
      var choices = (data && data.choices) || [];
      choices.forEach(function (choice, index) {
        var label = document.createElement('label');
        label.className = 'storage-option';
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'storage';
        radio.value = choice.name;
        radio.checked = index === 0;
        var text = document.createElement('span');
        text.textContent =
          choice.freeMb >= 0 ? choice.label + ' (' + choice.freeMb + ' MB free)' : choice.label;
        label.appendChild(radio);
        label.appendChild(text);
        list.appendChild(label);
      });
      show('modal-storage');
    });

    window.runtime.EventsOn('install:reboot-auto', function (data) {
      if (data && data.reason) {
        $('reboot-reason').textContent = data.reason;
      }
      applyButtonImage('reboot');
      setRebootWaiting(true);
      show('modal-reboot');
      startRebootTimer();
    });

    window.runtime.EventsOn('install:reboot-done', function () {
      hide('modal-reboot');
      stopRebootTimer();
    });

    window.runtime.EventsOn('install:reboot-tick', function (data) {
      rebootElapsed = data.elapsed;
      $('reboot-elapsed').textContent = data.elapsed;
      $('reboot-state').textContent = data.state;
    });

    window.runtime.EventsOn('install:done', function (data) {
      running = false;
      hide('btn-cancel');
      hideModals();
      $('done-note').textContent = data.note || '';
      var urlsEl = $('done-urls');
      urlsEl.innerHTML = '';
      var urls = data.urls || [];
      urls.forEach(function (url) {
        var btn = document.createElement('button');
        btn.textContent = url;
        btn.addEventListener('click', function () {
          App.OpenURL(url);
        });
        urlsEl.appendChild(btn);
      });
      show('done');
      clearTimeout(panelReadyTimer);
      if (urls.length) {
        hide('done-urls');
        show('done-wait');
        panelReadyTimer = setTimeout(function () {
          hide('done-wait');
          show('done-urls');
        }, PANEL_READY_DELAY_MS);
      } else {
        hide('done-wait');
        show('done-urls');
      }
    });

    window.runtime.EventsOn('install:error', function (message) {
      running = false;
      onRunError(message);
    });
  }

  init();
})();
