(function(){
  const { domainData } = window.__NETWORK_DATA__;
  const container = document.getElementById('domains-accordion');
  container.innerHTML = '<h2>Grouped by Domain</h2>';

  Object.entries(domainData).forEach(([domain, urls]) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = domain;
    details.appendChild(summary);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>URL</th><th>Success</th><th>Fail</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    Object.entries(urls).forEach(([url, data]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${url}</td><td>${data.success}</td><td>${data.fail}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    details.appendChild(table);
    container.appendChild(details);
  });
})();
