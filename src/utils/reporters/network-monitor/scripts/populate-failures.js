(function(){
  const { failuresData } = window.__NETWORK_DATA__;
  const container = document.getElementById('failures-pivot');
  container.innerHTML = '<h2>Failures Grouped by Test Name</h2>';

  const { pivot, failedUrls } = failuresData;
  if (!failedUrls || !failedUrls.length) {
    container.innerHTML += '<p>No failures recorded.</p>';
    return;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Test Name</th>${failedUrls.map(u => `<th>${u}</th>`).join('')}</tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  Object.entries(pivot).forEach(([testName, urlCounts]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${testName}</td>${failedUrls.map(url => `<td>${urlCounts[url]||0}</td>`).join('')}`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
})();
