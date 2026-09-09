(function () {
  'use strict';
  let revision = -1;
  async function refresh() {
    if (location.protocol === 'file:') return;
    try {
      const data = await MoriaStore.loadPublic();
      const footer = document.getElementById('data-atualizacao');
      if (footer) footer.textContent = 'ATUALIZADO EM ' + data.updatedDate;
      if (typeof features_JARDIMMORI_1 !== 'undefined' && revision !== data.revision) {
        data.objects.forEach(function (item) {
          const feature = features_JARDIMMORI_1[Number(item.id) - 1];
          if (feature) feature.setProperties({ SITUACAO: item.SITUACAO, STATUS: item.STATUS });
        });
        if (revision >= 0 && typeof overlayPopup !== 'undefined') overlayPopup.setPosition(undefined);
      }
      revision = data.revision;
      const warning = document.getElementById('sync-warning');
      if (warning) warning.remove();
    } catch (_) {
      if (!document.getElementById('sync-warning')) {
        const warning = document.createElement('div');
        warning.id = 'sync-warning';
        warning.setAttribute('role', 'status');
        warning.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fff3cd;color:#664d03;padding:8px;font:14px Arial;z-index:9999;text-align:center';
        warning.textContent = 'Sem conexão com as atualizações. Os dados exibidos podem estar desatualizados.';
        document.body.appendChild(warning);
      }
    }
  }
  refresh();
  setInterval(refresh, 10000);
  window.addEventListener('focus', refresh);
}());
