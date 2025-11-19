document.querySelectorAll('th[data-sort]').forEach((header) => {
    header.addEventListener('click', () => {
        const table = header.closest('table');
        const tbody = table.querySelector('tbody');
        const columnIndex = [...header.parentNode.children].indexOf(header);
        const rows = [...tbody.children];
        const asc = header.dataset.asc !== 'true';

        rows.sort((a, b) => {
            const A = a.children[columnIndex].innerText;
            const B = b.children[columnIndex].innerText;
            return (A > B ? 1 : -1) * (asc ? 1 : -1);
        });

        rows.forEach((r) => tbody.appendChild(r));
        header.dataset.asc = String(asc);
    });
});
