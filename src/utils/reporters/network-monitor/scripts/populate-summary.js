(function(){
  const { summaryData } = window.__NETWORK_DATA__;
  const container = document.getElementById('summary-table');
  container.innerHTML = '<h2>Summary Table</h2>';

  const table = document.createElement('table');
  table.className = 'sortable';
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    <th data-sort="string">URL</th>
    <th data-sort="number">Success</th>
    <th data-sort="number">Fail</th>
    <th data-sort="number">Fail %</th>
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  summaryData.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.url}</td><td>${r.success}</td><td>${r.fail}</td><td>${r.failPct}%</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  // Simple column sorting
  table.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const colIndex = [...th.parentNode.children].indexOf(th);
      const asc = th.dataset.asc !== 'true';
      const rows = Array.from(tbody.rows);
      rows.sort((a,b) => {
        const A = a.cells[colIndex].innerText;
        const B = b.cells[colIndex].innerText;
        return ((isNaN(A) ? A : parseFloat(A)) > (isNaN(B) ? B : parseFloat(B)) ? 1 : -1) * (asc ? 1 : -1);
      });
      rows.forEach(r => tbody.appendChild(r));
      th.dataset.asc = asc;
    });
  });
})();
